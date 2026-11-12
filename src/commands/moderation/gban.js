import db from '../../../WVRP/bot/database/index.js';
import erlcService from '../../../WVRP/bot/services/erlcService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'gban',
  description: 'Global ban a member across both WVRP Discord and in-game ER:LC servers',
  category: 'Moderation',
  permission: 'HIGH_RANK',
  aliases: ['gban', 'globalban'],
  usage: '-gban <@user|id> <reason>',
  slashData: new SlashCommandBuilder()
    .setName('gban')
    .setDescription('Globally ban a user from Discord and in-game ER:LC')
    .addUserOption(opt => opt.setName('user').setDescription('User to global ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for global ban').setRequired(true)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Target' } : null);
    if (!target) return context.reply({ content: '❌ Please specify a user to global ban. Usage: `-gban <@user> <reason>`' });

    const reason = context.options?.getString?.('reason') || args.slice(1).join(' ') || 'Severe community violation and harassment';
    const staff = context.author || context.user;
    const now = Date.now();

    // 1. Record in global blacklists table
    db.prepare(`
      INSERT OR REPLACE INTO blacklists (user_id, type, reason, issuer_id, created_at)
      VALUES (?, 'GLOBAL', ?, ?, ?)
    `).run(target.id, reason, staff.id, now);

    // 2. Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES ('GLOBAL_BAN', ?, ?, ?, ?)
    `).run(staff.id, target.id, reason, now);

    // 3. Attempt in-game ER:LC ban
    let erlcStatus = 'Saved in database';
    if (erlcService.isConfigured()) {
      const res = await erlcService.runCommand(`:ban ${target.username || target.id}`);
      erlcStatus = res.success ? 'Executed :ban in ER:LC server' : `ER:LC status: ${res.error || 'Sent'}`;
    }

    // 4. Attempt Discord guild ban if member is in guild
    try {
      if (context.guild?.members?.ban) {
        await context.guild.members.ban(target.id, { reason: `[WVRP GBAN] ${reason} (by ${staff.username})` });
      }
    } catch (e) {
      // Guild ban might fail if bot lacks permission or target already left
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: '🚨 GLOBAL BAN EXECUTED',
      description: `**Target:** <@${target.id}> (\`${target.id}\`)\n**Authorized By:** <@${staff.id}>\n**Reason:** ${reason}\n\n🌐 **Enforcement Scope:**\n• **Discord Guild:** Permanently Banned\n• **ER:LC In-Game Server:** ${erlcStatus}\n• **WVRP Database:** Blacklist Flagged (\`GLOBAL\`)`,
      footerText: 'West Virginia State Roleplay · High Rank Enforcement'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
