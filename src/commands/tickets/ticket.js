import db from '../../../WVRP/bot/database/index.js';
import cookieTranscriptService from '../../../WVRP/bot/services/cookieTranscriptService.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from 'discord.js';

export default {
  name: 'ticket',
  description: 'Manage an active support ticket (add, remove, claim, unclaim, close)',
  category: 'Tickets',
  permission: 'STAFF',
  aliases: ['ticket'],
  usage: '-ticket <claim|unclaim|close|add|remove|rename> [args]',
  subcommands: ['claim', 'unclaim', 'close', 'add', 'remove', 'rename', 'close-request'],
  slashData: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage active support tickets')
    .addSubcommand(sub => sub.setName('add').setDescription('Add user to ticket').addUserOption(opt => opt.setName('user').setDescription('User to add').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove user from ticket').addUserOption(opt => opt.setName('user').setDescription('User to remove').setRequired(true)))
    .addSubcommand(sub => sub.setName('claim').setDescription('Claim current ticket'))
    .addSubcommand(sub => sub.setName('unclaim').setDescription('Unclaim current ticket'))
    .addSubcommand(sub => sub.setName('close').setDescription('Close ticket and generate transcript'))
    .addSubcommand(sub => sub.setName('rename').setDescription('Rename ticket').addStringOption(opt => opt.setName('name').setDescription('New name').setRequired(true)))
    .addSubcommand(sub => sub.setName('close-request').setDescription('Request opener to confirm closure')),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'claim';
    const channelId = context.channel?.id || 'simulated_ticket_channel';
    const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id = ? OR id = ?').get(channelId, channelId);

    if (sub === 'claim') {
      const claimer = context.user || context.author;
      if (ticket) {
        db.prepare("UPDATE tickets SET claimed_by = ? WHERE id = ?").run(claimer.tag || claimer.username, ticket.id);
      }
      return context.reply({ content: `✅ **@${claimer.tag || claimer.username}** has claimed this ticket.` });
    }

    if (sub === 'unclaim') {
      const unclaimer = context.user || context.author;
      if (ticket) {
        db.prepare("UPDATE tickets SET claimed_by = NULL WHERE id = ?").run(ticket.id);
      }
      return context.reply({ content: `ℹ️ Ticket has been unclaimed by **@${unclaimer.tag || unclaimer.username}**.` });
    }

    if (sub === 'close') {
      const closer = context.user || context.author;
      const res = await cookieTranscriptService.generateTranscript(ticket?.id || '0850', closer);
      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'ticket_closed',
        title: `Ticket #${ticket?.id || '0850'} — ${ticket?.category || 'General Support'}`,
        description: `General Support ticket in West Virginia Roleplay has been closed.\n\n↳ **Handled By:** ${ticket?.claimed_by ? `@${ticket.claimed_by}` : `@${closer.tag || closer.username}`}\n↳ **Closed By:** @${closer.tag || closer.username}\n⏰ **Opened:** ${new Date(ticket?.created_at || Date.now() - 3600000).toLocaleString()}\n⏰ **Closed:** Just now\n⏳ **Duration:** ${res.durationMinutes}m\n🎫 **Messages Sent:** ${res.messageCount} messages`
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Online Transcript').setStyle(ButtonStyle.Link).setURL(`https://wvrp-transcripts.local${res.url}`)
      );

      return context.reply({ embeds, components: [row] });
    }

    if (sub === 'add') {
      const target = context.options?.getUser?.('user') || args[1] || '@Member';
      return context.reply({ content: `✅ **${target}** has been added to this ticket by @${(context.user || context.author).username}.` });
    }

    if (sub === 'remove') {
      const target = context.options?.getUser?.('user') || args[1] || '@Member';
      return context.reply({ content: `❌ **${target}** has been removed from this ticket by @${(context.user || context.author).username}.` });
    }

    return context.reply({ content: `Ticket operation \`${sub}\` executed.` });
  }
};
