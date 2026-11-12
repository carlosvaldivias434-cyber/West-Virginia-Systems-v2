import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';
import { getItem } from './items.js';

export default {
  name: 'sell',
  description: 'Sell an item from your inventory back to the depot',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['sell'],
  usage: '-sell <item_id> [quantity] or /sell item:<item_id> quantity:[number]',
  slashData: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell an item for cash')
    .addStringOption(opt => opt.setName('item').setDescription('Item ID').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantity').setDescription('Quantity to sell').setRequired(false)),
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
      return context.reply({ content: '❌ Please specify an item to sell: `-sell <item_id> [quantity]`.' });
    }

    if (quantity < 1 || isNaN(quantity)) quantity = 1;

    const item = getItem(itemId);
    if (!item) {
      return context.reply({ content: `❌ Item \`${itemId}\` does not exist in the catalog.` });
    }

    const inv = db.prepare('SELECT * FROM user_inventory WHERE user_id = ? AND item_id = ?').get(user.id, item.id);
    if (!inv || inv.quantity < quantity) {
      const owned = inv ? inv.quantity : 0;
      return context.reply({
        content: `❌ You do not have **${quantity}x ${item.name}** in your inventory! (Currently owned: \`${owned}\`).`
      });
    }

    const totalReturn = item.sellPrice * quantity;
    const now = Date.now();

    db.transaction(() => {
      if (inv.quantity === quantity) {
        db.prepare('DELETE FROM user_inventory WHERE id = ?').run(inv.id);
      } else {
        db.prepare('UPDATE user_inventory SET quantity = quantity - ? WHERE id = ?').run(quantity, inv.id);
      }

      db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(totalReturn, user.id);

      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(user.id, 'SALE', totalReturn, `Sold ${quantity}x ${item.name}`, now);
    })();

    const embed = WvrpEmbedBuilder.createBase({
      title: '💵 Item Sold · West Virginia Depot',
      description: `You successfully sold **${quantity}x ${item.name}**!\n\n• **Item:** ${item.name} (\`${item.id}\`)\n• **Quantity:** \`${quantity}\`\n• **Cash Received:** **+$${totalReturn.toLocaleString()}**\n• **Remaining Owned:** \`${inv.quantity - quantity}\``,
      footerText: 'West Virginia Commerce Commission'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
