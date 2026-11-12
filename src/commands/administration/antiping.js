import antiPingService from '../../../WVRP/bot/services/antiPingService.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export function checkPermission(member, requiredLevel = 'EVERYONE') {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (requiredLevel === 'EVERYONE') return true;

  const roles = member.roles?.cache ? Array.from(member.roles.cache.values()).map(r => r.name.toLowerCase()) : [];
  
  if (requiredLevel === 'STAFF') {
    return roles.some(r => r.includes('staff') || r.includes('mod') || r.includes('admin') || r.includes('trainee'));
  }
  if (requiredLevel === 'HIGH_RANK') {
    return roles.some(r => r.includes('high rank') || r.includes('management') || r.includes('director') || r.includes('admin'));
  }
  if (requiredLevel === 'SENIOR_HIGH_RANK') {
    return roles.some(r => r.includes('senior high rank') || r.includes('directive') || r.includes('owner'));
  }
  return false;
}

export default {
  name: 'antiping',
  description: 'Inspect and manage member Anti-Ping strikes and protected leadership roles',
  category: 'Administration',
  permission: 'STAFF',
  aliases: ['antiping', 'ap'],
  usage: '-antiping <view|reset|set|config> [args]',
  subcommands: ['view', 'reset', 'set', 'config'],
  slashData: new SlashCommandBuilder()
    .setName('antiping')
    .setDescription('Inspect and manage Anti-Ping strikes')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View Anti-Ping record of a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Reset strikes for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set strike count for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
        .addIntegerOption(opt => opt.setName('strikes').setDescription('Strike count to set').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('config')
        .setDescription('View current Anti-Ping configuration & protected roles')
    ),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'config';
    const staffUser = context.user || context.author;

    // Check staff permission for management actions
    if (!checkPermission(context.member, 'STAFF')) {
      return context.reply({ content: '❌ You do not have permission to inspect or manage Anti-Ping strikes.', ephemeral: true });
    }

    if (sub === 'view') {
      const targetUser = context.options?.getUser?.('user') || (args[1] ? { id: args[1].replace(/[<@!>]/g, ''), username: 'Member' } : staffUser);
      const data = antiPingService.getUserRecord(targetUser.id);

      const embed = WvrpEmbedBuilder.createBase({
        title: `🛡️ Anti-Ping Record — @${data.record.user_tag || targetUser.username}`,
        description: `**Member ID:** \`${targetUser.id}\`\n**Current Strikes:** \`${data.record.strike_count}/3\` (Tier ${data.record.tier})\n**Last Strike:** ${data.record.last_strike_at ? new Date(data.record.last_strike_at).toLocaleString() : 'Never'}\n**Last Action:** \`${data.record.last_punishment || 'None'}\`\n\n📌 **Recent Violations (${data.logs.length}):**\n${
          data.logs.length === 0
            ? '*No previous anti-ping violations logged for this member.*'
            : data.logs.map(l => `• Strike ${l.strike_number}: **${l.target_team_name}** — ${l.punishment} (${new Date(l.created_at).toLocaleDateString()})`).join('\n')
        }`,
        footerText: 'West Virginia Roleplay · Security Administration'
      });

      return context.reply({ embeds: [embed] });
    }

    if (sub === 'reset') {
      const targetUser = context.options?.getUser?.('user') || (args[1] ? { id: args[1].replace(/[<@!>]/g, ''), username: 'Member' } : null);
      if (!targetUser) return context.reply({ content: '❌ Please specify a user to reset strikes for.' });

      antiPingService.resetUserStrikes(targetUser.id, staffUser.tag || staffUser.username);
      return context.reply({ content: `✅ Anti-Ping strikes have been reset to **0** for <@${targetUser.id}> by @${staffUser.username}.` });
    }

    if (sub === 'set') {
      const targetUser = context.options?.getUser?.('user') || (args[1] ? { id: args[1].replace(/[<@!>]/g, ''), username: 'Member' } : null);
      const count = context.options?.getInteger?.('strikes') ?? parseInt(args[2] || '0', 10);
      if (!targetUser) return context.reply({ content: '❌ Please specify a user and strike count.' });

      antiPingService.setUserStrikes(targetUser.id, count, staffUser.tag || staffUser.username);
      return context.reply({ content: `✅ Set Anti-Ping strikes to **${count}** for <@${targetUser.id}>.` });
    }

    // Default: config view
    const cfg = antiPingService.getConfig();
    const embed = WvrpEmbedBuilder.createBase({
      title: '🛡️ WVRP Anti-Ping System Configuration',
      description: `**Status:** ${cfg.enabled ? '🟢 Enabled' : '🔴 Disabled'}\n**Strikes Per Tier:** \`${cfg.strikesPerTier}\`\n**Strike Reset Cooldown:** \`${cfg.strikeResetHours} hours\`\n**Mute Tier 1:** \`${cfg.muteTier1Minutes} minutes\`\n**Mute Tier 2:** \`${cfg.muteTier2Minutes} minutes\`\n**Mute Tier 3:** \`${cfg.muteTier3Minutes} minutes (24h)\`\n\n👥 **Protected Leadership Teams:**\n• **Foundership Team:** ${cfg.foundership.length > 0 ? cfg.foundership.join(', ') : 'Role patterns: foundership, founder, owner'}\n• **Foundation Team:** ${cfg.foundation.length > 0 ? cfg.foundation.join(', ') : 'Role patterns: foundation'}\n• **Directive Team:** ${cfg.directive.length > 0 ? cfg.directive.join(', ') : 'Role patterns: directive'}\n• **Exempt Roles:** ${cfg.exemptRoles.length > 0 ? cfg.exemptRoles.join(', ') : 'Administrators & Leadership'}\n\n🎬 **Instructional GIF:** [View Configured GIF](${cfg.gifUrl})`,
      footerText: 'West Virginia Roleplay · Security Settings'
    });

    return context.reply({ embeds: [embed] });
  }
};
