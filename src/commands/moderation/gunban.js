import db from '../../../WVRP/bot/database/index.js';
import erlcService from '../../../WVRP/bot/services/erlcService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'gunban',
  description: 'Revoke a global ban across WVRP Discord and ER:LC servers',
  category: 'Moderation',
  permission: 'HIGH_RANK',
  aliases: ['gunban', 'globalunban'],
  usage: '-gunban <@user|id> [reason]',
  slashData: new SlashCommandBuilder()
    .setName('gunban')
    .setDescription('Globally unban a user from Discord and ER:LC')
    .addUserOption(opt => opt.setName('user').setDescription('User to global unban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for unban').setRequired(false)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Target' } : null);
    if (!target) return context.reply({ content: '❌ Please specify a user to global unban.' });

    const reason = context.options?.getString?.('reason') || args.slice(1).join(' ') || 'Appeal accepted by Directive Team';
    const staff = context.author || context.user;

    // Remove from blacklists table
    db.prepare("DELETE FROM blacklists WHERE user_id = ? AND type = 'GLOBAL'").run(target.id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES ('GLOBAL_UNBAN', ?, ?, ?, ?)
    `).run(staff.id, target.id, reason, Date.now());

    // ER:LC unban
    if (erlcService.isConfigured()) {
      await erlcService.runCommand(`:unban ${target.username || target.id}`);
    }

    // Discord guild unban
    try {
      if (context.guild?.members?.unban) {
        await context.guild.members.unban(target.id, reason);
      }
    } catch (e) {
      // Ignore if unban not found in Discord ban list
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: '🕊️ GLOBAL BAN REVOKED',
      description: `**Target:** <@${target.id}> (\`${target.id}\`)\n**Authorized By:** <@${staff.id}>\n**Reason:** ${reason}\n**Status:** Successfully unbanned from WVRP Discord and ER:LC records.`,
      footerText: 'West Virginia State Roleplay · Executive Actions'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
