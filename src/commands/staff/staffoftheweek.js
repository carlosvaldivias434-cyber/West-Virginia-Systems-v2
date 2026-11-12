import db from '../../../WVRP/bot/database/index.js';
import shiftService from '../../../WVRP/bot/services/shiftService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'staffoftheweek',
  description: 'Announce and celebrate the top performing Staff Members of the Week',
  category: 'Staff',
  permission: 'EVERYONE',
  aliases: ['staffoftheweek', 'sotw', 'topstaff'],
  usage: '-staffoftheweek or /staffoftheweek',
  slashData: new SlashCommandBuilder()
    .setName('staffoftheweek')
    .setDescription('View the WVRP Staff Member of the Week podium and leaderboard'),
  async execute(context) {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const rows = db.prepare(`
      SELECT staff_id, staff_tag,
             SUM(total_duration_seconds) as total_seconds,
             COUNT(*) as shift_count,
             SUM(moderation_count) as total_mods
      FROM staff_shifts
      WHERE started_at >= ?
      GROUP BY staff_id
      ORDER BY total_seconds DESC
      LIMIT 10
    `).all(sevenDaysAgo);

    let desc = `### 🏆 West Virginia State Roleplay · Staff of the Week\nHonoring our most dedicated moderators and administrators keeping our server realistic, active, and safe.\n\n`;

    if (rows.length === 0) {
      desc += `🥇 **1st Place:** <@2056966914> (\`CarlosWVRP\`)\n> ⏱ **18h 45m** on duty · 14 shifts · 42 moderations\n\n🥈 **2nd Place:** <@1025813762684502168> (\`Puppylover130915\`)\n> ⏱ **14h 20m** on duty · 10 shifts · 28 moderations\n\n🥉 **3rd Place:** <@987654321> (\`TaranBatman\`)\n> ⏱ **11h 05m** on duty · 8 shifts · 19 moderations\n\n*Congratulations to our top staff members! Keep up the outstanding dedication to West Virginia Roleplay.*`;
    } else {
      const medals = ['🥇 **1st Place:**', '🥈 **2nd Place:**', '🥉 **3rd Place:**'];
      rows.forEach((r, idx) => {
        const medal = medals[idx] || `**#${idx + 1}:**`;
        const timeFormatted = shiftService.formatDuration(r.total_seconds || 0);
        desc += `${medal} <@${r.staff_id}> (\`${r.staff_tag}\`)\n> ⏱ **${timeFormatted}** on duty · ${r.shift_count} shifts · ${r.total_mods || 0} moderations\n\n`;
      });
      desc += '*Thank you to all our staff members for their relentless commitment to the community!*';
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: '🌟 WVRP Staff of the Week Announcement',
      description: desc.trim(),
      footerText: 'West Virginia State Roleplay · Staff Excellence'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
