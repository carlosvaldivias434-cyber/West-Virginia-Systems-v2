import db from '../../../WVRP/bot/database/index.js';
import erlcService from '../../../WVRP/bot/services/erlcService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'whitelist',
  description: 'Whitelist a player for ER:LC in-game server access or department livery',
  category: 'ER:LC',
  permission: 'HIGH_RANK',
  aliases: ['whitelist', 'wl'],
  usage: '-whitelist <@user|roblox_username> [type]',
  slashData: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Whitelist a player for ER:LC access or livery')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Whitelist type')
        .setRequired(false)
        .addChoices(
          { name: 'Server Whitelist', value: 'SERVER' },
          { name: 'Police Livery', value: 'LIVERY' },
          { name: 'Sheriff Livery', value: 'SHERIFF' },
          { name: 'DOT Access', value: 'DOT' }
        )
    ),
  async execute(context, args = []) {
    const target = context.options?.getUser?.('user') || (args[0] ? { id: args[0].replace(/[<@!>]/g, ''), username: args[0].replace(/[<@!>]/g, '') } : null);
    if (!target) return context.reply({ content: '❌ Please specify a user to whitelist. Usage: `-whitelist <@user> [type]`' });

    const type = context.options?.getString?.('type') || args[1] || 'SERVER';
    const staff = context.author || context.user;
    const now = Date.now();

    db.prepare(`
      INSERT OR REPLACE INTO livery_whitelist (user_id, user_tag, added_by, created_at)
      VALUES (?, ?, ?, ?)
    `).run(target.id, target.username, staff.username, now);

    // Call ER:LC in-game command if configured
    if (erlcService.isConfigured()) {
      await erlcService.runCommand(`:whitelist ${target.username}`);
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: '🛡️ ER:LC Whitelist Granted',
      description: `**Player:** <@${target.id}> (\`${target.id}\`)\n**Authorized By:** <@${staff.id}>\n**Whitelist Tier:** \`${type}\`\n**In-Game API Status:** ${erlcService.isConfigured() ? '✅ Synced with ER:LC Server' : 'ℹ️ Saved to Database (Simulation Mode)'}\n**Timestamp:** <t:${Math.floor(now / 1000)}:R>`,
      footerText: 'West Virginia State Roleplay · ER:LC Whitelist System'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
