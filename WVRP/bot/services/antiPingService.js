import db from '../database/index.js';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export class AntiPingService {
  constructor() {
    this.defaultGif = 'https://media.discordapp.net/attachments/1554305957465690113/1568899307250126899/anti_ping.gif';
  }

  // Parse comma-separated list of IDs or names from env var
  parseList(envVar) {
    if (!envVar || typeof envVar !== 'string') return [];
    return envVar
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  isEnabled() {
    return process.env.ANTI_PING_ENABLED !== 'false';
  }

  getRoleConfig() {
    return {
      foundership: this.parseList(process.env.ANTI_PING_FOUNDERSHIP_ROLE_IDS),
      foundation: this.parseList(process.env.ANTI_PING_FOUNDATION_TEAM_ROLE_IDS),
      directive: this.parseList(process.env.ANTI_PING_DIRECTIVE_TEAM_ROLE_IDS),
      protected: this.parseList(process.env.ANTI_PING_PROTECTED_ROLE_IDS),
      exemptRoles: this.parseList(process.env.ANTI_PING_EXEMPT_ROLE_IDS),
      exemptUsers: this.parseList(process.env.ANTI_PING_EXEMPT_USER_IDS)
    };
  }

  getConfig() {
    return {
      enabled: this.isEnabled(),
      strikesPerTier: parseInt(process.env.ANTI_PING_STRIKES_PER_TIER || '3', 10),
      strikeResetHours: parseFloat(process.env.ANTI_PING_STRIKE_RESET_HOURS || '24'),
      muteTier1Minutes: parseInt(process.env.ANTI_PING_MUTE_TIER_1_MINUTES || '10', 10),
      muteTier2Minutes: parseInt(process.env.ANTI_PING_MUTE_TIER_2_MINUTES || '60', 10),
      muteTier3Minutes: parseInt(process.env.ANTI_PING_MUTE_TIER_3_MINUTES || '1440', 10),
      sendWarning: process.env.ANTI_PING_SEND_WARNING !== 'false',
      logChannelId: process.env.ANTI_PING_LOG_CHANNEL_ID || null,
      gifUrl: process.env.ANTI_PING_GIF_URL || this.defaultGif,
      ...this.getRoleConfig()
    };
  }

  // Check if a member holds a specific role by ID or case-insensitive name
  memberHasRole(member, roleIdOrName) {
    if (!member || !member.roles?.cache) return false;
    const target = roleIdOrName.toLowerCase();
    return member.roles.cache.some(r => r.id === roleIdOrName || r.name.toLowerCase() === target);
  }

  // Check if an author is exempt from Anti-Ping
  isExempt(member, user) {
    if (!user) return false;
    if (user.bot) return true;

    const config = this.getRoleConfig();

    // Explicit exempt user IDs
    if (config.exemptUsers.includes(user.id)) return true;

    if (member) {
      // Administrators are exempt
      if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;

      // Explicit exempt role IDs or names
      for (const exemptRole of config.exemptRoles) {
        if (this.memberHasRole(member, exemptRole)) return true;
      }

      // Members who belong to leadership themselves do not get punished for pinging colleagues
      const allLeadershipRoles = [
        ...config.foundership,
        ...config.foundation,
        ...config.directive,
        'foundership',
        'foundation team',
        'directive team',
        'community directive'
      ];
      for (const lRole of allLeadershipRoles) {
        if (this.memberHasRole(member, lRole)) return true;
      }
    }

    return false;
  }

  /**
   * Check a message for unauthorized leadership role pings or user pings.
   * Returns detection payload or null.
   */
  checkMessage(message) {
    if (!this.isEnabled()) return null;
    if (!message || !message.author || message.author.bot) return null;

    const member = message.member;
    if (this.isExempt(member, message.author)) return null;

    const config = this.getRoleConfig();

    // Map priority of teams
    const teamDefinitions = [
      {
        name: 'Foundership Team',
        roles: config.foundership,
        namePatterns: ['foundership', 'founder', 'owner', 'co-founder']
      },
      {
        name: 'Foundation Team',
        roles: config.foundation,
        namePatterns: ['foundation', 'foundation team']
      },
      {
        name: 'Directive Team',
        roles: config.directive,
        namePatterns: ['directive', 'directive team', 'community directive']
      },
      {
        name: 'Protected Leadership Team',
        roles: config.protected,
        namePatterns: ['protected']
      }
    ];

    // 1. Direct role mentions
    if (message.mentions.roles && message.mentions.roles.size > 0) {
      for (const def of teamDefinitions) {
        for (const [roleId, role] of message.mentions.roles) {
          const matchId = def.roles.includes(roleId);
          const matchName = def.namePatterns.some(pat => role.name.toLowerCase().includes(pat));
          if (matchId || matchName) {
            return {
              detected: true,
              type: 'ROLE_MENTION',
              teamName: def.name,
              targetRoleId: roleId,
              targetRoleName: role.name,
              targetUserId: null
            };
          }
        }
      }
    }

    // 2. Member / User mentions (including replies with mention toggle on)
    if (message.mentions.members && message.mentions.members.size > 0) {
      for (const [targetUserId, targetMember] of message.mentions.members) {
        // Do not trigger on self-pings
        if (targetUserId === message.author.id) continue;

        for (const def of teamDefinitions) {
          const hasId = def.roles.some(rid => this.memberHasRole(targetMember, rid));
          const hasName = def.namePatterns.some(pat => {
            return targetMember.roles?.cache?.some(r => r.name.toLowerCase().includes(pat));
          });

          if (hasId || hasName) {
            return {
              detected: true,
              type: 'USER_MENTION',
              teamName: def.name,
              targetRoleId: null,
              targetUserId,
              targetUserTag: targetMember.user?.tag || targetMember.user?.username
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Process a detected Anti-Ping violation.
   * Handles database persistence, escalating strike counter, timeouts, and warning embeds.
   */
  async processViolation(message, detection) {
    const config = this.getConfig();
    const userId = message.author.id;
    const guildId = message.guild?.id || 'wvrp_guild';
    const userTag = message.author.tag || message.author.username;
    const now = Date.now();

    // Check existing strikes and reset period
    let record = db.prepare('SELECT * FROM anti_ping_strikes WHERE user_id = ?').get(userId);
    let strikeCount = 0;

    if (record) {
      const hoursSinceLast = (now - (record.last_strike_at || 0)) / (1000 * 60 * 60);
      if (hoursSinceLast >= config.strikeResetHours) {
        strikeCount = 0; // Reset period passed
      } else {
        strikeCount = record.strike_count || 0;
      }
    }

    // Increment strike
    strikeCount += 1;

    // Calculate tier and punishment
    const strikesPerTier = config.strikesPerTier;
    const currentTier = Math.max(1, Math.ceil(strikeCount / strikesPerTier));
    const strikeInTier = ((strikeCount - 1) % strikesPerTier) + 1;
    const isMuteStrike = (strikeInTier === strikesPerTier);

    let action = 'WARNING';
    let muteMinutes = 0;
    let durationText = '';

    if (isMuteStrike) {
      action = 'MUTE';
      if (currentTier === 1) {
        muteMinutes = config.muteTier1Minutes;
        durationText = '10 minutes';
      } else if (currentTier === 2) {
        muteMinutes = config.muteTier2Minutes;
        durationText = '1 hour';
      } else {
        muteMinutes = config.muteTier3Minutes;
        durationText = '24 hours';
      }
    }

    // Determine next punishment info for warning display
    let nextMuteText = '10 minutes';
    if (currentTier === 2) nextMuteText = '1 hour';
    if (currentTier >= 3) nextMuteText = '24 hours';

    // Execute timeout if mute tier reached
    let timeoutApplied = false;
    let timeoutError = null;
    if (action === 'MUTE' && message.member?.timeout) {
      try {
        await message.member.timeout(
          muteMinutes * 60 * 1000,
          `Anti-Ping Strike ${strikeCount} (${currentTier}/3): Unauthorized ping of ${detection.teamName}`
        );
        timeoutApplied = true;
      } catch (err) {
        timeoutError = err.message;
        console.warn(`Anti-Ping timeout warning for user ${userId}:`, err.message);
      }
    }

    // Attempt to delete offending message
    let messageDeleted = false;
    try {
      if (message.deletable) {
        await message.delete();
        messageDeleted = true;
      }
    } catch (e) {
      // Ignore message deletion permission errors
    }

    // Persist strikes in database
    db.prepare(`
      INSERT INTO anti_ping_strikes (user_id, guild_id, user_tag, strike_count, tier, last_strike_at, last_punishment, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        strike_count = excluded.strike_count,
        tier = excluded.tier,
        user_tag = excluded.user_tag,
        last_strike_at = excluded.last_strike_at,
        last_punishment = excluded.last_punishment,
        updated_at = excluded.updated_at
    `).run(
      userId,
      guildId,
      userTag,
      strikeCount,
      currentTier,
      now,
      action === 'MUTE' ? `MUTE_${muteMinutes}M` : 'WARNING',
      now
    );

    // Record in audit log
    db.prepare(`
      INSERT INTO anti_ping_logs (user_id, user_tag, target_role_id, target_team_name, strike_number, tier, punishment, duration_minutes, channel_id, message_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      userTag,
      detection.targetRoleId || detection.targetUserId,
      detection.teamName,
      strikeCount,
      currentTier,
      action,
      muteMinutes,
      message.channel?.id || 'channel_unknown',
      message.id || 'msg_unknown',
      now
    );

    // Construct Embed matching screenshot specification
    const embed = new EmbedBuilder()
      .setColor(action === 'MUTE' ? 0xed4245 : 0xfee75c)
      .setTitle('⚠️ Please Don\'t Ping')
      .setDescription(
        `<@${userId}>, you can't ping members of the **${detection.teamName}**.\n\nIf you're replying to one of them, turn the ping off first. The GIF below shows you how.`
      )
      .setImage(config.gifUrl)
      .setFooter({ text: 'West Virginia Roleplay · Anti-Ping Security System' })
      .setTimestamp(new Date());

    if (action === 'WARNING') {
      embed.addFields([
        {
          name: 'Strike Counter',
          value: `\`${strikeInTier}/${strikesPerTier} today. Reach ${strikesPerTier} and you'll be muted for ${nextMuteText}.\``
        }
      ]);
    } else {
      embed.addFields([
        {
          name: 'Punishment Enforced',
          value: `\`${strikeInTier}/${strikesPerTier} today. You have been muted for ${durationText}.\`${
            timeoutError ? `\n*(Note: Discord timeout could not be applied: ${timeoutError})*` : ''
          }`
        }
      ]);
    }

    // Send warning to channel
    let sentMessage = null;
    if (config.sendWarning && message.channel?.send) {
      try {
        sentMessage = await message.channel.send({
          content: `<@${userId}>`,
          embeds: [embed]
        });
      } catch (e) {
        console.warn('Failed to send Anti-Ping warning embed:', e.message);
      }
    }

    // Optional notification to log channel
    if (config.logChannelId && message.guild) {
      try {
        const logChannel = message.guild.channels?.cache?.get(config.logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('🛡️ Anti-Ping Violation Log')
            .setDescription(
              `**Member:** <@${userId}> (\`${userTag}\` - ID: \`${userId}\`)\n` +
              `**Target Team:** ${detection.teamName}\n` +
              `**Strike Count:** ${strikeCount} (Tier ${currentTier})\n` +
              `**Punishment:** ${action === 'MUTE' ? `Mute (${durationText})` : 'Warning'}\n` +
              `**Channel:** <#${message.channel?.id}>\n` +
              `**Message Deleted:** ${messageDeleted ? 'Yes' : 'No'}`
            )
            .setTimestamp(new Date());
          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (err) {
        console.warn('Failed to send Anti-Ping log to logChannel:', err.message);
      }
    }

    return {
      success: true,
      action,
      strikeCount,
      currentTier,
      strikeInTier,
      muteMinutes,
      durationText,
      teamName: detection.teamName,
      messageDeleted,
      timeoutApplied,
      embed
    };
  }

  // Staff Inspection: Get user strikes and records
  getUserRecord(userId) {
    const record = db.prepare('SELECT * FROM anti_ping_strikes WHERE user_id = ?').get(userId);
    const logs = db.prepare('SELECT * FROM anti_ping_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);
    return {
      record: record || {
        user_id: userId,
        strike_count: 0,
        tier: 1,
        last_strike_at: null,
        last_punishment: 'NONE'
      },
      logs
    };
  }

  // Staff Management: Reset user strikes
  resetUserStrikes(userId, staffTag = 'Staff') {
    db.prepare(`
      UPDATE anti_ping_strikes
      SET strike_count = 0, tier = 1, last_punishment = 'RESET_BY_STAFF', updated_at = ?
      WHERE user_id = ?
    `).run(Date.now(), userId);

    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES ('ANTI_PING_RESET', ?, ?, 'Strikes reset by staff', ?)
    `).run(staffTag, userId, Date.now());

    return { success: true, userId, strikes: 0 };
  }

  // Staff Management: Set user strikes
  setUserStrikes(userId, count, staffTag = 'Staff') {
    const safeCount = Math.max(0, parseInt(count || '0', 10));
    const tier = Math.max(1, Math.ceil(safeCount / 3));
    const now = Date.now();

    db.prepare(`
      INSERT INTO anti_ping_strikes (user_id, guild_id, user_tag, strike_count, tier, last_strike_at, last_punishment, updated_at)
      VALUES (?, 'wvrp_guild', 'User', ?, ?, ?, 'MANUAL_SET', ?)
      ON CONFLICT(user_id) DO UPDATE SET
        strike_count = excluded.strike_count,
        tier = excluded.tier,
        last_strike_at = excluded.last_strike_at,
        last_punishment = excluded.last_punishment,
        updated_at = excluded.updated_at
    `).run(userId, safeCount, tier, now, now);

    return { success: true, userId, strikes: safeCount, tier };
  }

  resetStrikes(userId) {
    return this.resetUserStrikes(userId);
  }

  recordStrike(userId, teamName = 'Foundership Team', userTag = 'User') {
    const config = this.getConfig();
    const now = Date.now();
    let record = db.prepare('SELECT * FROM anti_ping_strikes WHERE user_id = ?').get(userId);

    let strikeCount = 0;
    if (record) {
      const resetThresholdMs = config.strikeResetHours * 60 * 60 * 1000;
      if (record.last_strike_at && (now - record.last_strike_at) > resetThresholdMs) {
        strikeCount = 0;
      } else {
        strikeCount = record.strike_count || 0;
      }
    }

    strikeCount += 1;
    const strikesPerTier = config.strikesPerTier;
    const currentTier = Math.max(1, Math.ceil(strikeCount / strikesPerTier));
    const strikeInTier = ((strikeCount - 1) % strikesPerTier) + 1;
    const isMuteStrike = (strikeInTier === strikesPerTier);

    let type = 'WARNING';
    let durationMinutes = 0;
    let punishmentText = '';

    if (isMuteStrike) {
      type = 'MUTE';
      if (currentTier === 1) {
        durationMinutes = config.muteTier1Minutes;
        punishmentText = `3/3 reached. 10-minute mute applied.`;
      } else if (currentTier === 2) {
        durationMinutes = config.muteTier2Minutes;
        punishmentText = `6/3 reached. 1-hour mute applied.`;
      } else {
        durationMinutes = config.muteTier3Minutes;
        punishmentText = `9/3 reached. 24-hour mute applied.`;
      }
    } else {
      const nextDuration = currentTier === 1 ? '10 minutes' : currentTier === 2 ? '1 hour' : '24 hours';
      punishmentText = `${strikeInTier}/${strikesPerTier} today. Reach ${strikesPerTier} and you'll be muted for ${nextDuration}.`;
    }

    db.prepare(`
      INSERT INTO anti_ping_strikes (user_id, guild_id, user_tag, strike_count, tier, last_strike_at, last_punishment, updated_at)
      VALUES (?, 'wvrp_guild', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        strike_count = excluded.strike_count,
        tier = excluded.tier,
        user_tag = excluded.user_tag,
        last_strike_at = excluded.last_strike_at,
        last_punishment = excluded.last_punishment,
        updated_at = excluded.updated_at
    `).run(userId, userTag, strikeCount, currentTier, now, type, now);

    return {
      strikeCount,
      tier: currentTier,
      tierProgress: strikeInTier,
      punishment: {
        type,
        durationMinutes,
        punishmentText
      }
    };
  }

  buildWarningEmbed({ userTag, roleName, strikeCount, tierProgress, punishmentText }) {
    const config = this.getConfig();
    return new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('⚠️ Please Don\'t Ping')
      .setDescription(
        `${userTag}, you can't ping members of the **${roleName}**.\n\nIf you're replying to one of them, turn the ping off first. The GIF below shows you how.`
      )
      .setImage(config.gifUrl)
      .addFields([
        {
          name: 'Strike Counter',
          value: `\`${punishmentText}\``
        }
      ])
      .setFooter({ text: 'West Virginia Roleplay · Anti-Ping Security System' })
      .setTimestamp(new Date());
  }

  getRecentLogs(limit = 20) {
    return db.prepare('SELECT * FROM anti_ping_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  }
}

export const antiPingService = new AntiPingService();
export default antiPingService;
