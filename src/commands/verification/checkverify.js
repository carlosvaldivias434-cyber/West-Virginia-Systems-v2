import robloxService from '../../../WVRP/bot/services/robloxService.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'checkverify',
  description: "Lookup a member's linked Roblox profile and Bloxlink status",
  category: 'Verification',
  permission: 'EVERYONE',
  aliases: ['checkroblox', 'whoisroblox'],
  usage: '-checkverify [@user] or /checkverify [user]',
  slashData: new SlashCommandBuilder()
    .setName('checkverify')
    .setDescription("Lookup a member's linked Roblox profile")
    .addUserOption(opt => opt.setName('user').setDescription('Target member to check').setRequired(false)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Target' } : context.author || context.user);
    const res = await robloxService.resolveVerification(target);

    const embeds = WvrpEmbedBuilder.createVerificationEmbed({
      userMention: `<@${target.id}>`,
      username: target.tag || target.username,
      userId: target.id,
      robloxUser: res.robloxUser,
      bloxlinkStatus: res.bloxlinkStatus,
      verified: res.verified,
      isStaffReview: true
    });

    return context.reply({ embeds });
  }
};
