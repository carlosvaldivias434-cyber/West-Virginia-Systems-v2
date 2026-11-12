import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'botunbl',
  description: 'Unblacklist a member to restore their access to WVRP Bot commands',
  category: 'Administration',
  permission: 'HIGH_RANK',
  aliases: ['botunbl', 'bunblacklist', 'botunblacklist'],
  usage: '-botunbl <@user>',
  slashData: new SlashCommandBuilder()
    .setName('botunbl')
    .setDescription('Restore bot command access for a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to unblacklist').setRequired(true)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Member' } : null);
    if (!target) return context.reply({ content: '❌ Please specify a user to bot unblacklist.' });

    const staff = context.author || context.user;
    db.prepare("DELETE FROM blacklists WHERE user_id = ? AND type = 'BOT'").run(target.id);

    const embed = WvrpEmbedBuilder.createBase({
      title: '✅ Bot Access Restored',
      description: `**User:** <@${target.id}>\n**Restored By:** <@${staff.id}>\n**Status:** Member command privileges have been fully reinstated.`,
      footerText: 'West Virginia State Roleplay · Bot Security'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
