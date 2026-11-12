import { db } from '../db/index.js';

export interface WatchdogAlert {
  id: number;
  alert_type: string;
  player_name: string;
  roblox_id: string;
  confidence: number;
  details: string;
  recommended_action: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  created_at: number;
  action_taken?: string;
  action_by?: string;
  resolved_at?: number;
}

export class WatchdogService {
  constructor() {
    this.seedSampleAlertsIfEmpty();
  }

  private seedSampleAlertsIfEmpty() {
    try {
      const count = db.prepare('SELECT COUNT(*) as count FROM watchdog_alerts').get() as { count: number };
      if (count && count.count === 0) {
        const now = Date.now();
        const insert = db.prepare(`
          INSERT INTO watchdog_alerts (alert_type, player_name, roblox_id, confidence, details, recommended_action, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
        `);

        db.transaction(() => {
          insert.run(
            'MASS_RDM',
            'RogueShooter21',
            '39201948',
            95,
            '3 civilians eliminated in 48 seconds at Town Spawn with no active 911 call or emergency initiation.',
            'BAN (14 Days) / Server Kick',
            now - 12 * 60 * 1000
          );
          insert.run(
            'NLR_VIOLATION',
            'SpeedyRacer99',
            '69302918',
            88,
            'Returned to previous traffic collision scene within 130 seconds of respawn and initiated physical confrontation.',
            'PM Warning / Teleport to Hospital',
            now - 25 * 60 * 1000
          );
          insert.run(
            'UNREALISTIC_AVATAR',
            'NeonTrollX',
            '91029384',
            82,
            'Equipped oversized troll bundle and non-compliant audio accessories valued at 34,200 Robux.',
            'PM Warning to change attire',
            now - 40 * 60 * 1000
          );
        })();
      }
    } catch (e) {
      console.warn('Watchdog sample seed error:', e);
    }
  }

  /**
   * Fetch active alerts with optional status filter
   */
  getAlerts(status: string = 'OPEN'): WatchdogAlert[] {
    if (status === 'ALL') {
      return db.prepare('SELECT * FROM watchdog_alerts ORDER BY created_at DESC LIMIT 50').all() as WatchdogAlert[];
    }
    return db.prepare('SELECT * FROM watchdog_alerts WHERE status = ? ORDER BY created_at DESC LIMIT 50').all(status) as WatchdogAlert[];
  }

  /**
   * Process an action on a watchdog alert
   */
  async processAction(
    alertId: number,
    action: 'PM_WARNING' | 'PM_WARN' | 'TELEPORT' | 'KICK' | 'BAN' | 'DISMISS' | string,
    staffUser: { id: string; username: string },
    customReason?: string
  ): Promise<{ success: boolean; message: string; caseId?: string }> {
    const alert = db.prepare('SELECT * FROM watchdog_alerts WHERE id = ?').get(alertId) as WatchdogAlert | undefined;
    if (!alert) return { success: false, message: 'Alert record not found.' };

    const effectiveAction = action === 'PM_WARN' ? 'PM_WARNING' : action;
    const now = Date.now();
    let newStatus = 'RESOLVED';
    let caseId = '';

    if (effectiveAction === 'DISMISS') {
      newStatus = 'DISMISSED';
      db.prepare(`
        UPDATE watchdog_alerts
        SET status = ?, action_taken = 'DISMISSED', action_by = ?, resolved_at = ?
        WHERE id = ?
      `).run(newStatus, staffUser.username, now, alertId);

      // Adaptive learning: lower sensitivity slightly for this alert type
      this.adjustConfidenceThreshold(alert.alert_type, -2);

      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('WATCHDOG_DISMISS', ?, ?, ?, ?)
      `).run(staffUser.id, alert.player_name, `Dismissed alert #${alertId} (${alert.alert_type})`, now);

      return { success: true, message: `Alert #${alertId} dismissed.` };
    }

    // For disciplinary actions (KICK, BAN, PM_WARNING, TELEPORT), log moderation case
    const actionDesc = customReason || `${alert.alert_type}: ${alert.details}`;

    if (['KICK', 'BAN'].includes(action)) {
      // Find highest case ID with MAX()+1 inside transaction
      const modTransaction = db.transaction(() => {
        const lastCase = db.prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) as max_id FROM moderation_cases WHERE id LIKE 'MOD-%'").get() as { max_id: number | null };
        const nextNum = (lastCase?.max_id || 0) + 1;
        caseId = `MOD-${String(nextNum).padStart(4, '0')}`;

        db.prepare(`
          INSERT INTO moderation_cases (
            id, target_id, target_username, moderator_id, moderator_username,
            action_type, reason, duration, status, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        `).run(
          caseId,
          alert.roblox_id || 'ROBLOX_USER',
          alert.player_name,
          staffUser.id,
          staffUser.username,
          action,
          actionDesc,
          action === 'BAN' ? '7 Days' : null,
          now
        );
      });
      modTransaction();
    }

    // Update alert status
    db.prepare(`
      UPDATE watchdog_alerts
      SET status = 'RESOLVED', action_taken = ?, action_by = ?, resolved_at = ?
      WHERE id = ?
    `).run(effectiveAction, staffUser.username, now, alertId);

    // Adaptive learning: reinforce confidence
    this.adjustConfidenceThreshold(alert.alert_type, +2);

    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES ('WATCHDOG_ACTION', ?, ?, ?, ?)
    `).run(staffUser.id, alert.player_name, `Action: ${effectiveAction} on alert #${alertId} | Case: ${caseId || 'N/A'}`, now);

    return {
      success: true,
      message: `Action ${effectiveAction} executed on player ${alert.player_name}.`,
      caseId: caseId || undefined
    };
  }

  private adjustConfidenceThreshold(alertType: string, delta: number) {
    try {
      const key = `sensitivity_${alertType.toLowerCase()}`;
      const existing = db.prepare('SELECT value FROM watchdog_settings WHERE key = ?').get(key) as { value: string } | undefined;
      const current = existing ? parseInt(existing.value, 10) : 80;
      const updated = Math.max(50, Math.min(99, current + delta));
      db.prepare(`
        INSERT INTO watchdog_settings (key, value, updated_by, updated_at)
        VALUES (?, ?, 'WatchdogLearning', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(key, String(updated), Date.now());
    } catch {}
  }
}

export const watchdogService = new WatchdogService();
export default watchdogService;
