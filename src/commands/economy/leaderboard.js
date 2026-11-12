import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'leaderboard',
  description: 'View the richest players in West Virginia State Roleplay',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['leaderboard', 'lb', 'top', 'rich'],
  usage: '-leaderboard or /leaderboard',
  slashData: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the richest players in WVRP'),
  async execute(context) {
    const rows = db.prepare(`
      SELECT user_id, wallet, bank, (wallet + bank) AS total
      FROM economy
      ORDER BY total DESC
      LIMIT 10
    `).all();

    const medalEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const lines = rows.map((r, i) => {
      const medal = medalEmojis[i] || `\`#${i + 1}\``;
      return `${medal} <@${r.user_id}>\n> 💰 **Total:** \`$${r.total.toLocaleString()}\` · 💵 Wallet: \`$${r.wallet.toLocaleString()}\` · 🏦 Bank: \`$${r.bank.toLocaleString()}\``;
    });

    const desc = lines.length > 0
      ? lines.join('\n\n')
      : '*No registered economic records found yet.*';

    const embed = WvrpEmbedBuilder.createBase({
      title: '🏆 West Virginia Roleplay · Richest Citizens Leaderboard',
      description: `The top 10 wealthiest community members in West Virginia:\n\n${desc}`,
      footerText: 'Bank of West Virginia · Forbes Wealth Index'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
