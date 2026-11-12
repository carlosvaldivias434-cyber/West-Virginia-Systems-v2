import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from 'discord.js';

export default {
  name: 'session',
  description: 'Manage community sessions and announcements (startup, shutdown, vote, low, full)',
  category: 'Management',
  permission: 'ADMIN',
  aliases: ['session'],
  usage: '-session <startup|shutdown|vote|low|full>',
  subcommands: ['startup', 'shutdown', 'vote', 'low', 'full'],
  slashData: new SlashCommandBuilder()
    .setName('session')
    .setDescription('Session announcements and voting')
    .addSubcommand(sub => sub.setName('vote').setDescription('Start a session vote').addIntegerOption(opt => opt.setName('duration').setDescription('Vote duration in minutes')))
    .addSubcommand(sub => sub.setName('startup').setDescription('Announce session startup'))
    .addSubcommand(sub => sub.setName('shutdown').setDescription('Announce server session shutdown'))
    .addSubcommand(sub => sub.setName('low').setDescription('Announce low server population'))
    .addSubcommand(sub => sub.setName('full').setDescription('Announce server is full')),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'vote';

    if (sub === 'shutdown') {
      db.prepare("UPDATE sessions SET status = 'OFFLINE', player_count = 0, queue_count = 0, staff_count = 0 WHERE id = 'main'").run();
      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'session_shutdown',
        title: 'Session Shutdown',
        description: 'Our in-game server has been shut down. At this time, please refrain from joining, or you may face moderation actions against your account. Keep an eye on this channel for the next session!'
      });
      return context.reply({ embeds });
    }

    if (sub === 'startup') {
      db.prepare("UPDATE sessions SET status = 'ONLINE' WHERE id = 'main'").run();
      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'session_startup',
        title: 'Session Startup',
        description: 'A West Virginia Roleplay session has officially begun! Hop into the server and get into character. Follow all in-game regulations and server rules.'
      });
      return context.reply({ embeds });
    }

    if (sub === 'vote') {
      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'session_vote',
        title: 'Session Vote',
        description: 'Do you want a West Virginia Roleplay session right now? Cast your vote below! A minimum of 10 votes is required for startup.'
      });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('session_vote_yes').setLabel('Vote Yes (12)').setStyle(ButtonStyle.Success).setEmoji('👍')
      );
      return context.reply({ embeds, components: [row] });
    }

    if (sub === 'low') {
      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'session_low_population',
        title: 'Low Server Population',
        description: 'Server player count is currently running low! Hop in now to keep the roleplay active, realistic, and thriving across West Virginia.'
      });
      return context.reply({ embeds });
    }

    if (sub === 'full') {
      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'session_full',
        title: 'Server Full',
        description: 'The server is currently at maximum capacity! Please wait patiently in queue or check back shortly.'
      });
      return context.reply({ embeds });
    }

    return context.reply({ content: `Session subcommand \`${sub}\` completed.` });
  }
};
