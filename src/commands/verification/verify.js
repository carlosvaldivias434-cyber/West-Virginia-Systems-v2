import robloxService from '../../../WVRP/bot/services/robloxService.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from 'discord.js';

export default {
  name: 'verify',
  description: 'Verify your Roblox account with West Virginia State Roleplay via Bloxlink',
  category: 'Verification',
  permission: 'EVERYONE',
  aliases: ['bloxlink', 'linkroblox'],
  usage: '-verify [@user] or /verify [user]',
  slashData: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your Roblox account via Bloxlink')
    .addUserOption(opt => opt.setName('user').setDescription('Target member to verify (Staff only)').setRequired(false)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Target' } : context.author || context.user);
    const staff = context.author || context.user;

    const res = await robloxService.resolveVerification(target, staff);
    const embeds = WvrpEmbedBuilder.createVerificationEmbed({
      userMention: `<@${target.id}>`,
      username: target.tag || target.username,
      userId: target.id,
      robloxUser: res.robloxUser,
      bloxlinkStatus: res.bloxlinkStatus,
      verified: res.verified
    });

    const row = new ActionRowBuilder();
    if (!res.verified) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('Verify on Bloxlink')
          .setStyle(ButtonStyle.Link)
          .setURL(process.env.WELCOME_VERIFY_URL || 'https://blox.link/verify'),
        new ButtonBuilder()
          .setCustomId('verify_check_btn')
          .setLabel('Check Verification')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('verify_help_btn')
          .setLabel('Need Help?')
          .setEmoji('❓')
          .setStyle(ButtonStyle.Secondary)
      );
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('verify_check_btn')
          .setLabel('Re-check Status')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    return context.reply({
      content: res.verified ? `✅ **Roblox Account Verified for <@${target.id}>**` : `⚠️ **Verification Incomplete for <@${target.id}>**`,
      embeds,
      components: [row]
    });
  }
};
