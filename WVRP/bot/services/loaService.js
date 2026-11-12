import db from '../database/index.js';
import { createLoaRequestV2 } from '../embeds/wvrpEmbeds.js';

export class LoaService {
  /**
   * Get next atomic sequential LOA request ID (#0001, #0002...)
   */
  getNextRequestId() {
    const transaction = db.transaction(() => {
      let row = db.prepare("SELECT current_val FROM loa_counters WHERE name = 'loa'").get();
      if (!row) {
        db.prepare("INSERT INTO loa_counters (name, current_val) VALUES ('loa', 0)").run();
        row = { current_val: 0 };
      }
      const nextVal = row.current_val + 1;
      db.prepare("UPDATE loa_counters SET current_val = ? WHERE name = 'loa'").run(nextVal);
      const formatted = String(nextVal).padStart(4, '0');
      return { requestNumber: formatted, rawNumber: nextVal };
    });
    return transaction();
  }

  /**
   * Submit a Leave of Absence request
   */
  async submitRequest({
    user,
    member = null,
    robloxUsername = 'Not Linked',
    fromDate,
    untilDate,
    days = 5,
    reason,
    requestedFrom = 'Discord',
    guild = null
  }) {
    if (!fromDate || !untilDate || !reason) {
      return { success: false, error: 'Start date, end date, and reason are required.' };
    }

    const { requestNumber, rawNumber } = this.getNextRequestId();
    const loaId = `LOA-${requestNumber}`;
    const now = Date.now();
    const roleDisplay = member?.roles?.highest?.name ? `@${member.roles.highest.name}` : '@Staff Team';

    db.prepare(`
      INSERT INTO leave_of_absence (
        id, request_number, user_id, user_tag, roblox_username, role_display,
        from_date, until_date, days, reason, requested_from, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      loaId,
      rawNumber,
      user.id,
      user.tag || user.username,
      robloxUsername,
      roleDisplay,
      fromDate,
      untilDate,
      days,
      reason,
      requestedFrom,
      now
    );

    const payload = createLoaRequestV2({
      requestNumber,
      roleDisplay,
      staffUser: user,
      robloxUsername,
      fromDate,
      untilDate,
      days,
      reason,
      requestedFrom,
      requestedAt: now,
      status: 'PENDING'
    });

    // Dispatch Components V2 notification to LOA channel
    let logged = false;
    if (guild) {
      const channelId = process.env.LOA_LOG_CHANNEL_ID || process.env.STAFF_LOG_CHANNEL_ID;
      if (channelId) {
        const chan = guild.channels?.cache?.get(channelId) || (await guild.channels?.fetch(channelId).catch(() => null));
        if (chan && typeof chan.send === 'function') {
          try {
            await chan.send(payload);
            logged = true;
          } catch (e) {
            console.warn('[LoaService] Failed to send LOA log:', e.message);
          }
        }
      }
    }

    return {
      success: true,
      loaId,
      requestNumber,
      logged,
      payload
    };
  }

  /**
   * Reviewer: Approve LOA Request
   */
  async acceptRequest(requestNumberOrId, reviewerUser, guild = null) {
    const raw = String(requestNumberOrId).replace('LOA-', '').replace('#', '');
    const loa = db.prepare('SELECT * FROM leave_of_absence WHERE request_number = ? OR id = ?').get(parseInt(raw, 10) || 0, `LOA-${raw}`);
    if (!loa) return { success: false, error: 'LOA Request not found' };

    if (loa.status === 'ACCEPTED') return { success: false, error: 'This LOA request is already accepted.' };
    if (loa.status === 'DENIED') return { success: false, error: 'This LOA request is already denied.' };

    const now = Date.now();
    db.transaction(() => {
      db.prepare(`
        UPDATE leave_of_absence
        SET status = 'ACCEPTED', reviewer_id = ?, reviewer_tag = ?, reviewed_at = ?
        WHERE id = ?
      `).run(reviewerUser.id, reviewerUser.tag || reviewerUser.username, now, loa.id);

      // Exempt from weekly staff quota
      db.prepare(`
        INSERT INTO staff_quotas (staff_id, on_leave)
        VALUES (?, 1)
        ON CONFLICT(staff_id) DO UPDATE SET on_leave = 1
      `).run(loa.user_id);
    })();

    const updatedLoa = db.prepare('SELECT * FROM leave_of_absence WHERE id = ?').get(loa.id);
    const payload = createLoaRequestV2({
      requestNumber: String(updatedLoa.request_number).padStart(4, '0'),
      roleDisplay: updatedLoa.role_display,
      staffUser: { id: updatedLoa.user_id, tag: updatedLoa.user_tag, username: updatedLoa.user_tag },
      robloxUsername: updatedLoa.roblox_username,
      fromDate: updatedLoa.from_date,
      untilDate: updatedLoa.until_date,
      days: updatedLoa.days,
      reason: updatedLoa.reason,
      requestedFrom: updatedLoa.requested_from,
      requestedAt: updatedLoa.created_at,
      status: 'ACCEPTED',
      reviewerUser
    });

    // Send DM to staff member
    if (guild) {
      try {
        const member = await guild.members.fetch(loa.user_id).catch(() => null);
        if (member && member.user?.send) {
          await member.user.send(payload);
        }
      } catch (dmErr) {
        console.warn(`[LoaService] DM delivery to ${loa.user_id} failed:`, dmErr.message);
      }
    }

    return { success: true, loa: updatedLoa, payload };
  }

  /**
   * Reviewer: Deny LOA Request
   */
  async denyRequest(requestNumberOrId, reviewerUser, reason = 'Quota requirements cannot be waived', guild = null) {
    const raw = String(requestNumberOrId).replace('LOA-', '').replace('#', '');
    const loa = db.prepare('SELECT * FROM leave_of_absence WHERE request_number = ? OR id = ?').get(parseInt(raw, 10) || 0, `LOA-${raw}`);
    if (!loa) return { success: false, error: 'LOA Request not found' };

    if (loa.status === 'ACCEPTED') return { success: false, error: 'This LOA request is already accepted.' };
    if (loa.status === 'DENIED') return { success: false, error: 'This LOA request is already denied.' };

    const now = Date.now();
    db.prepare(`
      UPDATE leave_of_absence
      SET status = 'DENIED', reviewer_id = ?, reviewer_tag = ?, review_reason = ?, reviewed_at = ?
      WHERE id = ?
    `).run(reviewerUser.id, reviewerUser.tag || reviewerUser.username, reason, now, loa.id);

    const updatedLoa = db.prepare('SELECT * FROM leave_of_absence WHERE id = ?').get(loa.id);
    const payload = createLoaRequestV2({
      requestNumber: String(updatedLoa.request_number).padStart(4, '0'),
      roleDisplay: updatedLoa.role_display,
      staffUser: { id: updatedLoa.user_id, tag: updatedLoa.user_tag, username: updatedLoa.user_tag },
      robloxUsername: updatedLoa.roblox_username,
      fromDate: updatedLoa.from_date,
      untilDate: updatedLoa.until_date,
      days: updatedLoa.days,
      reason: updatedLoa.reason,
      requestedFrom: updatedLoa.requested_from,
      requestedAt: updatedLoa.created_at,
      status: 'DENIED',
      reviewerUser,
      denialReason: reason
    });

    if (guild) {
      try {
        const member = await guild.members.fetch(loa.user_id).catch(() => null);
        if (member && member.user?.send) {
          await member.user.send(payload);
        }
      } catch (dmErr) {
        console.warn(`[LoaService] DM delivery to ${loa.user_id} failed:`, dmErr.message);
      }
    }

    return { success: true, loa: updatedLoa, payload };
  }

  getLoa(idOrNum) {
    const raw = String(idOrNum).replace('LOA-', '').replace('#', '');
    return db.prepare('SELECT * FROM leave_of_absence WHERE request_number = ? OR id = ?').get(parseInt(raw, 10) || 0, `LOA-${raw}`);
  }

  getAllRequests(status = 'ALL') {
    if (status !== 'ALL') {
      return db.prepare('SELECT * FROM leave_of_absence WHERE status = ? ORDER BY created_at DESC LIMIT 50').all(status);
    }
    return db.prepare('SELECT * FROM leave_of_absence ORDER BY created_at DESC LIMIT 50').all();
  }
}

export const loaService = new LoaService();
export default loaService;
