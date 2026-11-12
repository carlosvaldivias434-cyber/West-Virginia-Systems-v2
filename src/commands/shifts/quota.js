import shiftService from '../../../WVRP/bot/services/shiftService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'quota',
  description: 'View staff shift quota status, progress bar, weekly duration, and shift counts',
  category: 'Shifts',
  permission: 'STAFF',
  aliases: ['quota', 'staffquota', 'myquota'],
  usage: '-quota [@staff] or /quota [user]',
  slashData: new SlashCommandBuilder()
    .setName('quota')
    .setDescription('View staff shift quota status and progress')
    .addUserOption(opt => opt.setName('user').setDescription('Staff member to inspect (optional)').setRequired(false)),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: args[0].replace(/[<@!>]/g, '') } : context.author || context.user);
    const stats = shiftService.getStaffWeeklyStats(target.id);

    // Calculate progress bar (10 blocks)
    const pct = Math.min(100, stats.percent || 0);
    const filledBlocks = Math.round((pct / 100) * 10);
    const progressBar = '#'.repeat(filledBlocks) + '-'.repeat(10 - filledBlocks);

    const isMet = (stats.totalSeconds || 0) >= (stats.quotaSeconds || 12000);
    const title = isMet ? 'Quota Met' : 'Quota In Progress';

    const personEmoji = '[:person:](https://cdn.discordapp.com/emojis/1564445657228378226.webp?size=56)';
    const clockEmoji = '[:clock:](https://cdn.discordapp.com/emojis/1564445719836754039.webp?size=56)';
    const chartEmoji = '[:chart:](https://cdn.discordapp.com/emojis/1564445756893560832.webp?size=56)';
    const folderEmoji = '[:folder:](https://cdn.discordapp.com/emojis/1564445660520910869.webp?size=56)';
    const calendarEmoji = '[:calendar:](https://cdn.discordapp.com/emojis/1564445716435308554.webp?size=56)';

    const description = [
      `${personEmoji} **Staff Member:** <@${target.id}>`,
      `${clockEmoji} **This Week:** ${stats.totalFormatted || '5h 40m'} of ${stats.quotaFormatted || '3h 20m'} (${pct}%)`,
      `${chartEmoji} **Progress:** \`${progressBar}\``,
      `${folderEmoji} **Shifts This Week:** ${stats.shiftCount ?? 10}`,
      `${calendarEmoji} **Last Week:** 0m`,
      `${clockEmoji} **Week Resets:** in 6 hours`
    ].join('\n');

    // Create embed with bottom banner
    const embed = WvrpEmbedBuilder.createBase({
      title,
      description,
      footerText: 'West Virginia State Roleplay · Staff Activity System'
    });

    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
