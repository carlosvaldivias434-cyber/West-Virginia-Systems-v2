import db from '../database/index.js';
import erlcService from './erlcService.js';
import shiftService from './shiftService.js';
import robloxService from './robloxService.js';
import {
  createInGameCommandLogV2,
  createModCallLogV2,
  createTeamSwitchLogV2,
  createPlayerJoinLeaveLogV2,
  createKillLogV2,
  createOffDutyCommandLogV2
} from '../embeds/wvrpEmbeds.js';

export class ErlcLoggingService {
  constructor() {
    this.previousState = {
      playerMap: new Map(), // robloxId -> { username, team, joinTime }
      knownCommandIds: new Set(),
      knownKillIds: new Set(),
      knownModCalls: new Map(), // callId -> state
      lastPollTime: 0
    };
    this.pollingInterval = null;
  }

  /**
   * Helper to normalize arguments when client is omitted
   */
  _resolveArgs(clientOrOpts, maybeOpts) {
    if (clientOrOpts && (clientOrOpts.channels || clientOrOpts.guilds)) {
      return { client: clientOrOpts, opts: maybeOpts || {} };
    }
    return { client: null, opts: clientOrOpts || {} };
  }

  /**
   * Safe helper to send a Components V2 payload to a configured Discord channel
   */
  async sendToChannel(client, channelEnvKey, payload) {
    if (!client) return false;
    const channelId = process.env[channelEnvKey] || process.env.STAFF_LOG_CHANNEL_ID;
    if (!channelId) {
      return false;
    }

    try {
      const channel = client.channels.cache?.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
      if (channel && typeof channel.send === 'function') {
        await channel.send(payload);
        return true;
      }
    } catch (err) {
      console.warn(`[ErlcLoggingService] Could not send log to channel ${channelId} (${channelEnvKey}):`, err.message);
    }
    return false;
  }

  /**
   * Log an In-Game Command event with automatic Off-Duty Staff detection
   */
  async logInGameCommand(clientOrOpts, maybeOpts = {}) {
    const { client, opts } = this._resolveArgs(clientOrOpts, maybeOpts);
    const {
      staff = 'Remote Server',
      permissions = 'Unknown',
      command = ':cmds',
      when = null,
      robloxUsername = null,
      robloxId = null
    } = opts;

    const ts = when || Date.now();

    // 1. Send standard In-Game Commands Given log
    const cmdPayload = createInGameCommandLogV2({
      staff,
      permissions,
      when: ts,
      command,
      robloxUsername,
      robloxId
    });

    await this.sendToChannel(client, 'ERLC_COMMAND_LOG_CHANNEL_ID', cmdPayload);

    // 2. Check for Off-Duty Staff Command Execution
    if (robloxUsername || robloxId) {
      const checkUser = robloxUsername || staff;
      const verification = db.prepare('SELECT discord_id, discord_tag FROM verifications WHERE roblox_username = ? OR roblox_id = ?').get(checkUser, String(robloxId || ''));
      const shiftStaff = db.prepare('SELECT staff_id, staff_tag FROM staff_shifts WHERE roblox_id = ? OR staff_tag = ? LIMIT 1').get(String(robloxId || ''), checkUser);

      const staffDiscordId = verification?.discord_id || shiftStaff?.staff_id;
      const staffDiscordTag = verification?.discord_tag || shiftStaff?.staff_tag;

      if (staffDiscordId) {
        const activeStatus = db.prepare("SELECT status FROM staff_active_status WHERE staff_id = ?").get(staffDiscordId);
        const isOnDuty = activeStatus && activeStatus.status === 'ON_SHIFT';

        if (!isOnDuty) {
          const offDutyPayload = createOffDutyCommandLogV2({
            staffUser: { id: staffDiscordId, tag: staffDiscordTag, username: staffDiscordTag },
            robloxUsername: checkUser,
            command,
            timestamp: ts
          });

          await this.sendToChannel(client, 'OFF_DUTY_LOG_CHANNEL_ID', offDutyPayload);
        }
      }
    }

    try {
      db.prepare(`
        INSERT INTO erlc_event_logs (event_type, data_json, created_at)
        VALUES ('COMMAND', ?, ?)
      `).run(JSON.stringify({ staff, permissions, command, robloxUsername, robloxId }), ts);
    } catch {}

    return { success: true, payload: cmdPayload };
  }

  /**
   * Log a Moderation Call event (Unanswered or Answered)
   */
  async logModCall(clientOrOpts, maybeOpts = {}) {
    const { client, opts } = this._resolveArgs(clientOrOpts, maybeOpts);
    const {
      caller = 'elixyrblx',
      status = 'Unanswered',
      answeredBy = null,
      responseTime = null,
      timestamp = null
    } = opts;

    const ts = timestamp || Date.now();
    const payload = createModCallLogV2({
      caller,
      status,
      answeredBy,
      responseTime,
      timestamp: ts
    });

    await this.sendToChannel(client, 'ERLC_MODCALL_LOG_CHANNEL_ID', payload);

    try {
      db.prepare(`
        INSERT INTO erlc_event_logs (event_type, data_json, created_at)
        VALUES ('MOD_CALL', ?, ?)
      `).run(JSON.stringify({ caller, status, answeredBy, responseTime }), ts);
    } catch {}

    return { success: true, payload };
  }

  /**
   * Log a Team Switch event
   */
  async logTeamSwitch(clientOrOpts, maybeOpts = {}) {
    const { client, opts } = this._resolveArgs(clientOrOpts, maybeOpts);
    const {
      player = 'elixyrblx',
      previousTeam = 'Police',
      newTeam = 'Sheriff',
      timestamp = null
    } = opts;

    const ts = timestamp || Date.now();
    const payload = createTeamSwitchLogV2({
      player,
      previousTeam,
      newTeam,
      timestamp: ts
    });

    await this.sendToChannel(client, 'ERLC_TEAM_LOG_CHANNEL_ID', payload);

    try {
      db.prepare(`
        INSERT INTO erlc_event_logs (event_type, data_json, created_at)
        VALUES ('TEAM_SWITCH', ?, ?)
      `).run(JSON.stringify({ player, previousTeam, newTeam }), ts);
    } catch {}

    return { success: true, payload };
  }

  /**
   * Log a Player Join or Leave event
   */
  async logPlayerJoinLeave(clientOrOpts, maybeOpts = {}) {
    const { client, opts } = this._resolveArgs(clientOrOpts, maybeOpts);
    const {
      action = 'JOIN',
      player = 'Royalty_verity',
      robloxId = null,
      playtime = '0m',
      timestamp = null,
      onlineCount = 0,
      maxCapacity = 50
    } = opts;

    const ts = timestamp || Date.now();
    const payload = createPlayerJoinLeaveLogV2({
      action,
      player,
      robloxId,
      playtime,
      timestamp: ts,
      onlineCount,
      maxCapacity
    });

    const envKey = action.toUpperCase() === 'JOIN' ? 'ERLC_JOIN_LOG_CHANNEL_ID' : 'ERLC_LEAVE_LOG_CHANNEL_ID';
    await this.sendToChannel(client, envKey, payload);

    try {
      db.prepare(`
        INSERT INTO erlc_event_logs (event_type, data_json, created_at)
        VALUES (?, ?, ?)
      `).run(action.toUpperCase(), JSON.stringify({ player, robloxId, playtime, onlineCount, maxCapacity }), ts);
    } catch {}

    return { success: true, payload };
  }

  /**
   * Log a Kill event with RDM heuristics and player statistics
   */
  async logKill(clientOrOpts, maybeOpts = {}) {
    const { client, opts } = this._resolveArgs(clientOrOpts, maybeOpts);
    const {
      victim = 'Bricegamerboy11',
      victimId = null,
      killer = 'DVI_BMW',
      killerId = null,
      timestamp = null
    } = opts;

    const ts = timestamp || Date.now();

    const fiveMinutesAgo = ts - 5 * 60 * 1000;
    const recentKillsRow = db.prepare(`
      SELECT COUNT(*) as kill_count
      FROM erlc_event_logs
      WHERE event_type = 'KILL' AND created_at >= ? AND data_json LIKE ?
    `).get(fiveMinutesAgo, `%"killer":"${killer}"%`);

    const killCount = (recentKillsRow?.kill_count || 0) + 1;
    const isSuspectedRdm = killCount >= 3;
    const rdmReason = isSuspectedRdm ? `High Kill Velocity: ${killCount} kills logged within 5 minutes.` : null;

    const payload = createKillLogV2({
      victim,
      victimId,
      killer,
      killerId,
      timestamp: ts,
      isSuspectedRdm,
      rdmReason,
      killerStats: { kills: killCount, deaths: 0, rdmWarnings: isSuspectedRdm ? 1 : 0 }
    });

    await this.sendToChannel(client, 'ERLC_KILL_LOG_CHANNEL_ID', payload);

    try {
      db.prepare(`
        INSERT INTO erlc_event_logs (event_type, data_json, created_at)
        VALUES ('KILL', ?, ?)
      `).run(JSON.stringify({ victim, victimId, killer, killerId, isSuspectedRdm }), ts);
    } catch {}

    return { success: true, payload, isSuspectedRdm };
  }

  /**
   * Get killer statistics for the interactive player stats button
   */
  getKillerStats(killerUsernameOrId) {
    const kills = db.prepare(`
      SELECT COUNT(*) as count
      FROM erlc_event_logs
      WHERE event_type = 'KILL' AND data_json LIKE ?
    `).get(`%"killer":"${killerUsernameOrId}"%`);

    const deaths = db.prepare(`
      SELECT COUNT(*) as count
      FROM erlc_event_logs
      WHERE event_type = 'KILL' AND data_json LIKE ?
    `).get(`%"victim":"${killerUsernameOrId}"%`);

    const rdmCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM erlc_event_logs
      WHERE event_type = 'KILL' AND data_json LIKE ? AND data_json LIKE '%"isSuspectedRdm":true%'
    `).get(`%"killer":"${killerUsernameOrId}"%`);

    const totalKills = kills?.count || 0;
    const totalDeaths = deaths?.count || 0;
    const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);

    return {
      player: killerUsernameOrId,
      kills: totalKills,
      deaths: totalDeaths,
      kd,
      rdmCount: rdmCount?.count || 0,
      totalKills,
      totalDeaths,
      suspectedRdmDetections: rdmCount?.count || 0
    };
  }
}

export const erlcLoggingService = new ErlcLoggingService();
export default erlcLoggingService;
