import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'work',
  description: 'Work a shift in West Virginia for income',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['work'],
  usage: '-work or /work',
  slashData: new SlashCommandBuilder().setName('work').setDescription('Work a shift for income'),
  async execute(context) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000, last_work: 0 };
    }

    const now = Date.now();
    const cooldown = 30 * 60 * 1000; // 30 min cooldown
    if (now - (acc.last_work || 0) < cooldown) {
      const remainingMin = Math.ceil((cooldown - (now - acc.last_work)) / 60000);
      return context.reply({ content: `⏳ You are tired from your previous shift. Rest up and try again in **${remainingMin} minutes**.` });
    }

    const jobs = [
      { role: 'Kanawha River Ferry Captain', pay: 350 },
      { role: 'Charleston Tow Truck Driver', pay: 420 },
      { role: 'State Forest Ranger', pay: 480 },
      { role: 'Coal Miner Logistics Specialist', pay: 520 },
      { role: 'Highway Patrol Mechanic', pay: 450 }
    ];
    const chosen = jobs[Math.floor(Math.random() * jobs.length)];

    db.prepare('UPDATE economy SET wallet = wallet + ?, last_work = ? WHERE user_id = ?').run(chosen.pay, now, userId);
    return context.reply({ content: `💼 You worked as a **${chosen.role}** and earned **$${chosen.pay.toLocaleString()}**!` });
  }
};
