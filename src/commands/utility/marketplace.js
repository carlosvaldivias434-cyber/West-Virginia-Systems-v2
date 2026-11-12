import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from 'discord.js';

export default {
  name: 'marketplace',
  description: 'Post the West Virginia Marketplace panel',
  category: 'Utility',
  permission: 'ADMIN',
  aliases: ['marketplace'],
  usage: '-marketplace or /marketplace',
  slashData: new SlashCommandBuilder().setName('marketplace').setDescription('Post the West Virginia Marketplace panel'),
  async execute(context) {
    const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'marketplace',
      title: 'WVRP Marketplace',
      description: `The WVRP Marketplace is your one stop destination for supporting the community while getting your name, brand, or community noticed. Here, you can purchase **paid advertisements**, sponsor exciting **giveaways**, make **donations**, purchase exclusive **memberships**, and explore a variety of other ways to get involved.\n\n🛒 **Marketplace Information**\nBefore purchasing from our marketplace, all customers are required to **read, understand and comply** with our **Marketplace Terms Of Service**. Please Note: West Virginia Roleplay **DOES NOT** sell access to in-game ER:LC content.`
    });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('market_tos_view').setLabel('Terms Of Service').setStyle(ButtonStyle.Success).setEmoji('✅')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('market_cat_ads').setLabel('>> Paid Advertisements & Giveaways').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('market_cat_packages').setLabel('>> Packages & Donations').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('market_cat_perks').setLabel('💎 Perks & Rewards').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('market_cat_priority').setLabel('🚀 Priority Postage').setStyle(ButtonStyle.Link).setURL('https://wvrp-store.local')
    );

    return context.reply({ embeds, components: [row1, row2] });
  }
};
