import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'hack',
  description: 'Attempt to breach a Kanawha County ATM terminal or municipal crypto mainframe',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['hack', 'breach'],
  usage: '-hack [target]',
  slashData: new SlashCommandBuilder()
    .setName('hack')
    .setDescription('Attempt a cyber breach on a local mainframe')
    .addStringOption(opt =>
      opt.setName('target')
        .setDescription('Target system to hack')
        .setRequired(false)
        .addChoices(
          { name: 'Kanawha Valley ATM', value: 'atm' },
          { name: 'Charleston City Hall Pay-Terminal', value: 'city_hall' },
          { name: 'Appalachian Coal Logistics Mainframe', value: 'coal' }
        )
    ),
  async execute(context, args = []) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const targetType = context.options?.getString?.('target') || args[0] || 'atm';
    const isSuccess = Math.random() < 0.5;

    if (isSuccess) {
      const loot = Math.floor(Math.random() * 800) + 400;
      db.transaction(() => {
        db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(loot, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'HACK_SUCCESS', loot, `Hacked ${targetType}`, Date.now());
      })();

      return context.reply({
        content: `💻 **ACCESS GRANTED [BYPASS OK]**\nYou bypassed the firewall of **${targetType.toUpperCase()}** and siphoned **$${loot.toLocaleString()}** untraceable crypto cash!`
      });
    } else {
      const penalty = Math.min(acc.wallet, 300);
      db.transaction(() => {
        if (penalty > 0) {
          db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(penalty, userId);
        }
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'HACK_FAILED', penalty, `Trace alert on ${targetType}`, Date.now());
      })();

      return context.reply({
        content: `🚨 **SECURITY BREACH DETECTED!**\nYour proxy IP was traced by State Cyber Taskforce. You wiped your drives and forfeited **$${penalty.toLocaleString()}** in defense fees!`
      });
    }
  }
};
