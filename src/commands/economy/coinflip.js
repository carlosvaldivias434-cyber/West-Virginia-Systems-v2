import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'coinflip',
  description: 'Flip a coin and bet on Heads or Tails for a 2x payout',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['coinflip', 'cf', 'flip'],
  usage: '-coinflip <heads|tails> <amount>',
  slashData: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Bet on a coin flip')
    .addStringOption(opt =>
      opt.setName('side')
        .setDescription('Heads or Tails')
        .setRequired(true)
        .addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })
    )
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true)),
  async execute(context, args = []) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const side = (context.options?.getString?.('side') || args[0] || 'heads').toLowerCase();
    const amount = context.options?.getInteger?.('amount') || parseInt(args[1] || '100', 10);

    if (amount <= 0 || isNaN(amount)) return context.reply({ content: '❌ Please bet a valid amount greater than $0.' });
    if (acc.wallet < amount) return context.reply({ content: `❌ You do not have enough cash in your wallet! Wallet balance: **$${acc.wallet.toLocaleString()}**` });

    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin = outcome === side;

    db.transaction(() => {
      if (isWin) {
        db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(amount, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'COINFLIP_WIN', amount, `Won coinflip on ${side}`, Date.now());
      } else {
        db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(amount, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'COINFLIP_LOSS', amount, `Lost coinflip on ${side}`, Date.now());
      }
    })();

    const icon = outcome === 'heads' ? '🪙 **[HEADS]**' : '🪙 **[TAILS]**';
    if (isWin) {
      return context.reply({ content: `${icon} The coin landed on **${outcome.toUpperCase()}**!\n🎉 **You Won!** Payout: **+$${(amount * 2).toLocaleString()}** (Net profit: **+$${amount.toLocaleString()}**)` });
    } else {
      return context.reply({ content: `${icon} The coin landed on **${outcome.toUpperCase()}**!\n💀 **You Lost!** Lost **-$${amount.toLocaleString()}**.` });
    }
  }
};
