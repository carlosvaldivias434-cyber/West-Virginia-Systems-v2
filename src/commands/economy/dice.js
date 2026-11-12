import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'dice',
  description: 'Roll a pair of 6-sided dice against the house for cash',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['dice', 'roll'],
  usage: '-dice <amount>',
  slashData: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll dice against the bot')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true)),
  async execute(context, args = []) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const amount = context.options?.getInteger?.('amount') || parseInt(args[0] || '100', 10);
    if (amount <= 0 || isNaN(amount)) return context.reply({ content: '❌ Please enter a valid bet amount.' });
    if (acc.wallet < amount) return context.reply({ content: `❌ Insufficient wallet cash! Wallet: **$${acc.wallet.toLocaleString()}**` });

    const p1 = Math.floor(Math.random() * 6) + 1;
    const p2 = Math.floor(Math.random() * 6) + 1;
    const playerTotal = p1 + p2;

    const b1 = Math.floor(Math.random() * 6) + 1;
    const b2 = Math.floor(Math.random() * 6) + 1;
    const botTotal = b1 + b2;

    let isWin = false;
    let isTie = false;

    if (playerTotal > botTotal) {
      isWin = true;
    } else if (playerTotal === botTotal) {
      isTie = true;
    }

    db.transaction(() => {
      if (isWin) {
        db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(amount, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'DICE_WIN', amount, 'Dice win', Date.now());
      } else if (!isTie) {
        db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(amount, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'DICE_LOSS', amount, 'Dice loss', Date.now());
      }
    })();

    const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return context.reply({
      content: `🎲 **DICE DUEL**\n> 👤 **Your Roll:** ${diceEmoji[p1 - 1]} + ${diceEmoji[p2 - 1]} = **${playerTotal}**\n> 🤖 **Bot Roll:** ${diceEmoji[b1 - 1]} + ${diceEmoji[b2 - 1]} = **${botTotal}**\n\n${isWin ? `🎉 **You won!** Payout: **+$${(amount * 2).toLocaleString()}**` : isTie ? '🤝 **Tie!** Bet refunded.' : `💀 **You lost!** -$${amount.toLocaleString()}`}`
    });
  }
};
