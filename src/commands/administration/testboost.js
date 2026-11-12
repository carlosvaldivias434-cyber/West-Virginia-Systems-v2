import boostService from '../../../WVRP/bot/services/boostService.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  name: 'testboost',
  description: 'Test the automatic server boost notification and dual banner embed',
  category: 'Administration',
  permission: 'ADMINISTRATOR',
  aliases: ['testboost', 'tboost'],
  usage: '-testboost [@user] or /testboost [user]',
  slashData: new SlashCommandBuilder()
    .setName('testboost')
    .setDescription('Simulate and preview the official WVRP boost announcement')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt => opt.setName('user').setDescription('Target member to test with').setRequired(false)),
  async execute(context, args = []) {
    let target = context.user || context.author;
    if (context.options?.getUser) {
      target = context.options.getUser('user') || target;
    } else if (args[0]) {
      const id = args[0].replace(/[<@!>]/g, '');
      if (context.guild?.members?.cache?.has(id)) {
        target = context.guild.members.cache.get(id).user;
      }
    }

    const memberMock = {
      id: target.id,
      user: target,
      username: target.username,
      guild: context.guild || { memberCount: 20028, premiumSubscriptionCount: 34 }
    };

    const payload = boostService.generateBoostPayload(memberMock, 3, context.guild?.premiumSubscriptionCount || 34);

    return context.reply({
      content: `🧪 **[TEST MODE] Server Boost Announcement for <@${target.id}>:**\n${payload.content}`,
      embeds: payload.embeds
    });
  }
};
