import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'rob',
  description: 'Attempt to pickpocket or rob another citizen (High Risk / Reward)',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['rob', 'steal'],
  usage: '-rob <@user>',
  slashData: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Attempt to rob another citizen')
    .addUserOption(opt => opt.setName('user').setDescription('Target citizen').setRequired(true)),
  async execute(context, args = []) {
    const robberId = (context.user || context.author).id;
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: 'Target' } : null);

    if (!target || target.id === robberId) {
      return context.reply({ content: '❌ You cannot rob yourself! Specify another member in the server.' });
    }

    let robber = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(robberId);
    if (!robber) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(robberId);
      robber = { wallet: 1000, bank: 5000 };
    }

    let victim = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(target.id);
    if (!victim || victim.wallet < 100) {
      return context.reply({ content: `❌ <@${target.id}> has less than $100 in their wallet. They aren't worth the risk!` });
    }

    // 45% chance of success, 55% chance of getting caught by State Police
    const success = Math.random() < 0.45;

    if (success) {
      const maxSteal = Math.min(victim.wallet, Math.floor(victim.wallet * 0.4) + 50);
      const stolen = Math.floor(Math.random() * maxSteal) + 20;

      db.transaction(() => {
        db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(stolen, target.id);
        db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(stolen, robberId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(robberId, 'ROBBERY_SUCCESS', stolen, `Robbed ${target.id}`, Date.now());
      })();

      return context.reply({
        content: `🥷 **Robbery Successful!** You snuck up on <@${target.id}> and stole **$${stolen.toLocaleString()}** from their wallet!`
      });
    } else {
      const fine = Math.min(robber.wallet, 350);
      db.transaction(() => {
        if (fine > 0) {
          db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(fine, robberId);
        }
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(robberId, 'ROBBERY_FAILED', fine, `Fined for attempted robbery on ${target.id}`, Date.now());
      })();

      return context.reply({
        content: `🚨 **Caught by West Virginia State Police!** You were caught attempting to rob <@${target.id}> and paid a **$${fine.toLocaleString()}** fine to the court!`
      });
    }
  }
};
