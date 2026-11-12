import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';
import { getItem } from './items.js';

export default {
  name: 'portfolio',
  description: 'View your complete economic portfolio, assets, and net worth',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['portfolio', 'inv', 'inventory', 'assets'],
  usage: '-portfolio [@user] or /portfolio [user]',
  slashData: new SlashCommandBuilder()
    .setName('portfolio')
    .setDescription('View your net worth, assets, and inventory')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),
  async execute(context, args = []) {
    let targetUser = context.user || context.author;
    if (context.options?.getUser) {
      targetUser = context.options.getUser('user') || targetUser;
    } else if (args[0]) {
      const mentionId = args[0].replace(/[<@!>]/g, '');
      if (context.guild?.members?.cache?.has(mentionId)) {
        targetUser = context.guild.members.cache.get(mentionId).user;
      }
    }

    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(targetUser.id);
    if (!acc) {
      acc = { wallet: 0, bank: 0 };
    }

    const items = db.prepare('SELECT * FROM user_inventory WHERE user_id = ?').all(targetUser.id);

    let inventoryValuation = 0;
    const itemLines = [];

    for (const inv of items) {
      const catalogItem = getItem(inv.item_id);
      const val = catalogItem ? catalogItem.price * inv.quantity : 0;
      inventoryValuation += val;
      itemLines.push(`• **${inv.item_name}** ×${inv.quantity} — \`$${val.toLocaleString()}\``);
    }

    const totalNetWorth = acc.wallet + acc.bank + inventoryValuation;

    const desc = [
      `Economic overview for **${targetUser.username}**:\n`,
      `💵 **Liquid Wallet Cash:** $${acc.wallet.toLocaleString()}`,
      `🏦 **Secured Bank Savings:** $${acc.bank.toLocaleString()}`,
      `📦 **Inventory & Real Assets:** $${inventoryValuation.toLocaleString()} (\`${items.length} Unique Items\`)`,
      `💰 **Total Net Worth:** **$${totalNetWorth.toLocaleString()}**`,
      '',
      '**Owned Physical Assets:**',
      itemLines.length > 0 ? itemLines.join('\n') : '*No physical assets or property owned yet. Visit `-shop` to acquire equipment.*'
    ].join('\n');

    const embed = WvrpEmbedBuilder.createBase({
      title: `💼 Asset Portfolio · ${targetUser.username}`,
      description: desc,
      footerText: 'Bank of West Virginia · Wealth Management'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
