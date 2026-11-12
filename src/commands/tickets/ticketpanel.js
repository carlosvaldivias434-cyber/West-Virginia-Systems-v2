import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits
} from 'discord.js';

export default {
  name: 'ticketpanel',
  description: 'Post the West Virginia Support Center ticket panel',
  category: 'Tickets',
  permission: 'ADMIN',
  aliases: ['ticketpanel'],
  usage: '-ticketpanel or /ticketpanel',
  slashData: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Post the West Virginia Support Center ticket panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(context) {
    const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'ticket_panel',
      title: 'Contact us — West Virginia Roleplay',
      description: `Need assistance? Open a ticket and our team will be ready to help. Choose the category that matches your issue below and a private channel will be opened for you.\n\n**Choose your category:**\n⚙️ **General:** Questions, support, and assistance from any staff member.\n👤⚙️ **High Rank:** Escalated concerns requiring senior staff attention.\n👮 **Department:** Department-related or high-priority leadership matters.\n\n**Support Options & Guidelines**\n• Please be respectful to the handler\n• Please do not constantly ping staff\n• Please give clear information upon opening\n• Please do not mis-use the ticket system`
    });

    const faqRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_faq')
        .setPlaceholder('Frequently Asked Questions')
        .addOptions([
          { label: 'How do I apply for staff?', value: 'faq_apply', description: 'Applications are in #applications hub' },
          { label: 'Can I open a new department?', value: 'faq_dept', description: 'Department proposals are handled by Management' },
          { label: 'Are you accepting staff transfers/fast passes?', value: 'faq_transfers', description: 'Transfers accepted up to Internal Affairs' },
          { label: 'How do I join the sheriff team?', value: 'faq_sheriff', description: 'Sheriff & Police teams are whitelisted for staff/verified members' }
        ])
    );

    const categoryRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_create_category')
        .setPlaceholder('Choose your category')
        .addOptions([
          { label: 'General Support', value: 'General Support', emoji: '⚙️', description: 'General questions, assistance, and help' },
          { label: 'High Rank Support', value: 'High Rank Support', emoji: '👤', description: 'Senior staff escalations and sensitive issues' },
          { label: 'Department Support', value: 'Department Support', emoji: '👮', description: 'Department coordination, tryouts, questions' },
          { label: 'Internal Affairs / Staff Report', value: 'Internal Affairs', emoji: '🛡️', description: 'Report a staff member or submit evidence' },
          { label: 'Purchase Redemption', value: 'Purchase Redemption', emoji: '🛒', description: 'Claim items purchased from WVRP Marketplace' }
        ])
    );

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_get_support')
        .setLabel('Get Support')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫')
    );

    return context.reply({ embeds, components: [faqRow, categoryRow, buttonRow] });
  }
};
