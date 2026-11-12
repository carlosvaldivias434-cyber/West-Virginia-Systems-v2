import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'chart',
  description: 'View the West Virginia State financial market charts & commodity trends',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['chart', 'stocks', 'marketindex'],
  usage: '-chart [wvrp|coal|timber|energy] or /chart [symbol]',
  slashData: new SlashCommandBuilder()
    .setName('chart')
    .setDescription('View WVRP financial market & commodity charts')
    .addStringOption(opt =>
      opt.setName('symbol')
        .setDescription('Market symbol')
        .setRequired(false)
        .addChoices(
          { name: 'WVRP Composite Index (WVRP-500)', value: 'wvrp' },
          { name: 'Appalachian Coal Index (COAL)', value: 'coal' },
          { name: 'Kanawha Timber & Lumber (TIMB)', value: 'timber' },
          { name: 'Allegheny Energy & Power (ENGY)', value: 'energy' }
        )
    ),
  async execute(context, args = []) {
    let symbol = 'wvrp';
    if (context.options?.getString) {
      symbol = context.options.getString('symbol') || 'wvrp';
    } else if (args[0]) {
      symbol = args[0].toLowerCase();
    }

    const markets = {
      wvrp: {
        name: 'WVRP Composite Index (WVRP-500)',
        price: '4,892.40',
        change: '+1.84%',
        high: '4,910.15',
        low: '4,840.20',
        trend: 'BULLISH 📈',
        chart: [
          '4920 ┤          ╭╮',
          '4900 ┤     ╭╮  ╭╯╰╮',
          '4880 ┤  ╭──╯╰──╯  ╰─',
          '4860 ┼──╯           ',
          '4840 ┴──────────────'
        ].join('\n')
      },
      coal: {
        name: 'Appalachian Coal Commodities (COAL)',
        price: '142.80',
        change: '+4.12%',
        high: '145.00',
        low: '138.50',
        trend: 'VERY STRONG 🚀',
        chart: [
          '146 ┤            ╭──',
          '144 ┤      ╭╮   ╭╯  ',
          '142 ┤  ╭───╯╰───╯   ',
          '140 ┼──╯            ',
          '138 ┴───────────────'
        ].join('\n')
      },
      timber: {
        name: 'Kanawha Timber & Lumber (TIMB)',
        price: '88.15',
        change: '-0.65%',
        high: '89.40',
        low: '87.90',
        trend: 'CONSOLIDATION ⚖️',
        chart: [
          ' 90 ┤   ╭╮          ',
          ' 89 ┤  ╭╯╰──╮   ╭───',
          ' 88 ┼──╯    ╰───╯   ',
          ' 87 ┴───────────────'
        ].join('\n')
      },
      energy: {
        name: 'Allegheny Energy & Power (ENGY)',
        price: '310.50',
        change: '+2.45%',
        high: '312.00',
        low: '304.10',
        trend: 'STEADY UPTREND ⚡',
        chart: [
          '312 ┤           ╭───',
          '310 ┤     ╭──╮ ╭╯   ',
          '308 ┤  ╭──╯  ╰─╯    ',
          '306 ┼──╯            ',
          '304 ┴───────────────'
        ].join('\n')
      }
    };

    const target = markets[symbol] || markets.wvrp;

    const desc = [
      `### ${target.name}`,
      `• **Current Value:** \`$${target.price}\` (${target.change})`,
      `• **Day Range:** \`$${target.low}\` — \`$${target.high}\``,
      `• **Market Sentiment:** ${target.trend}`,
      '',
      '**7-Day Performance Candlestick Trend:**',
      '```',
      target.chart,
      '```',
      '*Values update synchronously with state economic cycles and ER:LC shifts.*'
    ].join('\n');

    const embed = WvrpEmbedBuilder.createBase({
      title: '📈 West Virginia State Financial Exchange (WVSX)',
      description: desc,
      footerText: 'West Virginia Department of Commerce · Market Watch'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
