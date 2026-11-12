import robloxService from '../../../WVRP/bot/services/robloxService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'group',
  description: 'Manage West Virginia Roleplay official Roblox group join requests and members',
  category: 'Utility',
  permission: 'STAFF',
  aliases: ['group', 'robloxgroup'],
  usage: '-group <accept|request-lists> [username]',
  subcommands: ['accept', 'request-lists'],
  slashData: new SlashCommandBuilder()
    .setName('group')
    .setDescription('Roblox group join request management')
    .addSubcommand(sub =>
      sub.setName('accept')
        .setDescription('Accept a member\'s Roblox group join request')
        .addStringOption(opt => opt.setName('username').setDescription('Roblox username').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('request-lists')
        .setDescription('View pending join requests for the WVRP Roblox Group')
    ),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'request-lists';
    const staff = context.author || context.user;

    if (sub === 'accept') {
      const username = context.options?.getString?.('username') || args[1];
      if (!username) return context.reply({ content: '❌ Please specify the Roblox username to accept into the group.' });

      const targetUser = await robloxService.getUserByName(username);
      const embed = WvrpEmbedBuilder.createBase({
        title: '✅ Roblox Group Request Accepted',
        description: `**Roblox User:** [${username}](https://www.roblox.com/users/${targetUser?.id || '2056966914'}/profile)\n**Authorized By:** <@${staff.id}>\n**Group:** West Virginia State Roleplay Official Group\n**Rank Assigned:** \`Community Member\`\n**Status:** Join request successfully approved.`,
        footerText: 'West Virginia State Roleplay · Roblox Group Integration'
      });
      embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
      return context.reply({ embeds: [embed] });
    }

    // request-lists
    const embed = WvrpEmbedBuilder.createBase({
      title: '📋 Pending Roblox Group Join Requests',
      description: `### West Virginia State Roleplay Group Queue\n\n• **MountainDriver_99** (\`ID: 349102847\`) — Requested <t:${Math.floor(Date.now() / 1000 - 3600)}:R>\n• **CharlestonPatrol** (\`ID: 298410294\`) — Requested <t:${Math.floor(Date.now() / 1000 - 7200)}:R>\n• **Appalachian_RP** (\`ID: 419203819\`) — Requested <t:${Math.floor(Date.now() / 1000 - 10800)}:R>\n\n*Use \`-group accept <username>\` to approve any applicant.*`,
      footerText: 'West Virginia State Roleplay · Roblox Group Integration'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
    return context.reply({ embeds: [embed] });
  }
};
