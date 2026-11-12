import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'withdraw',
  description: 'Withdraw funds from your Bank of West Virginia account into your wallet',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['withdraw', 'with'],
  usage: '-withdraw <amount|all>',
  slashData: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw funds from your bank into wallet')
    .addStringOption(opt => opt.setName('amount').setDescription('Amount to withdraw or "all"').setRequired(true)),
  async execute(context, args = []) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const input = context.options?.getString?.('amount') || args[0] || '100';
    let amount = 0;
    if (input.toLowerCase() === 'all' || input.toLowerCase() === 'max') {
      amount = acc.bank;
    } else {
      amount = parseInt(input.replace(/[$,]/g, ''), 10);
    }

    if (isNaN(amount) || amount <= 0) {
      return context.reply({ content: '❌ Please provide a valid positive amount to withdraw.' });
    }

    if (acc.bank < amount) {
      return context.reply({ content: `❌ You do not have enough funds in your bank! Bank balance: **$${acc.bank.toLocaleString()}**` });
    }

    db.transaction(() => {
      db.prepare('UPDATE economy SET bank = bank - ?, wallet = wallet + ? WHERE user_id = ?').run(amount, amount, userId);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'WITHDRAW', amount, 'Bank to Wallet Withdrawal', Date.now());
    })();

    const newWallet = acc.wallet + amount;
    const newBank = acc.bank - amount;

    return context.reply({
      content: `💵 **Withdrawal Successful!** Withdrew **$${amount.toLocaleString()}** from your bank.\n> 💵 **Wallet:** $${newWallet.toLocaleString()} | 🏦 **Bank:** $${newBank.toLocaleString()}`
    });
  }
};
