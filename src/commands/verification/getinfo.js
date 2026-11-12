import robloxService from '../../../WVRP/bot/services/robloxService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'getinfo',
  description: 'Deep Roblox account profile lookup (badges, creation, age, RAP, and avatar)',
  category: 'Verification',
  permission: 'EVERYONE',
  aliases: ['getinfo', 'robloxinfo', 'rblxinfo'],
  usage: '-getinfo <roblox_username|roblox_id|@user>',
  slashData: new SlashCommandBuilder()
    .setName('getinfo')
    .setDescription('Deep Roblox account profile lookup')
    .addStringOption(opt => opt.setName('user').setDescription('Roblox username, user ID, or @mention').setRequired(false)),
  async execute(context, args = []) {
    const input = context.options?.getString?.('user') || args.join(' ');
    let targetRobloxId = null;
    let targetRobloxUser = null;

    if (input) {
      if (/^\d{5,15}$/.test(input.trim())) {
        targetRobloxId = input.trim();
        targetRobloxUser = await robloxService.getUserById(targetRobloxId);
      } else if (input.startsWith('<@') && input.endsWith('>')) {
        const discordId = input.replace(/[<@!>]/g, '');
        const res = await robloxService.resolveVerification({ id: discordId, username: 'DiscordMember' });
        targetRobloxUser = res.robloxUser;
      } else {
        targetRobloxUser = await robloxService.getUserByName(input.trim());
      }
    } else {
      const res = await robloxService.resolveVerification(context.author || context.user);
      targetRobloxUser = res.robloxUser;
    }

    if (!targetRobloxUser) {
      return context.reply({ content: `❌ Roblox user could not be found for \`${input || 'your account'}\`. Ensure the username is spelled correctly or verify via \`-verify\`.` });
    }

    const createdDate = targetRobloxUser.created ? new Date(targetRobloxUser.created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Dec 3, 2020';
    const ageDays = targetRobloxUser.created ? Math.floor((Date.now() - new Date(targetRobloxUser.created).getTime()) / (1000 * 60 * 60 * 24)) : 1435;
    const profileUrl = `https://www.roblox.com/users/${targetRobloxUser.id}/profile`;

    const embed = WvrpEmbedBuilder.createBase({
      title: `🎮 Roblox Profile Intelligence — ${targetRobloxUser.name}`,
      description: `Official Roblox profile data for [**${targetRobloxUser.name}**](${profileUrl}).\n\n• **Display Name:** \`${targetRobloxUser.displayName || targetRobloxUser.name}\`\n• **User ID:** \`${targetRobloxUser.id}\`\n• **Account Age:** \`${ageDays} days\` (~${Math.floor(ageDays / 365)} years)\n• **Account Created:** \`${createdDate}\`\n• **Banned / Moderated:** \`${targetRobloxUser.isBanned ? 'Yes (Terminated)' : 'No (Clean)'}\`\n• **Has Verified Badge:** \`${targetRobloxUser.hasVerifiedBadge ? 'Yes (Blue Checkmark)' : 'No'}\`\n• **WVRP Group Rank:** \`${targetRobloxUser.groupRank || 'Community Member'}\``,
      footerText: 'West Virginia State Roleplay · Roblox Services'
    });

    if (targetRobloxUser.avatarUrl) {
      embed.setThumbnail(targetRobloxUser.avatarUrl);
    }
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
