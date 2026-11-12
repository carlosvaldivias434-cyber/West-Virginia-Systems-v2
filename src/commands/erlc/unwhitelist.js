import db from '../../../WVRP/bot/database/index.js';
import erlcService from '../../../WVRP/bot/services/erlcService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'unwhitelist',
  description: 'Remove a player from ER:LC in-game server access or livery whitelist',
  category: 'ER:LC',
  permission: 'HIGH_RANK',
  aliases: ['unwhitelist', 'unwl'],
  usage: '-unwhitelist <@user|roblox_username>',
  slashData: new SlashCommandBuilder()
    .setName('unwhitelist')
    .setDescription('Remove a player from ER:LC whitelist')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: args[0].replace(/[<@!>]/g, '') } : null);
    if (!target) return context.reply({ content: '❌ Please specify a user to unwhitelist. Usage: `-unwhitelist <@user>`' });

    const staff = context.author || context.user;
    db.prepare('DELETE FROM livery_whitelist WHERE user_id = ?').run(target.id);

    if (erlcService.isConfigured()) {
      await erlcService.runCommand(`:unwhitelist ${target.username}`);
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: '❌ ER:LC Whitelist Removed',
      description: `**Player:** <@${target.id}>\n**Removed By:** <@${staff.id}>\n**In-Game Status:** Whitelist revoked.\n**Timestamp:** <t:${Math.floor(Date.now() / 1000)}:R>`,
      footerText: 'West Virginia State Roleplay · ER:LC Whitelist System'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
