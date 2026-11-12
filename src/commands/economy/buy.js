import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';
import { getItem } from './items.js';

export default {
  name: 'buy',
  description: 'Purchase an item from the West Virginia store',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['buy', 'purchase'],
  usage: '-buy <item_id> [quantity] or /buy item:<item_id> quantity:[number]',
  slashData: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from the store')
    .addStringOption(opt => opt.setName('item').setDescription('Item ID or name').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantity').setDescription('Quantity to purchase').setRequired(false)),
  async execute(context, args = []) {
    const user = context.user || context.author;
    let itemId = '';
    let quantity = 1;

    if (context.options?.getString) {
      itemId = context.options.getString('item');
      quantity = context.options.getInteger('quantity') || 1;
    } else {
      itemId = args[0];
      if (args[1]) quantity = parseInt(args[1], 10) || 1;
    }

    if (!itemId) {
      return context.reply({ content: '❌ Please specify an item to buy: `-buy <item_id> [quantity]`. Check `-shop` to view available items.' });
    }

    if (quantity < 1 || isNaN(quantity)) quantity = 1;

    const item = getItem(itemId);
    if (!item) {
      return context.reply({ content: `❌ Item \`${itemId}\` not found in store catalog. Use \`-shop\` to browse available items.` });
    }

    const totalCost = item.price * quantity;

    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(user.id);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(user.id);
      acc = { wallet: 1000, bank: 5000 };
    }

    if (acc.wallet < totalCost) {
      return context.reply({
        content: `❌ Insufficient cash! **${quantity}x ${item.name}** costs **$${totalCost.toLocaleString()}**, but your wallet only has **$${acc.wallet.toLocaleString()}**.\n💡 Withdraw cash from your bank with \`-withdraw ${totalCost}\`.`
      });
    }

    const now = Date.now();

    db.transaction(() => {
      db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(totalCost, user.id);

      const existingInv = db.prepare('SELECT * FROM user_inventory WHERE user_id = ? AND item_id = ?').get(user.id, item.id);
      if (existingInv) {
        db.prepare('UPDATE user_inventory SET quantity = quantity + ? WHERE id = ?').run(quantity, existingInv.id);
      } else {
        db.prepare('INSERT INTO user_inventory (user_id, item_id, item_name, quantity, purchased_at) VALUES (?, ?, ?, ?, ?)')
          .run(user.id, item.id, item.name, quantity, now);
      }

      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(user.id, 'PURCHASE', totalCost, `Bought ${quantity}x ${item.name}`, now);
    })();

    const embed = WvrpEmbedBuilder.createBase({
      title: '🛍️ Purchase Complete · West Virginia Depot',
      description: `You successfully bought **${quantity}x ${item.name}**!\n\n• **Item:** ${item.name} (\`${item.id}\`)\n• **Quantity:** \`${quantity}\`\n• **Total Paid:** **$${totalCost.toLocaleString()}**\n• **New Wallet Balance:** **$${(acc.wallet - totalCost).toLocaleString()}**\n\n*Check your inventory with \`-portfolio\` or \`-inv\`.*`,
      footerText: 'West Virginia Commerce Commission'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
