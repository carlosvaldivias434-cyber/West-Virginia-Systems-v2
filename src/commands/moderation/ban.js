import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import moderationService from '../../../WVRP/bot/services/moderationService.js';
import { checkPermission } from '../registryStore.js';

export default {
  name: 'ban',
  description: 'Ban a member or user ID from West Virginia State Roleplay with unique case tracking',
  category: 'Moderation',
  permission: 'STAFF',
  aliases: ['ban', 'banish'],
  usage: '-ban <@user|id> [days:0-7] <reason>',
  slashData: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Permanently ban a member or user ID from West Virginia State Roleplay')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Member or Discord user to ban')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Official reason for this ban')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('delete_messages')
        .setDescription('Number of days of message history to delete (0 to 7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)
    ),
  async execute(context, args = []) {
    const moderatorUser = context.user || context.author;
    const moderatorMember = context.member;
    const guild = context.guild;

    // Staff permission check
    const hasPerm = checkPermission(moderatorMember, 'STAFF') ||
      moderatorMember?.permissions?.has(PermissionFlagsBits.BanMembers) ||
      moderatorMember?.permissions?.has(PermissionFlagsBits.Administrator);

    if (!hasPerm && moderatorMember) {
      return context.reply({
        content: '❌ **Access Denied:** You do not have permission to execute bans in West Virginia State Roleplay.',
        ephemeral: true
      });
    }

    let targetUser = null;
    let targetMember = null;
    let reason = 'Breaking community rules';
    let deleteDays = 0;

    if (context.options?.getUser) {
      targetUser = context.options.getUser('user');
      reason = context.options.getString('reason') || reason;
      deleteDays = context.options.getInteger('delete_messages') || 0;
    } else {
      if (!args[0]) {
        return context.reply({
          content: '❌ **Usage:** `-ban <@user|id> [days:0-7] <reason>`'
        });
      }

      const rawId = args[0].replace(/[<@!>]/g, '').trim();
      targetUser = { id: rawId, username: `User_${rawId.slice(0, 5)}` };

      let nextIndex = 1;
      if (args[1] && /^[0-7]$/.test(args[1])) {
        deleteDays = parseInt(args[1], 10);
        nextIndex = 2;
      }

      if (args.length >= nextIndex + 1) {
        reason = args.slice(nextIndex).join(' ');
      }
    }

    if (!targetUser || !targetUser.id) {
      return context.reply({
        content: '❌ Invalid user specified. Please provide a valid user mention or Discord user ID.',
        ephemeral: true
      });
    }

    // Try resolving target member from guild cache if present
    if (guild?.members) {
      try {
        targetMember = guild.members.cache.get(targetUser.id) || (await guild.members.fetch(targetUser.id).catch(() => null));
        if (targetMember?.user) {
          targetUser = targetMember.user;
        }
      } catch (e) {
        // user might not be in guild (ban by ID)
      }
    }

    // Defer reply if interaction to prevent timeout
    if (context.deferReply && typeof context.deferReply === 'function') {
      await context.deferReply();
    }

    const result = await moderationService.executeBan({
      guild,
      targetUser,
      targetMember,
      moderatorUser,
      moderatorMember,
      reason,
      deleteDays,
      client: context.client || guild?.client
    });

    if (!result.success) {
      if (context.editReply && typeof context.editReply === 'function') {
        return context.editReply({ content: `❌ ${result.error}` });
      }
      return context.reply({ content: `❌ ${result.error}` });
    }

    if (context.editReply && typeof context.editReply === 'function') {
      return context.editReply(result.payload);
    }
    return context.reply(result.payload);
  }
};
