import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';
import { SHOP_ITEMS } from './items.js';

export default {
  name: 'shop',
  description: 'View the official West Virginia Marketplace and equipment store',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['shop', 'store', 'market'],
  usage: '-shop [category] or /shop [category]',
  slashData: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View the official WVRP Marketplace catalog')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Filter items by department/category')
        .setRequired(false)
        .addChoices(
          { name: 'All Items', value: 'all' },
          { name: 'Equipment', value: 'Equipment' },
          { name: 'Vehicles', value: 'Vehicles' },
          { name: 'Certifications', value: 'Certifications' },
          { name: 'Real Estate', value: 'Real Estate' }
        )
    ),
  async execute(context, args = []) {
    let filterCategory = null;
    if (context.options?.getString) {
      filterCategory = context.options.getString('category');
    } else if (args[0]) {
      filterCategory = args[0].toLowerCase();
    }

    let items = SHOP_ITEMS;
    if (filterCategory && filterCategory !== 'all') {
      items = SHOP_ITEMS.filter(i => i.category.toLowerCase().includes(filterCategory.toLowerCase()));
      if (items.length === 0) items = SHOP_ITEMS;
    }

    const itemsFormatted = items.map(i => {
      return `🛒 **${i.name}** (\`${i.id}\`)\n• **Price:** \`$${i.price.toLocaleString()}\` · **Resell:** \`$${i.sellPrice.toLocaleString()}\`\n• **Category:** *${i.category}*\n• *${i.description}*`;
    }).join('\n\n');

    const embed = WvrpEmbedBuilder.createBase({
      title: '🏬 West Virginia Marketplace & Equipment Depot',
      description: `Welcome to the official WVRP community store! Buy items with \`-buy <item_id>\` and sell items with \`-sell <item_id>\`.\n\n${itemsFormatted}`,
      footerText: 'West Virginia Commerce Commission · Economic Depot'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
