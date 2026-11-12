import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'deposit',
  description: 'Deposit cash from your wallet into your Bank of West Virginia account',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['deposit', 'dep'],
  usage: '-deposit <amount|all>',
  slashData: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposit cash into your bank account')
    .addStringOption(opt => opt.setName('amount').setDescription('Amount to deposit or "all"').setRequired(true)),
  async execute(context, args = []) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const input = context.options?.getString?.('amount') || args[0] || 'all';
    let amount = 0;
    if (input.toLowerCase() === 'all' || input.toLowerCase() === 'max') {
      amount = acc.wallet;
    } else {
      amount = parseInt(input.replace(/[$,]/g, ''), 10);
    }

    if (isNaN(amount) || amount <= 0) {
      return context.reply({ content: '❌ Please provide a valid positive amount to deposit.' });
    }

    if (acc.wallet < amount) {
      return context.reply({ content: `❌ You do not have enough cash in your wallet! Wallet balance: **$${acc.wallet.toLocaleString()}**` });
    }

    db.transaction(() => {
      db.prepare('UPDATE economy SET wallet = wallet - ?, bank = bank + ? WHERE user_id = ?').run(amount, amount, userId);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'DEPOSIT', amount, 'Wallet to Bank Deposit', Date.now());
    })();

    const newWallet = acc.wallet - amount;
    const newBank = acc.bank + amount;

    return context.reply({
      content: `🏦 **Deposit Successful!** Deposited **$${amount.toLocaleString()}** into your bank.\n> 💵 **Wallet:** $${newWallet.toLocaleString()} | 🏦 **Bank:** $${newBank.toLocaleString()}`
    });
  }
};
