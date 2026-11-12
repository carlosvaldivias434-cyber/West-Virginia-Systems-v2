import afkService from '../../../WVRP/bot/services/afkService.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'afk',
  description: 'Set your status as AFK (updates server nickname and tracks incoming pings)',
  category: 'Utility',
  permission: 'EVERYONE',
  aliases: ['afk'],
  usage: '-afk [reason] or /afk [reason]',
  slashData: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your status as AFK')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for going AFK')),
  async execute(context, args = []) {
    const reason = context.options?.getString?.('reason') || args.join(' ') || 'AFK';
    const member = context.member;
    const user = context.user || context.author;
    const guild = context.guild;

    const res = await afkService.setAfk(member, user, reason, guild);
    return context.reply({ embeds: [res.embed] });
  }
};
