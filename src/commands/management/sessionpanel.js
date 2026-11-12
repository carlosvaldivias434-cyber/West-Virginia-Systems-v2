import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  PermissionFlagsBits
} from 'discord.js';

export default {
  name: 'sessionpanel',
  description: 'Post the interactive live session management panel',
  category: 'Management',
  permission: 'ADMIN',
  aliases: ['sessionpanel'],
  usage: '-sessionpanel or /sessionpanel',
  slashData: new SlashCommandBuilder()
    .setName('sessionpanel')
    .setDescription('Post the interactive live session management panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(context) {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get('main') || {
      server_name: 'West Virginia Roleplay | Strict | Realistic',
      join_code: 'wvrp',
      owner_name: 'WVRP Management',
      player_count: 18,
      queue_count: 2,
      staff_count: 4,
      status: 'ONLINE'
    };

    const isOnline = session.status === 'ONLINE' || session.status === 'STARTUP';

    const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'session',
      title: 'West Virginia Sessions',
      description: `Welcome to West Virginia Roleplay sessions. We run on a session-based operating system — sessions are managed by our Community Directive & Management teams, but please don't demand a session management action be taken.\n\n📌 **In-Game Information**\nServer Name: \`${session.server_name}\`\nServer Join Code: \`${session.join_code}\`\nServer Owner: \`${session.owner_name}\`\n\n👥 **Player Count:** \`${session.player_count} Players\`\n⏱ **In-Queue:** \`${session.queue_count} In Queue\`\n🪪 **Staff In-Game:** \`${session.staff_count} Staff\``
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('session_status_indicator')
        .setLabel(`Status: ${isOnline ? 'Online' : 'Offline'}`)
        .setStyle(isOnline ? ButtonStyle.Success : ButtonStyle.Danger)
        .setEmoji('📶'),
      new ButtonBuilder()
        .setCustomId('session_quick_join')
        .setLabel('Quick-Join')
        .setStyle(ButtonStyle.Link)
        .setURL('https://policeroleplay.community/join/wvrp'),
      new ButtonBuilder()
        .setCustomId('session_notify_toggle')
        .setLabel('Session Notification')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔔')
    );

    const rightRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('session_view_players').setLabel('Players').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('session_view_queue').setLabel('Queue').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('session_view_staff').setLabel('Staff').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('session_vote_btn').setLabel('Session Vote').setStyle(ButtonStyle.Primary)
    );

    return context.reply({ embeds, components: [row, rightRow] });
  }
};
