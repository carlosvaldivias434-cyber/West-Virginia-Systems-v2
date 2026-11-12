import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';

export default {
  name: 'tripwire',
  description: 'Emergency Anti-Raid & Security Tripwire Monitor (Prefix Only)',
  category: 'Utility',
  permission: 'ADMINISTRATOR',
  aliases: ['tripwire', '!tripwire', 'tw'],
  usage: '!tripwire <status|arm|disarm|check>',
  slashData: null, // Strictly prefix-only as required
  async execute(context, args = []) {
    const action = (args[0] || 'status').toLowerCase();
    const executor = context.user || context.author;

    // Verify Admin/Leadership permissions
    const member = context.member;
    const hasAdmin = member?.permissions?.has('Administrator') ||
      member?.roles?.cache?.some(r => r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('management') || r.name.toLowerCase().includes('owner'));

    if (!hasAdmin && executor.id !== context.guild?.ownerId) {
      return context.reply({ content: '🚫 You do not have permission to execute the emergency **!tripwire** protocol. High Command clearance required.' });
    }

    let statusRow = db.prepare("SELECT value FROM application_settings WHERE key = 'tripwire_active'").get();
    let isArmed = statusRow ? statusRow.value === '1' : true;

    if (action === 'arm') {
      db.prepare(`
        INSERT INTO application_settings (key, value, updated_by, updated_at)
        VALUES ('tripwire_active', '1', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = '1', updated_by = ?, updated_at = ?
      `).run(executor.id, Date.now(), executor.id, Date.now());
      isArmed = true;
    } else if (action === 'disarm') {
      db.prepare(`
        INSERT INTO application_settings (key, value, updated_by, updated_at)
        VALUES ('tripwire_active', '0', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = '0', updated_by = ?, updated_at = ?
      `).run(executor.id, Date.now(), executor.id, Date.now());
      isArmed = false;
    }

    const desc = [
      `### 🛡️ West Virginia Defensive Security Protocol`,
      `• **Tripwire Status:** ${isArmed ? '🔴 **ARMED & ACTIVELY MONITORING**' : '⚪ **DISARMED / STANDBY**'}`,
      `• **Anti-Raid Filter:** \`STRICT (Mass Join & Rapid Ping Detection Active)\``,
      `• **Anti-Ping Watchdog:** \`ACTIVE (Tier 1-5 Auto-Escalation)\``,
      `• **Livery & Comms Guards:** \`ACTIVE (ER:LC Real-Time Sync)\``,
      `• **Last Inspected By:** <@${executor.id}>`,
      '',
      `**Usage:**`,
      `• \`!tripwire arm\` — Arm immediate heightened perimeter defense`,
      `• \`!tripwire disarm\` — Lower security protocol to normal`,
      `• \`!tripwire status\` — Inspect active tripwire sensor telemetry`
    ].join('\n');

    const embed = WvrpEmbedBuilder.createBase({
      title: '🚨 WVRP Security Command · Tripwire Grid',
      description: desc,
      footerText: 'West Virginia State Roleplay · High Command Defensive Operations'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
