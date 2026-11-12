import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from 'discord.js';

export default {
  name: 'training',
  description: 'Manage staff academy training sessions and logs',
  category: 'Staff',
  permission: 'STAFF',
  aliases: ['training'],
  usage: '-training <start|log> [args]',
  subcommands: ['start', 'log'],
  slashData: new SlashCommandBuilder()
    .setName('training')
    .setDescription('Training announcements and results')
    .addSubcommand(sub => sub.setName('start').setDescription('Post a training start announcement'))
    .addSubcommand(sub => sub.setName('log').setDescription('Log a trainee result')
      .addUserOption(opt => opt.setName('trainee').setDescription('Trainee user').setRequired(true))
      .addStringOption(opt => opt.setName('result').setDescription('Result (Passed or Failed)').setRequired(true).addChoices(
        { name: 'Passed', value: 'Passed' },
        { name: 'Failed', value: 'Failed' }
      ))
      .addStringOption(opt => opt.setName('notes').setDescription('Training notes/feedback'))),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'start';
    const trainer = context.user || context.author;

    if (sub === 'log' || sub === 'results') {
      const trainee = context.options?.getUser?.('trainee') || { id: '1122334455', username: 'Cadet_John', tag: 'Cadet_John' };
      const result = context.options?.getString?.('result') || args[1] || 'Passed';
      const notes = context.options?.getString?.('notes') || args.slice(2).join(' ') || 'Completed standard driving, radio, and code evaluation satisfactorily.';

      const embeds = WvrpEmbedBuilder.createTrainingLogEmbed({
        traineeMention: `<@${trainee.id}>`,
        traineeUsername: trainee.username || trainee.tag,
        trainerMention: `<@${trainer.id}>`,
        trainerUsername: trainer.username || trainer.tag,
        result,
        notes
      });

      return context.reply({ embeds });
    }

    // Default: Training start announcement
    const embeds = WvrpEmbedBuilder.createTrainingAnnouncementEmbed({
      trainerMention: `<@${trainer.id}>`,
      status: 'Ongoing',
      startedAgo: 'Just now',
      attendingList: 'Awaiting attendees'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('training_join_btn').setLabel('Join Training').setStyle(ButtonStyle.Success).setEmoji('✅'),
      new ButtonBuilder().setCustomId('training_end_btn').setLabel('End Training').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('training_game_btn').setLabel('Join Game').setStyle(ButtonStyle.Link).setURL('https://policeroleplay.community/join/wvrp')
    );

    return context.reply({ embeds, components: [row] });
  }
};
