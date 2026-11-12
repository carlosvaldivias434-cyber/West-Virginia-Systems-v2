import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'slots',
  description: 'Spin the West Virginia Casino 3-reel slot machine',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['slots', 'slot'],
  usage: '-slots <amount>',
  slashData: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Spin the 3-reel slot machine')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true)),
  async execute(context, args = []) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const amount = context.options?.getInteger?.('amount') || parseInt(args[0] || '100', 10);
    if (amount <= 0 || isNaN(amount)) return context.reply({ content: '❌ Please bet a valid amount greater than $0.' });
    if (acc.wallet < amount) return context.reply({ content: `❌ Insufficient wallet balance! Wallet: **$${acc.wallet.toLocaleString()}**` });

    const reels = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔'];
    const r1 = reels[Math.floor(Math.random() * reels.length)];
    const r2 = reels[Math.floor(Math.random() * reels.length)];
    const r3 = reels[Math.floor(Math.random() * reels.length)];

    let multiplier = 0;
    if (r1 === '7️⃣' && r2 === '7️⃣' && r3 === '7️⃣') {
      multiplier = 10;
    } else if (r1 === '💎' && r2 === '💎' && r3 === '💎') {
      multiplier = 7;
    } else if (r1 === r2 && r2 === r3) {
      multiplier = 4;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      multiplier = 1.5;
    }

    const isWin = multiplier > 0;
    const payout = Math.floor(amount * multiplier);

    db.transaction(() => {
      if (isWin) {
        const netGain = payout - amount;
        db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(netGain, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'SLOTS_WIN', netGain, `Slots multiplier ${multiplier}x`, Date.now());
      } else {
        db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(amount, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'SLOTS_LOSS', amount, 'Slots lost', Date.now());
      }
    })();

    const display = `[ ${r1} | ${r2} | ${r3} ]`;
    if (isWin) {
      return context.reply({
        content: `🎰 **SLOT MACHINE**\n> ${display}\n🎉 **WINNER!** Multiplier: **${multiplier}x** | Payout: **+$${payout.toLocaleString()}**!`
      });
    } else {
      return context.reply({
        content: `🎰 **SLOT MACHINE**\n> ${display}\n💀 **No Match.** Lost **-$${amount.toLocaleString()}**. Better luck next spin!`
      });
    }
  }
};
