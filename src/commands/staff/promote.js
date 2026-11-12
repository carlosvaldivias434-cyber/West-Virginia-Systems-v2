import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS, createPromotionLogV2 } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'promote',
  description: 'Promote a staff member to a new rank (PROMO-0001) with thread and DM notification (Components V2)',
  category: 'Staff',
  permission: 'HIGH_RANK',
  aliases: ['promote'],
  usage: '-promote <@user> <rank> <reason>',
  slashData: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promote a staff member')
    .addUserOption(opt => opt.setName('user').setDescription('Staff member').setRequired(true))
    .addStringOption(opt => opt.setName('rank').setDescription('New Rank').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Promotion Reason').setRequired(true)),
  async execute(context, args = []) {
    let user = null;
    let rank = 'Trial Administrator';
    let reason = 'Dedicated service and leadership excellence';

    if (context.options?.getUser) {
      user = context.options.getUser('user');
      rank = context.options.getString('rank') || rank;
      reason = context.options.getString('reason') || reason;
    } else {
      if (args[0]) {
        const id = args[0].replace(/[<@!>]/g, '');
        if (context.guild?.members?.cache?.has(id)) {
          user = context.guild.members.cache.get(id).user;
        } else {
          user = { id, username: 'StaffMember', tag: 'StaffMember#0001' };
        }
      }
      if (args[1]) rank = args[1];
      if (args.length > 2) reason = args.slice(2).join(' ');
    }

    if (!user) {
      return context.reply({ content: '❌ Please specify a staff member to promote: `-promote <@user> <rank> <reason>`' });
    }

    const issuer = context.user || context.author;

    // Numbering starting from 0001
    const count = db.prepare('SELECT COUNT(*) as count FROM promotions').get().count;
    const promoId = `PROMO-${String(count + 1).padStart(4, '0')}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO promotions (id, staff_id, staff_tag, new_rank, reason, issuer_id, issuer_tag, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(promoId, user.id, user.tag || user.username, rank, reason, issuer.id, issuer.tag || issuer.username, now);

    const v2Payload = createPromotionLogV2({
      promotionId: promoId,
      staffUser: user,
      previousRank: 'Staff Member',
      newRank: rank,
      promotedBy: issuer,
      reason,
      timestamp: now
    });

    const replyResult = await context.reply(v2Payload);
    const replyMsg = context.fetchReply ? await context.fetchReply() : replyResult;

    // 1. Automatically open a Discord Thread for congratulations
    let thread = null;
    if (replyMsg && typeof replyMsg.startThread === 'function') {
      try {
        thread = await replyMsg.startThread({
          name: `Congratulations | ${promoId}`,
          autoArchiveDuration: 1440,
          reason: `Promotion thread for ${promoId}`
        });

        await thread.send({
          content: `🎉 **Congratulations Thread for ${promoId}**\n• **Honoree:** <@${user.id}> (\`${user.tag || user.username}\`)\n• **New Rank:** **${rank}**\n• **Promoted By:** <@${issuer.id}>\n• **Reason:** "${reason}"\n\n*Leave your congratulations for <@${user.id}> below!*`
        });
      } catch (threadErr) {
        console.warn(`Promotion thread creation fallback:`, threadErr.message);
      }
    }

    // 2. DM the promotion to the recipient
    try {
      const dmEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'promotion_dm',
        title: `WEST VIRGINIA STATE ROLEPLAY · PROMOTION NOTICE`,
        description: [
          `Congratulations, <@${user.id}>!`,
          '',
          `You have been officially promoted within the **West Virginia State Roleplay** staff team!`,
          '',
          '**Promotion Information:**',
          `• **Promotion ID:** \`${promoId}\``,
          `• **New Rank:** **${rank}**`,
          `• **Reason:** "${reason}"`,
          `• **Promoted By:** <@${issuer.id}>`,
          `• **Effective Date:** <t:${Math.floor(now / 1000)}:F>`,
          '',
          'Thank you for your continued dedication, leadership, and service to our community!'
        ].join('\n')
      });

      const recipient = context.guild?.members?.cache?.get(user.id)?.user || user;
      if (recipient?.send) {
        await recipient.send({ embeds: dmEmbeds });
      }
    } catch (dmErr) {
      console.warn(`Could not DM promotion ${promoId} to ${user.id}:`, dmErr.message);
      if (thread && thread.send) {
        await thread.send({ content: `⚠️ *Note: Could not deliver DM notice to <@${user.id}> (DMs disabled).*` });
      }
    }

    return replyResult;
  }
};
