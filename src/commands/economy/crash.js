import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'crash',
  description: 'Play the Crash multiplier game',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['crash', 'rocket'],
  usage: '-crash <bet> [target_multiplier] or /crash bet:<amount> auto_cashout:<1.1-100>',
  slashData: new SlashCommandBuilder()
    .setName('crash')
    .setDescription('Bet on the crash multiplier rocket')
    .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true))
    .addNumberOption(opt => opt.setName('multiplier').setDescription('Auto cashout multiplier (e.g. 1.5, 2.0)').setRequired(false)),
  async execute(context, args = []) {
    const user = context.user || context.author;
    let bet = 0;
    let target = 2.0;

    if (context.options?.getInteger) {
      bet = context.options.getInteger('bet');
      target = context.options.getNumber('multiplier') || 2.0;
    } else {
      bet = parseInt(args[0], 10);
      if (args[1]) target = parseFloat(args[1]);
    }

    if (!bet || isNaN(bet) || bet <= 0) {
      return context.reply({ content: '❌ Please specify a valid bet amount: `-crash <bet> [target_multiplier]`' });
    }

    if (isNaN(target) || target < 1.05 || target > 50.0) {
      return context.reply({ content: '❌ Target multiplier must be between `1.05` and `50.0`.' });
    }

    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(user.id);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(user.id);
      acc = { wallet: 1000, bank: 5000 };
    }

    if (acc.wallet < bet) {
      return context.reply({ content: `❌ Insufficient wallet balance! You have **$${acc.wallet.toLocaleString()}** in cash.` });
    }

    // Generate crash point using heavy-tailed distribution (95% RTP)
    const r = Math.random();
    let crashPoint = 1.0;
    if (r > 0.05) {
      crashPoint = Math.max(1.0, parseFloat((0.95 / (1.0 - r)).toFixed(2)));
    } else {
      crashPoint = 1.0; // Instant crash at 1.0x
    }

    const won = target <= crashPoint;
    let profit = 0;
    let newWallet = acc.wallet;

    if (won) {
      profit = Math.floor(bet * (target - 1.0));
      newWallet += profit;
      db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(profit, user.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(user.id, 'CRASH_WIN', profit, `Cashed out at ${target.toFixed(2)}x (Crashed at ${crashPoint.toFixed(2)}x)`, Date.now());
    } else {
      newWallet -= bet;
      db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(bet, user.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(user.id, 'CRASH_LOSS', bet, `Targeted ${target.toFixed(2)}x (Crashed at ${crashPoint.toFixed(2)}x)`, Date.now());
    }

    const title = won ? `🚀 Rocket Escaped · Cashed Out at ${target.toFixed(2)}x!` : `💥 Rocket Crashed at ${crashPoint.toFixed(2)}x!`;
    const desc = [
      `💰 **Bet Amount:** $${bet.toLocaleString()}`,
      `🎯 **Auto Cashout Target:** ${target.toFixed(2)}x`,
      `💥 **Final Crash Point:** ${crashPoint.toFixed(2)}x`,
      '',
      won
        ? `✅ **Successful Cashout!** You walked away with **$${(bet + profit).toLocaleString()}** (Profit: **+$${profit.toLocaleString()}**)`
        : `❌ **Crashed!** The rocket exploded before reaching your target of ${target.toFixed(2)}x. Lost **-$${bet.toLocaleString()}**.`,
      '',
      `💵 **Current Wallet:** $${newWallet.toLocaleString()}`
    ].join('\n');

    const embed = WvrpEmbedBuilder.createBase({
      title,
      description: desc,
      footerText: 'West Virginia Casino · Rocket Crash'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
