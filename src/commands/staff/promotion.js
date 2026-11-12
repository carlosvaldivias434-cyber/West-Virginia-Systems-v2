import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'promotion',
  description: 'View or revoke official staff promotion records (PRO-0000)',
  category: 'Staff',
  permission: 'HIGH_RANK',
  aliases: ['promotion', 'promotions'],
  usage: '-promotion <view|revoke> [args]',
  subcommands: ['view', 'revoke'],
  slashData: new SlashCommandBuilder()
    .setName('promotion')
    .setDescription('View or revoke staff promotions')
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View promotion records for a staff member')
        .addUserOption(opt => opt.setName('user').setDescription('Staff member').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('revoke')
        .setDescription('Revoke a staff promotion record')
        .addStringOption(opt => opt.setName('id').setDescription('Promotion ID (e.g. PRO-0129)').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for revocation').setRequired(true))
    ),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'view';
    const staff = context.author || context.user;

    if (sub === 'revoke') {
      const promoId = context.options?.getString?.('id') || args[1];
      const reason = context.options?.getString?.('reason') || args.slice(2).join(' ') || 'Administrative reversal';
      if (!promoId) return context.reply({ content: '❌ Please provide a Promotion ID to revoke (e.g. `PRO-0129`).' });

      const promo = db.prepare('SELECT * FROM promotions WHERE id = ?').get(promoId.toUpperCase());
      if (!promo) return context.reply({ content: `❌ Promotion \`${promoId}\` was not found in the database.` });

      db.prepare(`UPDATE promotions SET status = 'REVOKED' WHERE id = ?`).run(promoId.toUpperCase());

      const embed = WvrpEmbedBuilder.createBase({
        title: `↩️ Promotion Revoked — ${promo.id}`,
        description: `**Staff Member:** <@${promo.staff_id}>\n**Revoked Rank:** ${promo.new_rank}\n**Revoked By:** <@${staff.id}>\n**Reason:** ${reason}`,
        footerText: 'West Virginia State Roleplay · Staff Administration'
      });
      embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
      return context.reply({ embeds: [embed] });
    }

    // View
    const target = context.options?.getUser?.('user') || (args[1] ? { id: args[1].replace(/[<@!>]/g, ''), username: 'Staff' } : staff);
    const records = db.prepare('SELECT * FROM promotions WHERE staff_id = ? ORDER BY created_at DESC').all(target.id);

    let desc = `### Promotion History for <@${target.id}>\n**Total Promotions Logged:** ${records.length}\n\n`;
    if (records.length === 0) {
      desc += '*No promotions logged in the database for this staff member.*';
    } else {
      desc += records.map(p => `• **${p.id}** — **${p.new_rank}** (By <@${p.issuer_id}>): "${p.reason}" (<t:${Math.floor(p.created_at / 1000)}:d>)`).join('\n');
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: `⭐ Staff Promotion History — @${target.username}`,
      description: desc,
      footerText: 'West Virginia State Roleplay · Career Milestones'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
    return context.reply({ embeds: [embed] });
  }
};
