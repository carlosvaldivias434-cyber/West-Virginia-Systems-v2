import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'daily',
  description: 'Claim your daily reward money',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['daily'],
  usage: '-daily or /daily',
  slashData: new SlashCommandBuilder().setName('daily').setDescription('Claim your daily reward'),
  async execute(context) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000, last_daily: 0, daily_streak: 0 };
    }

    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    if (now - (acc.last_daily || 0) < cooldown) {
      const remainingHours = Math.ceil((cooldown - (now - acc.last_daily)) / 3600000);
      return context.reply({ content: `⏳ You have already claimed your daily reward! Please check back in **${remainingHours} hours**.` });
    }

    const reward = 500 + (acc.daily_streak * 50);
    db.prepare('UPDATE economy SET wallet = wallet + ?, last_daily = ?, daily_streak = daily_streak + 1 WHERE user_id = ?').run(reward, now, userId);

    return context.reply({ content: `🎁 **Daily Reward Claimed!** You received **$${reward.toLocaleString()}**! Current Streak: **${(acc.daily_streak || 0) + 1} days**.` });
  }
};
