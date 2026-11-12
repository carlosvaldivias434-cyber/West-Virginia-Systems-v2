import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'pay',
  description: 'Transfer money from your wallet to another West Virginia citizen',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['pay', 'transfer', 'givemoney'],
  usage: '-pay <@user> <amount>',
  slashData: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfer money to another citizen')
    .addUserOption(opt => opt.setName('user').setDescription('Recipient').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount of money to send').setRequired(true)),
  async execute(context, args = []) {
    const senderId = (context.user || context.author).id;
    const recipient = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Citizen' } : null);
    const amount = context.options?.getInteger?.('amount') || parseInt(args[1] || '0', 10);

    if (!recipient || recipient.id === senderId) {
      return context.reply({ content: '❌ Please specify another valid user to send money to.' });
    }

    if (isNaN(amount) || amount <= 0) {
      return context.reply({ content: '❌ Please specify a positive dollar amount to send.' });
    }

    let sender = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(senderId);
    if (!sender) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(senderId);
      sender = { wallet: 1000, bank: 5000 };
    }

    if (sender.wallet < amount) {
      return context.reply({ content: `❌ You do not have enough cash in your wallet! Wallet balance: **$${sender.wallet.toLocaleString()}**` });
    }

    // Ensure recipient exists
    let recAcc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(recipient.id);
    if (!recAcc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(recipient.id);
    }

    db.transaction(() => {
      db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(amount, senderId);
      db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(amount, recipient.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(senderId, 'TRANSFER_OUT', amount, `Sent to ${recipient.id}`, Date.now());
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(recipient.id, 'TRANSFER_IN', amount, `Received from ${senderId}`, Date.now());
    })();

    return context.reply({
      content: `💸 **Payment Sent!** Successfully transferred **$${amount.toLocaleString()}** to <@${recipient.id}>.`
    });
  }
};
