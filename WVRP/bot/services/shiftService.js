import db from '../database/index.js';
import { createShiftEndedLogV2 } from '../embeds/wvrpEmbeds.js';

export class ShiftService {
  startShift(staffMember, shiftType = 'NORMAL', robloxId = null) {
    const existing = db.prepare('SELECT * FROM staff_active_status WHERE staff_id = ?').get(staffMember.id);
    if (existing) {
      return { success: false, error: `You are already on duty (${existing.status})! End your current shift first.` };
    }

    const shiftId = `SHIFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    const insertShift = db.prepare(`
      INSERT INTO staff_shifts (id, staff_id, staff_tag, roblox_id, shift_type, started_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `);

    const insertActive = db.prepare(`
      INSERT INTO staff_active_status (staff_id, staff_tag, current_shift_id, status, shift_type)
      VALUES (?, ?, ?, 'ON_SHIFT', ?)
    `);

    db.transaction(() => {
      insertShift.run(shiftId, staffMember.id, staffMember.tag || staffMember.username, robloxId, shiftType, now);
      insertActive.run(staffMember.id, staffMember.tag || staffMember.username, shiftId, shiftType);
    })();

    return {
      success: true,
      shiftId,
      shiftType,
      startedAt: now,
      status: 'ON_SHIFT',
      assignRole: 'ON_DUTY',
      removeRole: 'ON_BREAK'
    };
  }

  startBreak(staffMember) {
    const active = db.prepare('SELECT * FROM staff_active_status WHERE staff_id = ?').get(staffMember.id);
    if (!active) return { success: false, error: 'You are not currently on an active shift.' };
    if (active.status === 'ON_BREAK') return { success: false, error: 'You are already on break.' };

    const now = Date.now();
    db.prepare(`
      UPDATE staff_active_status
      SET status = 'ON_BREAK', break_started_at = ?
      WHERE staff_id = ?
    `).run(now, staffMember.id);

    return {
      success: true,
      status: 'ON_BREAK',
      assignRole: 'ON_BREAK',
      removeRole: 'ON_DUTY',
      breakStartedAt: now
    };
  }

  endBreak(staffMember) {
    const active = db.prepare('SELECT * FROM staff_active_status WHERE staff_id = ?').get(staffMember.id);
    if (!active) return { success: false, error: 'You are not currently on an active shift.' };
    if (active.status !== 'ON_BREAK') return { success: false, error: 'You are not currently on break.' };

    const now = Date.now();
    const breakDuration = Math.round((now - (active.break_started_at || now)) / 1000);

    db.transaction(() => {
      db.prepare(`
        UPDATE staff_shifts
        SET break_duration_seconds = break_duration_seconds + ?,
            break_count = break_count + 1
        WHERE id = ?
      `).run(breakDuration, active.current_shift_id);

      db.prepare(`
        UPDATE staff_active_status
        SET status = 'ON_SHIFT', break_started_at = NULL
        WHERE staff_id = ?
      `).run(staffMember.id);
    })();

    return {
      success: true,
      status: 'ON_SHIFT',
      breakDurationSeconds: breakDuration,
      assignRole: 'ON_DUTY',
      removeRole: 'ON_BREAK'
    };
  }

  async endShift(staffMember, guild = null) {
    const active = db.prepare('SELECT * FROM staff_active_status WHERE staff_id = ?').get(staffMember.id);
    if (!active) return { success: false, error: 'You do not have an active shift to end.' };

    const shift = db.prepare('SELECT * FROM staff_shifts WHERE id = ?').get(active.current_shift_id);
    const now = Date.now();

    let extraBreak = 0;
    if (active.status === 'ON_BREAK' && active.break_started_at) {
      extraBreak = Math.round((now - active.break_started_at) / 1000);
    }

    const totalElapsedSeconds = Math.round((now - shift.started_at) / 1000);
    const totalBreaks = shift.break_duration_seconds + extraBreak;
    const creditedSeconds = Math.max(0, totalElapsedSeconds - totalBreaks);

    db.transaction(() => {
      db.prepare(`
        UPDATE staff_shifts
        SET ended_at = ?,
            total_duration_seconds = ?,
            break_duration_seconds = ?,
            status = 'COMPLETED'
        WHERE id = ?
      `).run(now, creditedSeconds, totalBreaks, shift.id);

      db.prepare('DELETE FROM staff_active_status WHERE staff_id = ?').run(staffMember.id);
    })();

    // Resolve Roblox username
    let robloxUsername = shift.roblox_id || 'Not Linked';
    try {
      const v = db.prepare('SELECT roblox_username FROM verifications WHERE discord_id = ?').get(staffMember.id);
      if (v?.roblox_username) robloxUsername = v.roblox_username;
    } catch {}

    const timeOnShift = this.formatDuration(creditedSeconds);
    const timeOnBreak = this.formatDuration(totalBreaks);

    // Build Components V2 shift-ended payload
    const logPayload = createShiftEndedLogV2({
      staffUser: staffMember,
      robloxUsername,
      shiftType: shift.shift_type || 'NORMAL',
      startedAt: shift.started_at,
      endedAt: now,
      timeOnShift,
      timeOnBreak
    });

    // Send to configured shift log channel
    let logged = false;
    const channelId = process.env.SHIFT_LOG_CHANNEL_ID || process.env.STAFF_LOG_CHANNEL_ID;
    if (guild && channelId) {
      try {
        const chan = guild.channels?.cache?.get(channelId) || (await guild.channels?.fetch(channelId).catch(() => null));
        if (chan && typeof chan.send === 'function') {
          await chan.send(logPayload);
          logged = true;
        }
      } catch (err) {
        console.warn(`[ShiftService] Could not send shift log to channel ${channelId}:`, err.message);
      }
    }

    return {
      success: true,
      creditedSeconds,
      totalBreaksSeconds: totalBreaks,
      timeOnShift,
      timeOnBreak,
      shiftType: shift.shift_type || 'NORMAL',
      startedAt: shift.started_at,
      endedAt: now,
      robloxUsername,
      logged,
      payload: logPayload,
      removeRole: ['ON_DUTY', 'ON_BREAK']
    };
  }

  getActiveShifts() {
    const activeRows = db.prepare(`
      SELECT a.*, s.started_at, s.break_count, s.moderation_count
      FROM staff_active_status a
      LEFT JOIN staff_shifts s ON a.current_shift_id = s.id
    `).all();

    const onShiftCount = activeRows.filter(r => r.status === 'ON_SHIFT').length;
    const onBreakCount = activeRows.filter(r => r.status === 'ON_BREAK').length;

    const list = activeRows.map(row => {
      const elapsedSeconds = Math.round((Date.now() - row.started_at) / 1000);
      return {
        staffId: row.staff_id,
        staffTag: row.staff_tag,
        status: row.status,
        shiftType: row.shift_type,
        elapsedSeconds,
        elapsedFormatted: this.formatDuration(elapsedSeconds),
        startedAgo: this.formatTimeAgo(row.started_at),
        breakCount: row.break_count || 0,
        moderationCount: row.moderation_count || 0
      };
    });

    return {
      onShiftCount,
      onBreakCount,
      list
    };
  }

  getStaffWeeklyStats(staffId) {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const rows = db.prepare(`
      SELECT total_duration_seconds, moderation_count
      FROM staff_shifts
      WHERE staff_id = ? AND started_at >= ? AND status = 'COMPLETED'
    `).all(staffId, oneWeekAgo);

    const totalSeconds = rows.reduce((acc, r) => acc + (r.total_duration_seconds || 0), 0);
    const totalMods = rows.reduce((acc, r) => acc + (r.moderation_count || 0), 0);
    const shiftCount = rows.length;

    const quotaConfig = db.prepare('SELECT * FROM staff_quotas WHERE staff_id = ?').get(staffId) || {
      exempt: 0,
      on_leave: 0,
      no_quota: 0,
      custom_quota_seconds: 12000 // 3h 20m default
    };

    const quotaSeconds = quotaConfig.custom_quota_seconds || 12000;
    const percent = Math.min(100, Math.round((totalSeconds / quotaSeconds) * 100));

    return {
      totalSeconds,
      totalFormatted: this.formatDuration(totalSeconds),
      quotaSeconds,
      quotaFormatted: this.formatDuration(quotaSeconds),
      percent,
      shiftCount,
      totalMods,
      quotaConfig
    };
  }

  getLeaderboard(page = 1, pageSize = 10) {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const rows = db.prepare(`
      SELECT staff_id, staff_tag,
             SUM(total_duration_seconds) as total_seconds,
             SUM(moderation_count) as total_mods,
             COUNT(*) as shift_count
      FROM staff_shifts
      WHERE started_at >= ? AND status = 'COMPLETED'
      GROUP BY staff_id
      ORDER BY total_seconds DESC
    `).all(oneWeekAgo);

    const defaultQuotaSeconds = 12000;
    const quotaMet = [];
    const belowQuota = [];
    const exemptList = [];

    for (const r of rows) {
      const q = db.prepare('SELECT * FROM staff_quotas WHERE staff_id = ?').get(r.staff_id) || {};
      const item = {
        staffId: r.staff_id,
        staffTag: r.staff_tag,
        totalSeconds: r.total_seconds || 0,
        formattedDuration: this.formatDuration(r.total_seconds || 0),
        moderations: r.total_mods || 0,
        shiftCount: r.shift_count || 0
      };

      if (q.exempt || q.on_leave) {
        exemptList.push(item);
      } else if (item.totalSeconds >= defaultQuotaSeconds) {
        quotaMet.push(item);
      } else {
        belowQuota.push(item);
      }
    }

    const allSorted = [...quotaMet, ...belowQuota, ...exemptList];
    const totalStaff = Math.max(1, allSorted.length);
    const totalPages = Math.max(1, Math.ceil(allSorted.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const pagedStaff = allSorted.slice(startIdx, startIdx + pageSize);

    const teamTotalSeconds = rows.reduce((acc, r) => acc + (r.total_seconds || 0), 0);

    return {
      page: safePage,
      totalPages,
      totalStaff,
      quotaMetCount: quotaMet.length,
      belowQuotaCount: belowQuota.length,
      exemptCount: exemptList.length,
      teamTotalDuration: this.formatDuration(teamTotalSeconds),
      pagedStaff,
      quotaMet,
      belowQuota,
      exemptList
    };
  }

  // Handle in-game ER:LC chat commands: ;shift start, ;shift 50/50, ;shift break, ;shift end
  handleInGameChatCommand(playerRobloxId, playerUsername, commandText) {
    const cmd = commandText.trim().toLowerCase();
    const staffMember = {
      id: `roblox_${playerRobloxId}`,
      tag: playerUsername
    };

    if (cmd === ';shift start') {
      return this.startShift(staffMember, 'NORMAL', playerRobloxId);
    } else if (cmd === ';shift 50/50') {
      return this.startShift(staffMember, '50/50', playerRobloxId);
    } else if (cmd === ';shift break') {
      const active = db.prepare('SELECT * FROM staff_active_status WHERE staff_id = ?').get(staffMember.id);
      if (active?.status === 'ON_BREAK') {
        return this.endBreak(staffMember);
      }
      return this.startBreak(staffMember);
    } else if (cmd === ';shift end') {
      return this.endShift(staffMember);
    }

    return { success: false, error: 'Unknown in-game shift command.' };
  }

  formatDuration(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  formatTimeAgo(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }
}

export const shiftService = new ShiftService();
export default shiftService;
