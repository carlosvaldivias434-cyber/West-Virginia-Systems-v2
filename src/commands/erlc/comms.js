import db from '../../../WVRP/bot/database/index.js';
import erlcService from '../../../WVRP/bot/services/erlcService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'comms',
  description: 'Manage ER:LC radio communications, whitelist, and emergency server broadcasts',
  category: 'ER:LC',
  permission: 'STAFF',
  aliases: ['comms', 'radio'],
  usage: '-comms <whitelist|unwhitelist|whitelists|message> [args]',
  subcommands: ['whitelist', 'unwhitelist', 'whitelists', 'message'],
  slashData: new SlashCommandBuilder()
    .setName('comms')
    .setDescription('ER:LC radio communications and broadcast control')
    .addSubcommand(sub =>
      sub.setName('whitelist')
        .setDescription('Whitelist a member for ER:LC radio communications')
        .addUserOption(opt => opt.setName('user').setDescription('User to whitelist').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('unwhitelist')
        .setDescription('Remove a member from ER:LC radio communications')
        .addUserOption(opt => opt.setName('user').setDescription('User to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('whitelists')
        .setDescription('List all members whitelisted for ER:LC radio comms')
    )
    .addSubcommand(sub =>
      sub.setName('message')
        .setDescription('Broadcast an official emergency radio message in-game')
        .addStringOption(opt => opt.setName('text').setDescription('Message to broadcast').setRequired(true))
    ),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'whitelists';
    const staff = context.author || context.user;

    if (sub === 'whitelist') {
      const target = context.options?.getUser?.('user') || (args[1] ? { id: args[1].replace(/[<@!>]/g, ''), username: args[1].replace(/[<@!>]/g, '') } : null);
      if (!target) return context.reply({ content: '❌ Please specify a user to whitelist for comms.' });

      db.prepare(`
        INSERT OR REPLACE INTO comms_whitelist (user_id, user_tag, added_by, created_at)
        VALUES (?, ?, ?, ?)
      `).run(target.id, target.username, staff.username, Date.now());

      const embed = WvrpEmbedBuilder.createBase({
        title: '📻 Radio Comms Whitelist Added',
        description: `**User:** <@${target.id}>\n**Authorized By:** <@${staff.id}>\n**Status:** Granted access to WVRP Public Safety radio frequency dispatch.`,
        footerText: 'West Virginia State Roleplay · Communications Control'
      });
      embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
      return context.reply({ embeds: [embed] });
    }

    if (sub === 'unwhitelist') {
      const target = context.options?.getUser?.('user') || (args[1] ? { id: args[1].replace(/[<@!>]/g, ''), username: args[1].replace(/[<@!>]/g, '') } : null);
      if (!target) return context.reply({ content: '❌ Please specify a user to remove from comms.' });

      db.prepare('DELETE FROM comms_whitelist WHERE user_id = ?').run(target.id);
      return context.reply({ content: `✅ Removed <@${target.id}> from the ER:LC Radio Communications whitelist.` });
    }

    if (sub === 'message') {
      const text = context.options?.getString?.('text') || args.slice(1).join(' ');
      if (!text) return context.reply({ content: '❌ Please provide an announcement text to broadcast.' });

      let resultMsg = 'Broadcast sent to server';
      if (erlcService.isConfigured()) {
        const res = await erlcService.runCommand(`:m ${text}`);
        resultMsg = res.success ? 'Delivered via ER:LC v2 API' : 'ER:LC API error';
      }

      const embed = WvrpEmbedBuilder.createBase({
        title: '📢 ER:LC Emergency Broadcast Dispatched',
        description: `**Broadcast Content:**\n> "${text}"\n\n**Dispatched By:** <@${staff.id}>\n**Status:** ${resultMsg}`,
        footerText: 'West Virginia State Roleplay · Radio Dispatch'
      });
      embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
      return context.reply({ embeds: [embed] });
    }

    // Default: whitelists
    const list = db.prepare('SELECT * FROM comms_whitelist ORDER BY created_at DESC LIMIT 30').all();
    let desc = `### Active Radio Whitelisted Personnel (${list.length})\n\n`;
    if (list.length === 0) {
      desc += '*No users are currently whitelisted for radio communications.*';
    } else {
      desc += list.map(item => `• <@${item.user_id}> (\`${item.user_tag}\`) — Added by **${item.added_by}** (<t:${Math.floor(item.created_at / 1000)}:R>)`).join('\n');
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: '📻 WVRP Comms Whitelist Directory',
      description: desc,
      footerText: 'West Virginia State Roleplay · Communications Control'
    });
    embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
    return context.reply({ embeds: [embed] });
  }
};
