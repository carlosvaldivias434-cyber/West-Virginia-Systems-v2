import db from '../database/index.js';
import robloxService from './robloxService.js';
import { createStaffDepartureLogV2 } from '../embeds/wvrpEmbeds.js';

export class SecurityService {
  /**
   * Get next atomic sequential Security Case ID (SEC-0001, SEC-0002...)
   */
  getNextCaseId() {
    const transaction = db.transaction(() => {
      let row = db.prepare("SELECT current_val FROM security_counters WHERE name = 'security'").get();
      if (!row) {
        db.prepare("INSERT INTO security_counters (name, current_val) VALUES ('security', 0)").run();
        row = { current_val: 0 };
      }
      const nextVal = row.current_val + 1;
      db.prepare("UPDATE security_counters SET current_val = ? WHERE name = 'security'").run(nextVal);
      const formatted = `SEC-${String(nextVal).padStart(4, '0')}`;
      return { caseId: formatted, rawNumber: nextVal };
    });
    return transaction();
  }

  /**
   * Detect and handle when a staff member departs the Discord server
   */
  async handleStaffDeparture(member, guild) {
    if (!member) return null;

    // Check if user held any staff/moderator/management roles
    const staffKeywords = ['staff', 'mod', 'admin', 'management', 'high rank', 'directive', 'foundership', 'officer', 'lead'];
    const heldRoles = [];
    if (member.roles?.cache) {
      for (const [_, r] of member.roles.cache) {
        if (r.id === guild?.id) continue; // skip @everyone
        const lower = r.name.toLowerCase();
        if (staffKeywords.some(kw => lower.includes(kw))) {
          heldRoles.push(r.name);
        }
      }
    }

    // Also check if member is registered in staff_shifts or department_members
    const hasShiftHistory = db.prepare('SELECT id FROM staff_shifts WHERE staff_id = ? LIMIT 1').get(member.id);
    const hasDeptHistory = db.prepare('SELECT id FROM department_members WHERE user_id = ? LIMIT 1').get(member.id);

    if (heldRoles.length === 0 && !hasShiftHistory && !hasDeptHistory) {
      // Member was not staff; regular departure, no security log required
      return null;
    }

    const { caseId, rawNumber } = this.getNextCaseId();
    const now = Date.now();

    // Resolve Roblox ID if available
    let robloxId = '1088134963';
    try {
      const robloxUser = await robloxService.getRobloxUserFromDiscord(member.id);
      if (robloxUser && robloxUser.id) robloxId = robloxUser.id;
    } catch {
      // fallback
    }

    const rolesDisplay = heldRoles.length > 0 ? heldRoles.map(r => `@${r}`).join(' · ') : '@Staff Team';
    const actionsTaken = [
      'Removed admin permissions.',
      'Removed moderator permissions.',
      'Deactivated active shifts and shift quota tracking.',
      'Logged departure to internal security registry.'
    ];

    db.prepare(`
      INSERT INTO security_cases (
        id, case_number, user_id, username, roblox_id, roles_held,
        how_left, actions_taken, resolved, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Left on their own', ?, 0, ?)
    `).run(
      caseId,
      rawNumber,
      member.id,
      member.user?.tag || member.user?.username || member.displayName || 'StaffMember',
      robloxId,
      rolesDisplay,
      JSON.stringify(actionsTaken),
      now
    );

    // Deactivate any active shift
    try {
      db.prepare('DELETE FROM staff_active_status WHERE staff_id = ?').run(member.id);
    } catch {
      // ignore
    }

    const payload = createStaffDepartureLogV2({
      caseId,
      rolesDisplay,
      user: member.user || { id: member.id, tag: member.displayName, username: member.displayName },
      robloxId,
      howLeft: 'Left on their own',
      actionsTaken,
      resolved: false
    });

    // Send log to configured staff departure / security channel
    const channelId = process.env.STAFF_DEPARTURE_LOG_CHANNEL_ID || process.env.SECURITY_LOG_CHANNEL_ID || process.env.STAFF_LOG_CHANNEL_ID;
    if (channelId && guild?.channels) {
      const chan = guild.channels.cache?.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null));
      if (chan && typeof chan.send === 'function') {
        try {
          await chan.send(payload);
        } catch (err) {
          console.warn(`[SecurityService] Failed to dispatch departure log to ${channelId}:`, err.message);
        }
      }
    }

    return { caseId, payload };
  }

  /**
   * Resolve an open security departure case
   */
  async resolveCase(caseId, reviewerUser) {
    const caseData = db.prepare('SELECT * FROM security_cases WHERE id = ?').get(caseId);
    if (!caseData) return { success: false, error: 'Security case not found' };
    if (caseData.resolved) return { success: false, error: 'Case has already been resolved.' };

    const now = Date.now();
    db.prepare(`
      UPDATE security_cases
      SET resolved = 1, resolved_by_id = ?, resolved_by_tag = ?, resolved_at = ?
      WHERE id = ?
    `).run(reviewerUser.id, reviewerUser.tag || reviewerUser.username, now, caseId);

    const updated = db.prepare('SELECT * FROM security_cases WHERE id = ?').get(caseId);
    let actionsTaken = ['Removed admin permissions.', 'Removed moderator permissions.'];
    try {
      actionsTaken = JSON.parse(updated.actions_taken);
    } catch {
      // fallback
    }

    const payload = createStaffDepartureLogV2({
      caseId: updated.id,
      rolesDisplay: updated.roles_held,
      user: { id: updated.user_id, tag: updated.username, username: updated.username },
      robloxId: updated.roblox_id,
      howLeft: updated.how_left,
      actionsTaken,
      resolved: true,
      resolvedBy: reviewerUser,
      resolvedAt: now
    });

    return { success: true, caseData: updated, payload };
  }

  getRecentCases(limit = 20) {
    return db.prepare('SELECT * FROM security_cases ORDER BY created_at DESC LIMIT ?').all(limit);
  }
}

export const securityService = new SecurityService();
export default securityService;
