import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';

export default {
  name: 'testidle',
  description: 'Test or trigger an automatic inactive ticket warning notification',
  category: 'Tickets',
  permission: 'STAFF',
  aliases: ['testidle', 'idleticket', 'inactiveticket'],
  usage: '-testidle [hours]',
  slashData: new SlashCommandBuilder()
    .setName('testidle')
    .setDescription('Test or trigger inactive ticket warning notification')
    .addIntegerOption(opt => opt.setName('hours').setDescription('Hours of inactivity (default: 24)').setRequired(false)),
  async execute(context, args = []) {
    const hours = context.options?.getInteger?.('hours') || parseInt(args[0] || '24', 10);

    const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'ticket_closed',
      title: '⚠️ Inactive Ticket Notification',
      description: `Hello! We noticed there hasn't been any response in this ticket for over **${hours} hours**.\n\n• If your issue has been resolved, you can close this ticket using the button below.\n• If you still need help, please send a message or click **"I Still Need Help"** to keep this ticket open.\n\n*If no response is received within the next **12 hours**, this ticket will automatically be closed with an archived transcript.*`
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_keep_open')
        .setLabel('I Still Need Help')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🙋'),
      new ButtonBuilder()
        .setCustomId('ticket_confirm_close')
        .setLabel('Close Ticket Now')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    return context.reply({
      content: '⏱ **[Simulation] Ticket Inactivity Notice**',
      embeds,
      components: [row]
    });
  }
};
