import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import moderationService from '../../../WVRP/bot/services/moderationService.js';
import { checkPermission } from '../registryStore.js';

export default {
  name: 'unmute',
  description: 'Remove timeout (unmute) for a member with unique case tracking',
  category: 'Moderation',
  permission: 'STAFF',
  aliases: ['unmute', 'untimeout'],
  usage: '-unmute <@user|id> [reason]',
  slashData: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout (unmute) for a member in West Virginia State Roleplay')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('member')
        .setDescription('Server member to unmute')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Official reason for removing this timeout')
        .setRequired(false)
    ),
  async execute(context, args = []) {
    const moderatorUser = context.user || context.author;
    const moderatorMember = context.member;
    const guild = context.guild;

    // Staff permission check
    const hasPerm = checkPermission(moderatorMember, 'STAFF') ||
      moderatorMember?.permissions?.has(PermissionFlagsBits.ModerateMembers) ||
      moderatorMember?.permissions?.has(PermissionFlagsBits.Administrator);

    if (!hasPerm && moderatorMember) {
      return context.reply({
        content: '❌ **Access Denied:** You do not have permission to remove timeouts in West Virginia State Roleplay.',
        ephemeral: true
      });
    }

    let targetUser = null;
    let targetMember = null;
    let reason = 'Mute lifted by moderator';

    if (context.options?.getUser) {
      targetUser = context.options.getUser('member');
      reason = context.options.getString('reason') || reason;
    } else {
      if (!args[0]) {
        return context.reply({
          content: '❌ **Usage:** `-unmute <@user|id> [reason]`'
        });
      }

      const rawId = args[0].replace(/[<@!>]/g, '').trim();
      targetUser = { id: rawId, username: `Member_${rawId.slice(0, 5)}` };

      if (args.length >= 2) {
        reason = args.slice(1).join(' ');
      }
    }

    if (!targetUser || !targetUser.id) {
      return context.reply({
        content: '❌ Invalid member specified. Please provide a member mention or Discord user ID.',
        ephemeral: true
      });
    }

    // Resolve member from guild
    if (guild?.members) {
      try {
        targetMember = guild.members.cache.get(targetUser.id) || (await guild.members.fetch(targetUser.id).catch(() => null));
        if (targetMember?.user) {
          targetUser = targetMember.user;
        }
      } catch (e) {
        // member fetch error
      }
    }

    if (!targetMember) {
      return context.reply({
        content: `❌ Member <@${targetUser.id}> is not currently in this server.`,
        ephemeral: true
      });
    }

    // Defer reply if interaction
    if (context.deferReply && typeof context.deferReply === 'function') {
      await context.deferReply();
    }

    const result = await moderationService.executeUnmute({
      guild,
      targetUser,
      targetMember,
      moderatorUser,
      moderatorMember,
      reason,
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
