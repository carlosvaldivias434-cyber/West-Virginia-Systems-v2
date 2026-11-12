import welcomeService from '../../../WVRP/bot/services/welcomeService.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  name: 'testwelcome',
  description: 'Test the automatic welcome embed and buttons for a member',
  category: 'Administration',
  permission: 'ADMINISTRATOR',
  aliases: ['testwelcome', 'twelcome'],
  usage: '-testwelcome [@user] or /testwelcome [user]',
  slashData: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Simulate and preview the official WVRP welcome card')
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
      guild: context.guild || { memberCount: 20028 }
    };

    const payload = welcomeService.formatWelcomeMessage(memberMock);
    const buttons = welcomeService.createWelcomeButtons(context.guild?.memberCount || 20028);

    return context.reply({
      content: `🧪 **[TEST MODE] Welcome Event Simulation for <@${target.id}>:**\n${payload.content}`,
      embeds: payload.embeds,
      components: [buttons]
    });
  }
};
