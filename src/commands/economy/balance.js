import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'balance',
  description: 'Check your wallet and bank balance',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['balance', 'bal'],
  usage: '-balance or /balance',
  slashData: new SlashCommandBuilder().setName('balance').setDescription('Check your balance'),
  async execute(context) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      title: 'Bank of West Virginia · Account Balance',
      description: `💵 **Wallet:** $${acc.wallet.toLocaleString()}\n🏦 **Bank:** $${acc.bank.toLocaleString()}\n💰 **Net Worth:** $${(acc.wallet + acc.bank).toLocaleString()}`
    });

    return context.reply({ embeds });
  }
};
