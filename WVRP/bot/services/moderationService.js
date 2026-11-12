import db from '../database/index.js';
import {
  WvrpEmbedBuilder,
  createModerationConfirmationV2,
  createModerationDmV2,
  createModerationLogV2,
  createModerationStatsV2,
  createModerationHistoryV2,
  createModerationCaseInfoV2
} from '../embeds/wvrpEmbeds.js';
import { PermissionFlagsBits } from 'discord.js';

/**
 * WVRP Moderation Service
 * Handles sequential MOD-0001 case numbering, Discord native moderation actions,
 * Discord Components V2 formatting, automatic DMs, audit logging, and SQLite persistence.
 */
class ModerationService {
  /**
   * Generates next guaranteed unique sequential case ID in format MOD-0001
   * Thread-safe and process-safe with SQLite atomic transaction.
   */
  getNextCaseId() {
    const getNext = db.transaction(() => {
      let row = db.prepare('SELECT current_val FROM moderation_counters WHERE name = ?').get('moderation');
      if (!row) {
        const maxRow = db.prepare('SELECT MAX(case_number) as max_num FROM moderation_cases').get();
        const start = (maxRow && maxRow.max_num) ? maxRow.max_num : 0;
        db.prepare('INSERT INTO moderation_counters (name, current_val) VALUES (?, ?)').run('moderation', start);
        row = { current_val: start };
      }
      const nextVal = row.current_val + 1;
      db.prepare('UPDATE moderation_counters SET current_val = ? WHERE name = ?').run(nextVal, 'moderation');
      return nextVal;
    });

    const caseNumber = getNext();
    const caseId = `MOD-${String(caseNumber).padStart(4, '0')}`;
    return { caseNumber, caseId };
  }

  /**
   * Parse human-readable duration into milliseconds & formatted description
   * Supports e.g. '5m', '10m', '30m', '1h', '2h', '1d', '7d', '14d', '28d'
   */
  parseDuration(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Duration must be a string like "10m", "1h", "1d", "7d".');
    }

    const trimmed = input.trim().toLowerCase();
    const regex = /^(\d+)\s*(s|sec|m|min|minute|minutes|h|hr|hour|hours|d|day|days|w|week|weeks)?$/;
    const match = trimmed.match(regex);

    if (!match) {
      throw new Error('Invalid duration format. Examples: 10m, 1h, 1d, 7d (max 28 days).');
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2] || 'm';

    let ms = 0;
    let formatted = '';

    switch (unit) {
      case 's':
      case 'sec':
        ms = amount * 1000;
        formatted = `${amount} second${amount === 1 ? '' : 's'}`;
        break;
      case 'm':
      case 'min':
      case 'minute':
      case 'minutes':
        ms = amount * 60 * 1000;
        formatted = `${amount} minute${amount === 1 ? '' : 's'}`;
        break;
      case 'h':
      case 'hr':
      case 'hour':
      case 'hours':
        ms = amount * 60 * 60 * 1000;
        formatted = `${amount} hour${amount === 1 ? '' : 's'}`;
        break;
      case 'd':
      case 'day':
      case 'days':
        ms = amount * 24 * 60 * 60 * 1000;
        formatted = `${amount} day${amount === 1 ? '' : 's'}`;
        break;
      case 'w':
      case 'week':
      case 'weeks':
        ms = amount * 7 * 24 * 60 * 60 * 1000;
        formatted = `${amount} week${amount === 1 ? '' : 's'}`;
        break;
      default:
        ms = amount * 60 * 1000;
        formatted = `${amount} minutes`;
    }

    const MAX_DISCORD_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000; // 28 days
    if (ms > MAX_DISCORD_TIMEOUT_MS) {
      throw new Error('Discord native timeouts cannot exceed 28 days (4 weeks).');
    }
    if (ms < 1000) {
      throw new Error('Timeout duration must be at least 1 second.');
    }

    return {
      ms,
      seconds: Math.floor(ms / 1000),
      formatted
    };
  }

  /**
   * Validates permissions and Discord role hierarchy
   */
  validateHierarchy({ guild, moderatorMember, targetMember, targetUserId, botUser }) {
    if (targetUserId === moderatorMember.id) {
      return { valid: false, error: 'You cannot perform moderation actions on yourself.' };
    }

    if (botUser && targetUserId === botUser.id) {
      return { valid: false, error: 'You cannot perform moderation actions on the bot.' };
    }

    if (guild && targetUserId === guild.ownerId) {
      return { valid: false, error: 'You cannot moderate the server owner.' };
    }

    if (targetMember && moderatorMember) {
      const isOwner = moderatorMember.id === guild.ownerId;
      if (!isOwner && targetMember.roles?.highest && moderatorMember.roles?.highest) {
        if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
          return {
            valid: false,
            error: 'Role Hierarchy Violation: You cannot moderate a member whose highest role is equal to or higher than yours.'
          };
        }
      }
    }

    if (guild && targetMember && guild.members?.me) {
      const botMember = guild.members.me;
      if (targetMember.roles?.highest && botMember.roles?.highest) {
        if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
          return {
            valid: false,
            error: 'Bot Hierarchy Violation: The bot cannot moderate this member because their highest role is equal to or higher than the bot\'s role.'
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Send moderation log entry to the configured channel in Components V2 format
   */
  async broadcastLog(client, logData) {
    const channelId = process.env.MOD_LOG_CHANNEL_ID || process.env.STAFF_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID;
    if (!channelId || !client) return;

    try {
      const channel = client.channels?.cache?.get(channelId) || (await client.channels?.fetch?.(channelId).catch(() => null));
      if (channel && typeof channel.send === 'function') {
        const payload = createModerationLogV2(logData);
        await channel.send(payload);
      }
    } catch (err) {
      console.warn(`[ModerationService] Could not send log to channel ${channelId}:`, err.message);
    }
  }

  /**
   * Execute BAN
   */
  async executeBan({ guild, targetUser, targetMember, moderatorUser, moderatorMember, reason, deleteDays = 0, client }) {
    const targetUserId = targetUser.id;
    const targetUsername = targetUser.tag || targetUser.username || targetUserId;
    const moderatorId = moderatorUser.id;
    const moderatorUsername = moderatorUser.tag || moderatorUser.username || moderatorId;

    // Validate hierarchy
    if (moderatorMember) {
      const validation = this.validateHierarchy({
        guild,
        moderatorMember,
        targetMember,
        targetUserId,
        botUser: client?.user
      });
      if (!validation.valid) return { success: false, error: validation.error };
    }

    // Check if user is already banned
    if (guild?.bans) {
      try {
        const existingBan = await guild.bans.fetch(targetUserId).catch(() => null);
        if (existingBan) {
          return { success: false, error: `Member <@${targetUserId}> is already banned from this server.` };
        }
      } catch (e) {
        // Continue if ban lookup check fails
      }
    }

    const { caseNumber, caseId } = this.getNextCaseId();
    const now = Date.now();
    let dmStatus = 'NOT_DELIVERED';

    // 1. Send Ban DM in Components V2 BEFORE banning so the user receives it
    const dmRecipient = targetMember?.user || targetUser;
    if (dmRecipient && typeof dmRecipient.send === 'function') {
      try {
        const dmPayload = createModerationDmV2({
          action: 'BAN',
          caseId,
          communityName: guild?.name || 'West Virginia State Roleplay',
          moderator: moderatorUser,
          reason,
          date: now,
          appealUrl: process.env.BAN_APPEAL_URL || 'https://discord.gg/wvrp'
        });
        await dmRecipient.send(dmPayload);
        dmStatus = 'DELIVERED';
      } catch (dmErr) {
        console.warn(`[ModerationService] Ban DM delivery to ${targetUserId} failed:`, dmErr.message);
        dmStatus = 'CLOSED_DMS';
      }
    }

    // 2. Perform native Discord Guild Ban
    let executionStatus = 'SUCCESSFUL';
    if (guild?.bans) {
      try {
        const deleteSeconds = Math.min(Math.max(deleteDays, 0), 7) * 86400;
        await guild.bans.create(targetUserId, {
          reason: `[${caseId}] ${reason} (by ${moderatorUsername})`,
          deleteMessageSeconds: deleteSeconds
        });
      } catch (banErr) {
        return { success: false, error: `Discord API Ban failed: ${banErr.message}` };
      }
    }

    // 3. Persist permanently in database
    db.prepare(`
      INSERT INTO moderation_cases (
        id, case_number, action_type, target_id, target_username, moderator_id, moderator_username,
        reason, duration, duration_seconds, timestamp, expiration_timestamp, status, dm_status,
        delete_message_days
      ) VALUES (?, ?, 'BAN', ?, ?, ?, ?, ?, NULL, 0, ?, NULL, 'ACTIVE', ?, ?)
    `).run(
      caseId,
      caseNumber,
      targetUserId,
      targetUsername,
      moderatorId,
      moderatorUsername,
      reason,
      now,
      dmStatus,
      deleteDays
    );

    // 4. Audit log entry
    try {
      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('MOD_BAN', ?, ?, ?, ?)
      `).run(moderatorId, targetUserId, `[${caseId}] ${reason}`, now);
    } catch (e) {
      // audit log optional
    }

    // 5. Broadcast to log channel in Components V2
    await this.broadcastLog(client, {
      caseId,
      action: 'BAN',
      target: targetUser,
      moderator: moderatorUser,
      reason,
      timestamp: now,
      dmStatus,
      executionStatus
    });

    // 6. Generate confirmation interface in Components V2
    const confirmationPayload = createModerationConfirmationV2({
      caseId,
      action: 'BAN',
      target: targetUser,
      moderator: moderatorUser,
      reason,
      date: now,
      status: executionStatus,
      dmStatus
    });

    const caseData = db.prepare('SELECT * FROM moderation_cases WHERE id = ?').get(caseId);

    return {
      success: true,
      caseId,
      caseData,
      payload: confirmationPayload
    };
  }

  /**
   * Execute KICK
   */
  async executeKick({ guild, targetUser, targetMember, moderatorUser, moderatorMember, reason, client }) {
    const targetUserId = targetUser.id;
    const targetUsername = targetUser.tag || targetUser.username || targetUserId;
    const moderatorId = moderatorUser.id;
    const moderatorUsername = moderatorUser.tag || moderatorUser.username || moderatorId;

    if (!targetMember) {
      return { success: false, error: `Member <@${targetUserId}> is not currently in this server.` };
    }

    if (moderatorMember) {
      const validation = this.validateHierarchy({
        guild,
        moderatorMember,
        targetMember,
        targetUserId,
        botUser: client?.user
      });
      if (!validation.valid) return { success: false, error: validation.error };
    }

    if (targetMember.kickable === false) {
      return { success: false, error: 'Cannot kick this member: The bot lacks permission or the member has a higher role.' };
    }

    const { caseNumber, caseId } = this.getNextCaseId();
    const now = Date.now();
    let dmStatus = 'NOT_DELIVERED';

    // 1. Send Kick DM in Components V2 BEFORE kicking
    const dmRecipient = targetMember?.user || targetUser;
    if (dmRecipient && typeof dmRecipient.send === 'function') {
      try {
        const dmPayload = createModerationDmV2({
          action: 'KICK',
          caseId,
          communityName: guild?.name || 'West Virginia State Roleplay',
          moderator: moderatorUser,
          reason,
          date: now
        });
        await dmRecipient.send(dmPayload);
        dmStatus = 'DELIVERED';
      } catch (dmErr) {
        console.warn(`[ModerationService] Kick DM delivery to ${targetUserId} failed:`, dmErr.message);
        dmStatus = 'CLOSED_DMS';
      }
    }

    // 2. Perform native Discord kick
    let executionStatus = 'SUCCESSFUL';
    try {
      await targetMember.kick(`[${caseId}] ${reason} (by ${moderatorUsername})`);
    } catch (kickErr) {
      return { success: false, error: `Discord API Kick failed: ${kickErr.message}` };
    }

    // 3. Persist permanently in database
    db.prepare(`
      INSERT INTO moderation_cases (
        id, case_number, action_type, target_id, target_username, moderator_id, moderator_username,
        reason, duration, duration_seconds, timestamp, expiration_timestamp, status, dm_status
      ) VALUES (?, ?, 'KICK', ?, ?, ?, ?, ?, NULL, 0, ?, NULL, 'COMPLETED', ?)
    `).run(
      caseId,
      caseNumber,
      targetUserId,
      targetUsername,
      moderatorId,
      moderatorUsername,
      reason,
      now,
      dmStatus
    );

    // 4. Audit log entry
    try {
      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('MOD_KICK', ?, ?, ?, ?)
      `).run(moderatorId, targetUserId, `[${caseId}] ${reason}`, now);
    } catch (e) {
      // audit log optional
    }

    // 5. Broadcast to log channel in Components V2
    await this.broadcastLog(client, {
      caseId,
      action: 'KICK',
      target: targetUser,
      moderator: moderatorUser,
      reason,
      timestamp: now,
      dmStatus,
      executionStatus
    });

    // 6. Generate confirmation interface in Components V2
    const confirmationPayload = createModerationConfirmationV2({
      caseId,
      action: 'KICK',
      target: targetUser,
      moderator: moderatorUser,
      reason,
      date: now,
      status: executionStatus,
      dmStatus
    });

    const caseData = db.prepare('SELECT * FROM moderation_cases WHERE id = ?').get(caseId);

    return {
      success: true,
      caseId,
      caseData,
      payload: confirmationPayload
    };
  }

  /**
   * Execute MUTE (Native Discord Timeout)
   */
  async executeMute({ guild, targetUser, targetMember, moderatorUser, moderatorMember, durationStr, reason, client }) {
    const targetUserId = targetUser.id;
    const targetUsername = targetUser.tag || targetUser.username || targetUserId;
    const moderatorId = moderatorUser.id;
    const moderatorUsername = moderatorUser.tag || moderatorUser.username || moderatorId;

    if (!targetMember) {
      return { success: false, error: `Member <@${targetUserId}> is not currently in this server.` };
    }

    let parsedDuration;
    try {
      parsedDuration = this.parseDuration(durationStr);
    } catch (parseErr) {
      return { success: false, error: parseErr.message };
    }

    if (moderatorMember) {
      const validation = this.validateHierarchy({
        guild,
        moderatorMember,
        targetMember,
        targetUserId,
        botUser: client?.user
      });
      if (!validation.valid) return { success: false, error: validation.error };
    }

    if (targetMember.moderatable === false) {
      return { success: false, error: 'Cannot timeout this member: The bot lacks permission or the member has a higher role.' };
    }

    const { caseNumber, caseId } = this.getNextCaseId();
    const now = Date.now();
    const expirationTimestamp = now + parsedDuration.ms;
    let dmStatus = 'NOT_DELIVERED';

    // 1. Send Mute DM in Components V2
    const dmRecipient = targetMember?.user || targetUser;
    if (dmRecipient && typeof dmRecipient.send === 'function') {
      try {
        const dmPayload = createModerationDmV2({
          action: 'MUTE',
          caseId,
          communityName: guild?.name || 'West Virginia State Roleplay',
          moderator: moderatorUser,
          reason,
          date: now,
          duration: parsedDuration.formatted,
          expiration: expirationTimestamp
        });
        await dmRecipient.send(dmPayload);
        dmStatus = 'DELIVERED';
      } catch (dmErr) {
        console.warn(`[ModerationService] Mute DM delivery to ${targetUserId} failed:`, dmErr.message);
        dmStatus = 'CLOSED_DMS';
      }
    }

    // 2. Perform native Discord Timeout
    let executionStatus = 'SUCCESSFUL';
    try {
      await targetMember.timeout(parsedDuration.ms, `[${caseId}] ${reason} (by ${moderatorUsername})`);
    } catch (muteErr) {
      return { success: false, error: `Discord API Timeout failed: ${muteErr.message}` };
    }

    // 3. Persist permanently in database
    db.prepare(`
      INSERT INTO moderation_cases (
        id, case_number, action_type, target_id, target_username, moderator_id, moderator_username,
        reason, duration, duration_seconds, timestamp, expiration_timestamp, status, dm_status
      ) VALUES (?, ?, 'MUTE', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).run(
      caseId,
      caseNumber,
      targetUserId,
      targetUsername,
      moderatorId,
      moderatorUsername,
      reason,
      parsedDuration.formatted,
      parsedDuration.seconds,
      now,
      expirationTimestamp,
      dmStatus
    );

    // 4. Audit log entry
    try {
      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('MOD_MUTE', ?, ?, ?, ?)
      `).run(moderatorId, targetUserId, `[${caseId}] ${parsedDuration.formatted} - ${reason}`, now);
    } catch (e) {
      // audit log optional
    }

    // 5. Broadcast to log channel in Components V2
    await this.broadcastLog(client, {
      caseId,
      action: 'MUTE',
      target: targetUser,
      moderator: moderatorUser,
      reason,
      duration: parsedDuration.formatted,
      timestamp: now,
      dmStatus,
      executionStatus
    });

    // 6. Generate confirmation interface in Components V2
    const confirmationPayload = createModerationConfirmationV2({
      caseId,
      action: 'MUTE',
      target: targetUser,
      moderator: moderatorUser,
      reason,
      duration: parsedDuration.formatted,
      date: now,
      status: executionStatus,
      dmStatus
    });

    const caseData = db.prepare('SELECT * FROM moderation_cases WHERE id = ?').get(caseId);

    return {
      success: true,
      caseId,
      caseData,
      payload: confirmationPayload
    };
  }

  /**
   * Execute UNMUTE (Remove native Discord Timeout)
   */
  async executeUnmute({ guild, targetUser, targetMember, moderatorUser, moderatorMember, reason = 'Mute lifted by moderator', client }) {
    const targetUserId = targetUser.id;
    const targetUsername = targetUser.tag || targetUser.username || targetUserId;
    const moderatorId = moderatorUser.id;
    const moderatorUsername = moderatorUser.tag || moderatorUser.username || moderatorId;

    if (!targetMember) {
      return { success: false, error: `Member <@${targetUserId}> is not currently in this server.` };
    }

    // Check if member is actually timed out
    const isCurrentlyMuted = targetMember.communicationDisabledUntilTimestamp && targetMember.communicationDisabledUntilTimestamp > Date.now();
    const activeDbMute = db.prepare(`
      SELECT * FROM moderation_cases
      WHERE target_id = ? AND action_type = 'MUTE' AND status = 'ACTIVE'
      ORDER BY timestamp DESC LIMIT 1
    `).get(targetUserId);

    if (!isCurrentlyMuted && !activeDbMute) {
      return { success: false, error: `Member <@${targetUserId}> is not currently muted or timed out.` };
    }

    if (moderatorMember) {
      const validation = this.validateHierarchy({
        guild,
        moderatorMember,
        targetMember,
        targetUserId,
        botUser: client?.user
      });
      if (!validation.valid) return { success: false, error: validation.error };
    }

    const { caseNumber, caseId } = this.getNextCaseId();
    const now = Date.now();
    const relatedCaseId = activeDbMute?.id || null;
    let dmStatus = 'NOT_DELIVERED';

    // 1. Send Unmute DM in Components V2
    const dmRecipient = targetMember?.user || targetUser;
    if (dmRecipient && typeof dmRecipient.send === 'function') {
      try {
        const dmPayload = createModerationDmV2({
          action: 'UNMUTE',
          caseId,
          communityName: guild?.name || 'West Virginia State Roleplay',
          moderator: moderatorUser,
          reason,
          date: now,
          relatedCaseId
        });
        await dmRecipient.send(dmPayload);
        dmStatus = 'DELIVERED';
      } catch (dmErr) {
        console.warn(`[ModerationService] Unmute DM delivery to ${targetUserId} failed:`, dmErr.message);
        dmStatus = 'CLOSED_DMS';
      }
    }

    // 2. Perform native Discord Timeout removal
    let executionStatus = 'SUCCESSFUL';
    try {
      await targetMember.timeout(null, `[${caseId}] Unmuted: ${reason} (by ${moderatorUsername})`);
    } catch (unmuteErr) {
      return { success: false, error: `Discord API Unmute failed: ${unmuteErr.message}` };
    }

    // 3. Mark previous active mute as REVOKED
    if (activeDbMute) {
      db.prepare("UPDATE moderation_cases SET status = 'REVOKED' WHERE id = ?").run(activeDbMute.id);
    }

    // 4. Persist unmute case permanently in database
    db.prepare(`
      INSERT INTO moderation_cases (
        id, case_number, action_type, target_id, target_username, moderator_id, moderator_username,
        reason, duration, duration_seconds, timestamp, expiration_timestamp, status, dm_status,
        related_case_id
      ) VALUES (?, ?, 'UNMUTE', ?, ?, ?, ?, ?, NULL, 0, ?, NULL, 'COMPLETED', ?, ?)
    `).run(
      caseId,
      caseNumber,
      targetUserId,
      targetUsername,
      moderatorId,
      moderatorUsername,
      reason,
      now,
      dmStatus,
      relatedCaseId
    );

    // 5. Audit log entry
    try {
      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('MOD_UNMUTE', ?, ?, ?, ?)
      `).run(moderatorId, targetUserId, `[${caseId}] ${reason}`, now);
    } catch (e) {
      // audit log optional
    }

    // 6. Broadcast to log channel in Components V2
    await this.broadcastLog(client, {
      caseId,
      action: 'UNMUTE',
      target: targetUser,
      moderator: moderatorUser,
      reason,
      timestamp: now,
      dmStatus,
      executionStatus
    });

    // 7. Generate confirmation interface in Components V2
    const confirmationPayload = createModerationConfirmationV2({
      caseId,
      action: 'UNMUTE',
      target: targetUser,
      moderator: moderatorUser,
      reason,
      date: now,
      status: executionStatus,
      dmStatus
    });

    const caseData = db.prepare('SELECT * FROM moderation_cases WHERE id = ?').get(caseId);

    return {
      success: true,
      caseId,
      caseData,
      payload: confirmationPayload
    };
  }

  /**
   * Get real-time moderation statistics directly from database
   */
  getStats(filter = 'ALL', filterUserId = null) {
    const now = Date.now();

    // Auto-update expired mutes status
    try {
      db.prepare(`
        UPDATE moderation_cases
        SET status = 'EXPIRED'
        WHERE action_type = 'MUTE' AND status = 'ACTIVE' AND expiration_timestamp IS NOT NULL AND expiration_timestamp < ?
      `).run(now);
    } catch (e) {
      // ignore
    }

    let baseQuery = 'FROM moderation_cases';
    const params = [];

    if (filter === 'BAN') {
      baseQuery += ' WHERE action_type = ?';
      params.push('BAN');
    } else if (filter === 'KICK') {
      baseQuery += ' WHERE action_type = ?';
      params.push('KICK');
    } else if (filter === 'MUTE') {
      baseQuery += ' WHERE action_type = ?';
      params.push('MUTE');
    } else if (filter === 'UNMUTE') {
      baseQuery += ' WHERE action_type = ?';
      params.push('UNMUTE');
    } else if (filter === 'MODERATOR' && filterUserId) {
      baseQuery += ' WHERE moderator_id = ?';
      params.push(filterUserId);
    } else if (filter === 'MEMBER' && filterUserId) {
      baseQuery += ' WHERE target_id = ?';
      params.push(filterUserId);
    }

    const totalCases = db.prepare(`SELECT COUNT(*) as count ${baseQuery}`).get(...params)?.count || 0;
    const bans = db.prepare("SELECT COUNT(*) as count FROM moderation_cases WHERE action_type = 'BAN'").get()?.count || 0;
    const kicks = db.prepare("SELECT COUNT(*) as count FROM moderation_cases WHERE action_type = 'KICK'").get()?.count || 0;
    const mutes = db.prepare("SELECT COUNT(*) as count FROM moderation_cases WHERE action_type = 'MUTE'").get()?.count || 0;
    const unmutes = db.prepare("SELECT COUNT(*) as count FROM moderation_cases WHERE action_type = 'UNMUTE'").get()?.count || 0;
    const activeMutes = db.prepare("SELECT COUNT(*) as count FROM moderation_cases WHERE action_type = 'MUTE' AND status = 'ACTIVE' AND expiration_timestamp > ?").get(now)?.count || 0;
    const activeModerators = db.prepare("SELECT COUNT(DISTINCT moderator_id) as count FROM moderation_cases").get()?.count || 0;

    return {
      totalCases,
      bans,
      kicks,
      mutes,
      unmutes,
      activeMutes,
      activeModerators,
      filter
    };
  }

  /**
   * Retrieve moderation history for a target user with pagination
   */
  getHistory(targetUserId, page = 1, limit = 5) {
    const cleanId = String(targetUserId).replace(/[<@!>]/g, '').trim();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM moderation_cases WHERE target_id = ?').get(cleanId);
    const totalCases = countRow ? countRow.count : 0;
    const totalPages = Math.max(1, Math.ceil(totalCases / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * limit;

    const cases = db.prepare(`
      SELECT * FROM moderation_cases
      WHERE target_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(cleanId, limit, offset);

    return {
      targetId: cleanId,
      page: safePage,
      limit,
      totalPages,
      totalCases,
      cases
    };
  }

  /**
   * Retrieve single case file by ID (e.g. MOD-0001 or 1)
   */
  getCase(caseIdOrNumber) {
    if (!caseIdOrNumber) return null;
    const input = String(caseIdOrNumber).trim();
    let query = 'SELECT * FROM moderation_cases WHERE id = ?';
    let param = input;

    if (/^\d+$/.test(input)) {
      query = 'SELECT * FROM moderation_cases WHERE case_number = ? OR id = ?';
      param = parseInt(input, 10);
      return db.prepare(query).get(param, `MOD-${String(param).padStart(4, '0')}`);
    }

    if (!input.toUpperCase().startsWith('MOD-')) {
      param = `MOD-${input.toUpperCase().padStart(4, '0')}`;
    } else {
      param = input.toUpperCase();
    }

    return db.prepare(query).get(param);
  }

  /**
   * Retrieve recent cases with optional filters for dashboard
   */
  getAllCases({ action = 'ALL', limit = 50, page = 1 } = {}) {
    let sql = 'SELECT * FROM moderation_cases';
    const params = [];

    if (action && action !== 'ALL') {
      sql += ' WHERE action_type = ?';
      params.push(action.toUpperCase());
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    const offset = (Math.max(1, page) - 1) * limit;
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  }
}

export const moderationService = new ModerationService();
export default moderationService;
