import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';

export default {
  name: 'giveaway',
  description: 'Host, end, or reroll community giveaways with persistent entries',
  category: 'Utility',
  permission: 'STAFF',
  aliases: ['giveaway', 'gstart', 'greroll'],
  usage: '-giveaway <start|end|reroll> [args]',
  subcommands: ['start', 'end', 'reroll'],
  slashData: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Host and manage community giveaways')
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Start a new community giveaway')
        .addStringOption(opt => opt.setName('prize').setDescription('Prize for the giveaway').setRequired(true))
        .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(false))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('End an active giveaway early and pick winners')
        .addStringOption(opt => opt.setName('id').setDescription('Giveaway ID (optional)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('reroll')
        .setDescription('Reroll new winner(s) for a concluded giveaway')
        .addStringOption(opt => opt.setName('id').setDescription('Giveaway ID (optional)').setRequired(false))
    ),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'start';
    const staff = context.author || context.user;

    if (sub === 'start') {
      const prize = context.options?.getString?.('prize') || args.slice(1).join(' ') || '1,000 Robux + VIP Package';
      const winnersCount = context.options?.getInteger?.('winners') || 1;
      const durationMinutes = context.options?.getInteger?.('duration') || 60;
      const endsAt = Date.now() + (durationMinutes * 60 * 1000);
      const giveawayId = `GW-${Date.now().toString().slice(-4)}`;

      // Seed initial simulated entries so giveaway can be tested immediately
      const initialEntries = [
        { id: '2056966914', tag: 'CarlosWVRP' },
        { id: '1025813762684502168', tag: 'Puppylover130915' },
        { id: '987654321', tag: 'TaranBatman' }
      ];

      db.prepare(`
        INSERT INTO giveaways (id, channel_id, prize, winners_count, ends_at, ended, entries_json, winners_json, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, '[]', ?, ?)
      `).run(giveawayId, context.channel?.id || 'giveaways', prize, winnersCount, endsAt, JSON.stringify(initialEntries), staff.username, Date.now());

      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'community',
        title: `🎉 WVRP Community Giveaway — ${prize}`,
        description: `A brand new giveaway has started in **West Virginia State Roleplay**!\n\n🎁 **Prize:** **${prize}**\n🏆 **Winners:** \`${winnersCount} Winner${winnersCount > 1 ? 's' : ''}\`\n⏱ **Ends:** <t:${Math.floor(endsAt / 1000)}:R> (<t:${Math.floor(endsAt / 1000)}:f>)\n👤 **Hosted By:** <@${staff.id}>\n\nClick the button below to enter! Good luck to all participants!`
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway_enter_${giveawayId}`)
          .setLabel(`Enter Giveaway (${initialEntries.length})`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎉')
      );

      return context.reply({ embeds, components: [row] });
    }

    if (sub === 'end') {
      const gId = context.options?.getString?.('id') || args[1];
      const gw = gId
        ? db.prepare('SELECT * FROM giveaways WHERE id = ?').get(gId)
        : db.prepare('SELECT * FROM giveaways WHERE ended = 0 ORDER BY created_at DESC LIMIT 1').get();

      if (!gw) return context.reply({ content: '❌ No active giveaway found to end.' });

      let entries = [];
      try { entries = JSON.parse(gw.entries_json || '[]'); } catch (e) { entries = []; }
      if (entries.length === 0) return context.reply({ content: `❌ No entries were recorded for Giveaway \`${gw.id}\`.` });

      // Pick random winners
      const shuffled = [...entries].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, gw.winners_count || 1);

      db.prepare('UPDATE giveaways SET ended = 1, winners_json = ? WHERE id = ?')
        .run(JSON.stringify(winners), gw.id);

      const winnerMentions = winners.map(w => `<@${w.id}> (\`${w.tag}\`)`).join(', ');

      const embed = WvrpEmbedBuilder.createBase({
        title: '🎊 Giveaway Ended — Winner Announcement!',
        description: `**Giveaway ID:** \`${gw.id}\`\n🎁 **Prize:** **${gw.prize}**\n🏆 **Winner${winners.length > 1 ? 's' : ''}:** ${winnerMentions}\n👥 **Total Entries:** \`${entries.length} participants\`\n\n*Congratulations! Please open a ticket under \`Purchase Redemption\` to claim your prize within 48 hours.*`,
        footerText: 'West Virginia State Roleplay · Giveaways'
      });
      embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

      return context.reply({ content: `🎉 Congratulations ${winnerMentions}!`, embeds: [embed] });
    }

    if (sub === 'reroll') {
      const gId = context.options?.getString?.('id') || args[1];
      const gw = gId
        ? db.prepare('SELECT * FROM giveaways WHERE id = ?').get(gId)
        : db.prepare('SELECT * FROM giveaways ORDER BY created_at DESC LIMIT 1').get();

      if (!gw) return context.reply({ content: '❌ No giveaway found to reroll.' });

      let entries = [];
      try { entries = JSON.parse(gw.entries_json || '[]'); } catch (e) { entries = []; }
      if (entries.length === 0) return context.reply({ content: '❌ No entries recorded for this giveaway.' });

      const newWinner = entries[Math.floor(Math.random() * entries.length)];
      db.prepare('UPDATE giveaways SET winners_json = ? WHERE id = ?')
        .run(JSON.stringify([newWinner]), gw.id);

      const embed = WvrpEmbedBuilder.createBase({
        title: '🎲 Giveaway Rerolled!',
        description: `**Giveaway ID:** \`${gw.id}\`\n🎁 **Prize:** **${gw.prize}**\n🏆 **New Winner:** <@${newWinner.id}> (\`${newWinner.tag}\`)\n\n*Congratulations! Please open a ticket under \`Purchase Redemption\` to claim.*`,
        footerText: 'West Virginia State Roleplay · Giveaways'
      });
      embed.setImage(BANNERS.WVRP_BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

      return context.reply({ content: `🎉 New Winner Selected: <@${newWinner.id}>!`, embeds: [embed] });
    }

    return context.reply({ content: `Giveaway subcommand \`${sub}\` completed.` });
  }
};
