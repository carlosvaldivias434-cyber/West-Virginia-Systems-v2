import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'botbl',
  description: 'Blacklist a member from interacting with all WVRP Bot commands',
  category: 'Administration',
  permission: 'HIGH_RANK',
  aliases: ['botbl', 'bblacklist', 'botblacklist'],
  usage: '-botbl <@user> [reason]',
  slashData: new SlashCommandBuilder()
    .setName('botbl')
    .setDescription('Blacklist a user from bot commands')
    .addUserOption(opt => opt.setName('user').setDescription('User to blacklist').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for blacklist').setRequired(false)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Member' } : null);
    if (!target) return context.reply({ content: '❌ Please specify a user to bot blacklist.' });

    const reason = context.options?.getString?.('reason') || args.slice(1).join(' ') || 'Bot abuse or command spam';
    const staff = context.author || context.user;
    const now = Date.now();

    db.prepare(`
      INSERT OR REPLACE INTO blacklists (user_id, type, reason, issuer_id, created_at)
      VALUES (?, 'BOT', ?, ?, ?)
    `).run(target.id, reason, staff.id, now);

    const embed = WvrpEmbedBuilder.createBase({
      title: '🤖 Bot Access Blacklisted',
      description: `**User:** <@${target.id}> (\`${target.id}\`)\n**Issuer:** <@${staff.id}>\n**Reason:** ${reason}\n**Action:** Member is blocked from executing all prefix and slash commands.`,
      footerText: 'West Virginia State Roleplay · Bot Security'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
