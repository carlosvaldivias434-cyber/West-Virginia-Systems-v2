import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'infraction',
  description: 'View, issue, or revoke official staff infractions (INF-0000)',
  category: 'Moderation',
  permission: 'HIGH_RANK',
  aliases: ['infraction', 'infractions'],
  usage: '-infraction <view|revoke|issue> [args]',
  subcommands: ['view', 'revoke', 'issue'],
  slashData: new SlashCommandBuilder()
    .setName('infraction')
    .setDescription('Inspect, issue, or revoke staff infractions')
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View infractions for a staff member or by ID')
        .addUserOption(opt => opt.setName('user').setDescription('Staff member').setRequired(false))
        .addStringOption(opt => opt.setName('id').setDescription('Infraction ID (e.g. INF-0314)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('revoke')
        .setDescription('Revoke an existing infraction')
        .addStringOption(opt => opt.setName('id').setDescription('Infraction ID (e.g. INF-0314)').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for revocation').setRequired(true))
    ),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'view';
    const staff = context.author || context.user;

    if (sub === 'revoke') {
      const infId = context.options?.getString?.('id') || args[1];
      const reason = context.options?.getString?.('reason') || args.slice(2).join(' ') || 'Appeal accepted by High Rank';
      if (!infId) return context.reply({ content: '❌ Please provide an Infraction ID to revoke (e.g. `INF-0314`).' });

      const inf = db.prepare('SELECT * FROM infractions WHERE id = ?').get(infId.toUpperCase());
      if (!inf) return context.reply({ content: `❌ Infraction \`${infId}\` was not found in the database.` });

      db.prepare(`
        UPDATE infractions
        SET status = 'REVOKED', revoked_by = ?, revoke_reason = ?
        WHERE id = ?
      `).run(staff.username, reason, infId.toUpperCase());

      const embed = WvrpEmbedBuilder.createBase({
        title: `⚖️ Infraction Revoked — ${inf.id}`,
        description: `**Staff Member:** <@${inf.staff_id}>\n**Previous Punishment:** ${inf.punishment}\n**Revoked By:** <@${staff.id}>\n**Revocation Reason:** ${reason}\n**Status:** \`REVOKED\``,
        footerText: 'West Virginia State Roleplay · Staff Discipline'
      });
      embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
      return context.reply({ embeds: [embed] });
    }

    // View
    const infId = context.options?.getString?.('id') || (args[1] && args[1].startsWith('INF') ? args[1] : null);
    if (infId) {
      const inf = db.prepare('SELECT * FROM infractions WHERE id = ?').get(infId.toUpperCase());
      if (!inf) return context.reply({ content: `❌ Infraction \`${infId}\` not found.` });

      const embed = WvrpEmbedBuilder.createBase({
        title: `📋 Infraction Record — ${inf.id}`,
        description: `**Staff:** <@${inf.staff_id}> (\`${inf.staff_tag}\`)\n**Issuer:** <@${inf.issuer_id}>\n**Punishment:** \`${inf.punishment}\`\n**Reason:** ${inf.reason}\n**Status:** \`${inf.status}\`\n**Date:** <t:${Math.floor(inf.created_at / 1000)}:F>${inf.revoked_by ? `\n\n**Revoked By:** ${inf.revoked_by}\n**Revoke Reason:** ${inf.revoke_reason}` : ''}`,
        footerText: 'West Virginia State Roleplay · Staff Records'
      });
      embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
      return context.reply({ embeds: [embed] });
    }

    const target = context.options?.getUser?.('user') || (args[1] ? { id: args[1].replace(/[<@!>]/g, ''), username: 'Staff' } : staff);
    const records = db.prepare('SELECT * FROM infractions WHERE staff_id = ? ORDER BY created_at DESC').all(target.id);

    let desc = `### Disciplinary History for <@${target.id}>\n**Total Infractions:** ${records.length}\n\n`;
    if (records.length === 0) {
      desc += '✨ *Clean disciplinary record. No infractions on file.*';
    } else {
      desc += records.map(r => `• **${r.id}** — \`${r.punishment}\` (${r.status}): ${r.reason} (<t:${Math.floor(r.created_at / 1000)}:d>)`).join('\n');
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: `🛡️ Infraction History — @${target.username}`,
      description: desc,
      footerText: 'West Virginia State Roleplay · Staff Discipline'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
    return context.reply({ embeds: [embed] });
  }
};
