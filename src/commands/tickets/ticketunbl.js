import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'ticketunbl',
  description: 'Unblock someone from opening tickets (Remove Ticket Blacklist)',
  category: 'Tickets',
  permission: 'STAFF',
  aliases: ['ticketunbl', 'tunbl', 'unblacklistticket'],
  usage: '-ticketunbl <@user>',
  slashData: new SlashCommandBuilder()
    .setName('ticketunbl')
    .setDescription('Unblock a user from opening support tickets')
    .addUserOption(opt => opt.setName('user').setDescription('User to unblacklist').setRequired(true)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Member' } : null);
    if (!target) {
      return context.reply({ content: '❌ Please specify a user to unblacklist. Usage: `-ticketunbl <@user>`' });
    }

    const staff = context.author || context.user;
    const existing = db.prepare("SELECT * FROM blacklists WHERE user_id = ? AND type = 'TICKET'").get(target.id);
    if (!existing) {
      return context.reply({ content: `ℹ️ <@${target.id}> is not currently blacklisted from opening tickets.` });
    }

    db.prepare("DELETE FROM blacklists WHERE user_id = ? AND type = 'TICKET'").run(target.id);

    const embed = WvrpEmbedBuilder.createBase({
      title: '✅ Ticket Blacklist Revoked',
      description: `**User:** <@${target.id}> (\`${target.id}\`)\n**Revoked By:** <@${staff.id}>\n**Previous Reason:** ${existing.reason}\n**Action:** Member is now permitted to open support tickets.\n**Timestamp:** <t:${Math.floor(Date.now() / 1000)}:R>`,
      footerText: 'West Virginia State Roleplay · Ticket Moderation'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
