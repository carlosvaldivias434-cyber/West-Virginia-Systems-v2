import { SlashCommandBuilder } from 'discord.js';
import moderationService from '../../../WVRP/bot/services/moderationService.js';
import { createModerationStatsV2 } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { checkPermission } from '../registryStore.js';

export default {
  name: 'modstats',
  description: 'Display real-time moderation system statistics and breakdown by action',
  category: 'Moderation',
  permission: 'STAFF',
  aliases: ['modstats', 'modstat', 'punishstats'],
  usage: '-modstats [filter: all/ban/kick/mute] [@user]',
  slashData: new SlashCommandBuilder()
    .setName('modstats')
    .setDescription('Display real-time moderation statistics')
    .addStringOption(opt =>
      opt.setName('filter')
        .setDescription('Filter stats by action type')
        .setRequired(false)
        .addChoices(
          { name: 'All Actions', value: 'ALL' },
          { name: 'Bans Only', value: 'BAN' },
          { name: 'Kicks Only', value: 'KICK' },
          { name: 'Mutes Only', value: 'MUTE' },
          { name: 'Unmutes Only', value: 'UNMUTE' }
        )
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Filter actions issued by or against a specific member')
        .setRequired(false)
    ),
  async execute(context, args = []) {
    const moderatorMember = context.member;

    // Staff permission check
    const hasPerm = checkPermission(moderatorMember, 'STAFF');
    if (!hasPerm && moderatorMember) {
      return context.reply({
        content: '❌ **Access Denied:** You must be an authorized staff member to inspect moderation statistics.',
        ephemeral: true
      });
    }

    let filter = 'ALL';
    let targetUser = null;

    if (context.options?.getString) {
      filter = context.options.getString('filter') || 'ALL';
      targetUser = context.options.getUser('user') || null;
    } else {
      if (args[0]) {
        const raw = args[0].toUpperCase();
        if (['ALL', 'BAN', 'KICK', 'MUTE', 'UNMUTE'].includes(raw)) {
          filter = raw;
        } else if (args[0].startsWith('<@') || /^\d+$/.test(args[0])) {
          const rawId = args[0].replace(/[<@!>]/g, '');
          targetUser = { id: rawId, username: `Member_${rawId.slice(0, 5)}` };
          filter = 'MODERATOR';
        }
      }

      if (args[1] && !targetUser && (args[1].startsWith('<@') || /^\d+$/.test(args[1]))) {
        const rawId = args[1].replace(/[<@!>]/g, '');
        targetUser = { id: rawId, username: `Member_${rawId.slice(0, 5)}` };
      }
    }

    const stats = moderationService.getStats(filter, targetUser?.id);
    const payload = createModerationStatsV2({
      stats,
      filter,
      targetUser
    });

    return context.reply(payload);
  }
};
