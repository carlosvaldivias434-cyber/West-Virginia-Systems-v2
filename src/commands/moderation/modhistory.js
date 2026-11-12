import { SlashCommandBuilder } from 'discord.js';
import moderationService from '../../../WVRP/bot/services/moderationService.js';
import { createModerationHistoryV2 } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { checkPermission } from '../registryStore.js';

export default {
  name: 'modhistory',
  description: 'Inspect complete moderation history and past punishments for a member',
  category: 'Moderation',
  permission: 'STAFF',
  aliases: ['modhistory', 'history', 'modlogs'],
  usage: '-modhistory <@user|id> [page]',
  slashData: new SlashCommandBuilder()
    .setName('modhistory')
    .setDescription('Inspect moderation history for a specific member')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Target member to inspect')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('page')
        .setDescription('Page number')
        .setRequired(false)
        .setMinValue(1)
    ),
  async execute(context, args = []) {
    const moderatorMember = context.member;

    // Staff permission check
    const hasPerm = checkPermission(moderatorMember, 'STAFF');
    if (!hasPerm && moderatorMember) {
      return context.reply({
        content: '❌ **Access Denied:** You must be an authorized staff member to view moderation histories.',
        ephemeral: true
      });
    }

    let targetUser = null;
    let page = 1;

    if (context.options?.getUser) {
      targetUser = context.options.getUser('user');
      page = context.options.getInteger('page') || 1;
    } else {
      if (!args[0]) {
        return context.reply({
          content: '❌ **Usage:** `-modhistory <@user|id> [page]`'
        });
      }

      const rawId = args[0].replace(/[<@!>]/g, '').trim();
      targetUser = { id: rawId, username: `User_${rawId.slice(0, 5)}` };

      if (args[1] && /^\d+$/.test(args[1])) {
        page = parseInt(args[1], 10);
      }
    }

    if (!targetUser || !targetUser.id) {
      return context.reply({
        content: '❌ Please specify a valid member mention or user ID.',
        ephemeral: true
      });
    }

    // Try resolving full user/member if possible
    if (context.guild?.members) {
      try {
        const m = context.guild.members.cache.get(targetUser.id) || (await context.guild.members.fetch(targetUser.id).catch(() => null));
        if (m?.user) targetUser = m.user;
      } catch (e) {
        // user outside guild
      }
    }

    const history = moderationService.getHistory(targetUser.id, page, 5);
    const payload = createModerationHistoryV2({
      target: targetUser,
      cases: history.cases,
      page: history.page,
      totalPages: history.totalPages,
      totalCases: history.totalCases
    });

    return context.reply(payload);
  }
};
