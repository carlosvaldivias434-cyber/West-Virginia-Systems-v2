import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'roulette',
  description: 'Bet on the West Virginia Casino roulette wheel (Red, Black, or Number 0-36)',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['roulette', 'roul'],
  usage: '-roulette <red|black|green|0-36> <amount>',
  slashData: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('Bet on the roulette wheel')
    .addStringOption(opt => opt.setName('bet').setDescription('Choice (red, black, green, or 0-36)').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true)),
  async execute(context, args = []) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const betChoice = (context.options?.getString?.('bet') || args[0] || 'red').toLowerCase();
    const amount = context.options?.getInteger?.('amount') || parseInt(args[1] || '100', 10);

    if (amount <= 0 || isNaN(amount)) return context.reply({ content: '❌ Please enter a valid bet amount.' });
    if (acc.wallet < amount) return context.reply({ content: `❌ Insufficient wallet funds! Wallet: **$${acc.wallet.toLocaleString()}**` });

    const spunNumber = Math.floor(Math.random() * 37); // 0-36
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    let spunColor = 'black';
    if (spunNumber === 0) spunColor = 'green';
    else if (redNumbers.includes(spunNumber)) spunColor = 'red';

    let isWin = false;
    let multiplier = 0;

    if (betChoice === 'red' && spunColor === 'red') {
      isWin = true;
      multiplier = 2;
    } else if (betChoice === 'black' && spunColor === 'black') {
      isWin = true;
      multiplier = 2;
    } else if (betChoice === 'green' && spunColor === 'green') {
      isWin = true;
      multiplier = 14;
    } else if (parseInt(betChoice, 10) === spunNumber) {
      isWin = true;
      multiplier = 36;
    }

    const colorEmoji = spunColor === 'red' ? '🔴' : spunColor === 'black' ? '⚫' : '🟢';

    db.transaction(() => {
      if (isWin) {
        const netProfit = (amount * multiplier) - amount;
        db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(netProfit, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'ROULETTE_WIN', netProfit, `Roulette won on ${betChoice}`, Date.now());
      } else {
        db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(amount, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'ROULETTE_LOSS', amount, `Roulette lost on ${betChoice}`, Date.now());
      }
    })();

    if (isWin) {
      return context.reply({
        content: `🎡 **ROULETTE WHEEL SPUN**\n> The ball landed on: ${colorEmoji} **${spunNumber} (${spunColor.toUpperCase()})**!\n🎉 **YOU WON!** Multiplier: **${multiplier}x** | Payout: **+$${(amount * multiplier).toLocaleString()}**`
      });
    } else {
      return context.reply({
        content: `🎡 **ROULETTE WHEEL SPUN**\n> The ball landed on: ${colorEmoji} **${spunNumber} (${spunColor.toUpperCase()})**!\n💀 **You Lost!** Lost **-$${amount.toLocaleString()}** on ${betChoice.toUpperCase()}.`
      });
    }
  }
};
