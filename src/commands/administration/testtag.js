import boostService from '../../../WVRP/bot/services/boostService.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  name: 'testtag',
  description: 'Test the automatic WVRP server vanity tag add/remove notification',
  category: 'Administration',
  permission: 'ADMINISTRATOR',
  aliases: ['testtag', 'ttag'],
  usage: '-testtag [@user] [added|removed] or /testtag [user] [action]',
  slashData: new SlashCommandBuilder()
    .setName('testtag')
    .setDescription('Simulate and preview the official WVRP tag announcement')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(false))
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Tag added or removed')
        .setRequired(false)
        .addChoices(
          { name: 'Tag Added (Joined)', value: 'ADDED' },
          { name: 'Tag Removed (Left)', value: 'REMOVED' }
        )
    ),
  async execute(context, args = []) {
    let target = context.user || context.author;
    let action = 'ADDED';

    if (context.options?.getString) {
      target = context.options.getUser('user') || target;
      action = context.options.getString('action') || 'ADDED';
    } else {
      if (args[0] && (args[0].startsWith('<@') || args[0].match(/^\d+$/))) {
        const id = args[0].replace(/[<@!>]/g, '');
        if (context.guild?.members?.cache?.has(id)) {
          target = context.guild.members.cache.get(id).user;
        }
        if (args[1]) action = args[1].toUpperCase().includes('REM') ? 'REMOVED' : 'ADDED';
      } else if (args[0]) {
        action = args[0].toUpperCase().includes('REM') ? 'REMOVED' : 'ADDED';
      }
    }

    const memberMock = {
      id: target.id,
      user: target,
      username: target.username,
      guild: context.guild
    };

    const payload = boostService.generateTagPayload(memberMock, action);

    return context.reply({
      content: `🧪 **[TEST MODE] Vanity Tag Notification (${action}):**\n${payload.content}`,
      embeds: payload.embeds
    });
  }
};
