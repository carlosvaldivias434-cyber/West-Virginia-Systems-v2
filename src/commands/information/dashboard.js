import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  name: 'dashboard',
  description: 'View the official West Virginia Roleplay central hub and quick access links',
  category: 'Information',
  permission: 'EVERYONE',
  aliases: ['dashboard', 'links', 'hub'],
  usage: '-dashboard or /dashboard',
  slashData: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('WVRP community dashboard and portal links'),
  async execute(context) {
    const desc = [
      'Welcome to the **West Virginia State Roleplay Central Portal**. Access all official community platforms below:\n',
      '🔗 **Official Links & Resources:**',
      '• 🌲 **Roblox Group:** [WVRP Main Group](https://www.roblox.com/groups/wvrp)',
      '• 🚨 **ER:LC Private Server Code:** Join with code `wvrp`',
      '• 🔐 **Account Verification:** [Bloxlink Portal](https://blox.link/verify)',
      '• 📋 **Staff & Dept Applications:** Run `/apply` or visit `#applications`',
      '• 🎫 **Member Support:** Open a ticket in `#support-tickets`',
      '• ⚖️ **Community Regulations:** View with `-regulation`',
      '',
      '🟢 **System Health:** `All Systems Operational (Database, ER:LC API, Bot)`'
    ].join('\n');

    const embed = WvrpEmbedBuilder.createBase({
      title: '🌐 West Virginia State Roleplay — Central Dashboard',
      description: desc,
      footerText: 'West Virginia Systems · Operations Console'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Roblox Group').setStyle(ButtonStyle.Link).setURL('https://www.roblox.com'),
      new ButtonBuilder().setLabel('Link Bloxlink').setStyle(ButtonStyle.Link).setURL('https://blox.link/verify'),
      new ButtonBuilder().setLabel('Support Ticket').setStyle(ButtonStyle.Primary).setCustomId('ticket_create_category')
    );

    return context.reply({ embeds: [embed], components: [row] });
  }
};
