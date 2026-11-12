import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'ticketbl',
  description: 'Block or unblock someone from opening tickets (Ticket Blacklist)',
  category: 'Tickets',
  permission: 'STAFF',
  aliases: ['ticketbl', 'tbl', 'blacklistticket'],
  usage: '-ticketbl <@user> [reason]',
  slashData: new SlashCommandBuilder()
    .setName('ticketbl')
    .setDescription('Block a user from opening support tickets')
    .addUserOption(opt => opt.setName('user').setDescription('User to blacklist from tickets').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ticket blacklist').setRequired(false)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Member' } : null);
    if (!target) {
      return context.reply({ content: '❌ Please specify a user to blacklist from opening tickets. Usage: `-ticketbl <@user> [reason]`' });
    }

    const reason = context.options?.getString?.('reason') || args.slice(1).join(' ') || 'Repeated ticket spam and non-compliance';
    const staff = context.author || context.user;

    const existing = db.prepare("SELECT * FROM blacklists WHERE user_id = ? AND type = 'TICKET'").get(target.id);
    if (existing) {
      return context.reply({ content: `⚠️ <@${target.id}> is already blacklisted from opening tickets.\n> **Reason:** ${existing.reason}\n> **Blacklisted By:** <@${existing.issuer_id}>` });
    }

    const now = Date.now();
    db.prepare(`
      INSERT INTO blacklists (user_id, type, reason, issuer_id, created_at)
      VALUES (?, 'TICKET', ?, ?, ?)
    `).run(target.id, reason, staff.id, now);

    const embed = WvrpEmbedBuilder.createBase({
      title: '🚫 Member Ticket Blacklisted',
      description: `**User:** <@${target.id}> (\`${target.id}\`)\n**Issuer:** <@${staff.id}>\n**Reason:** ${reason}\n**Action:** Blocked from opening all WVRP support tickets\n**Timestamp:** <t:${Math.floor(now / 1000)}:F>`,
      footerText: 'West Virginia State Roleplay · Ticket Moderation'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
