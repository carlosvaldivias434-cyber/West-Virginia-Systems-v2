import { SlashCommandBuilder } from 'discord.js';
import loaService from '../../../WVRP/bot/services/loaService.js';
import robloxService from '../../../WVRP/bot/services/robloxService.js';

export default {
  name: 'loa',
  description: 'Submit a Staff Leave of Absence (LOA) request (#0001 format)',
  category: 'Staff',
  permission: 'STAFF',
  aliases: ['loa', 'leave'],
  usage: '-loa <from_date> <until_date> <days> <reason>',
  slashData: new SlashCommandBuilder()
    .setName('loa')
    .setDescription('Submit a Staff Leave of Absence request')
    .addStringOption(opt =>
      opt.setName('from_date')
        .setDescription('Leave start date (e.g. Nov 12, 2026)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('until_date')
        .setDescription('Leave return date (e.g. Nov 19, 2026)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('days')
        .setDescription('Total number of leave days')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for Leave of Absence')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('roblox_username')
        .setDescription('Your Roblox username if not linked')
        .setRequired(false)
    ),

  async execute(context, args = []) {
    const user = context.user || context.author;
    const member = context.member;
    const guild = context.guild;

    let fromDate = '';
    let untilDate = '';
    let days = 5;
    let reason = '';
    let robloxUsername = null;

    if (context.options?.getString) {
      fromDate = context.options.getString('from_date');
      untilDate = context.options.getString('until_date');
      days = context.options.getInteger('days') || 5;
      reason = context.options.getString('reason');
      robloxUsername = context.options.getString('roblox_username');
    } else {
      // Prefix args: -loa <fromDate> <untilDate> <days> <reason...>
      if (args.length < 4) {
        return context.reply({
          content: '❌ **Usage:** `-loa <from_date> <until_date> <days> <reason>`\n*Example:* `-loa 11/12/2026 11/19/2026 7 College exam preparation`'
        });
      }
      fromDate = args[0];
      untilDate = args[1];
      days = parseInt(args[2], 10) || 5;
      reason = args.slice(3).join(' ');
    }

    if (!robloxUsername) {
      const robloxInfo = await robloxService.getRobloxUser(user.id);
      robloxUsername = robloxInfo?.username || 'Not Linked';
    }

    const res = await loaService.submitRequest({
      user,
      member,
      robloxUsername,
      fromDate,
      untilDate,
      days,
      reason,
      requestedFrom: 'Discord Bot',
      guild
    });

    if (!res.success) {
      return context.reply({ content: `❌ ${res.error}` });
    }

    return context.reply({
      content: `✅ **Leave of Absence Submitted (LOA-${res.requestNumber})**\nYour request has been logged and forwarded to Staff Leadership for review with automated quota exemption upon approval.`
    });
  }
};
