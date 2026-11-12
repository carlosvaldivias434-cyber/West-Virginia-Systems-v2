import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS, createInfractionLogV2 } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from 'discord.js';

export default {
  name: 'infract',
  description: 'Issue an official staff infraction (INF-0001) with evidence thread & DM notification',
  category: 'Moderation',
  permission: 'HIGH_RANK',
  aliases: ['infract'],
  usage: '-infract <@user> <punishment> <reason> [appealable]',
  slashData: new SlashCommandBuilder()
    .setName('infract')
    .setDescription('Issue an official staff infraction')
    .addUserOption(opt => opt.setName('user').setDescription('Staff member to infract').setRequired(true))
    .addStringOption(opt => opt.setName('punishment').setDescription('Punishment type').setRequired(true).addChoices(
      { name: 'Verbal Warning', value: 'Verbal Warning' },
      { name: 'Official Warning', value: 'Official Warning' },
      { name: 'Strike 1', value: 'Strike 1' },
      { name: 'Strike 2', value: 'Strike 2' },
      { name: 'Suspension', value: 'Suspension' },
      { name: 'Termination', value: 'Termination' }
    ))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for infraction').setRequired(true))
    .addBooleanOption(opt => opt.setName('appealable').setDescription('Whether this infraction is appealable')),
  async execute(context, args = []) {
    let user = null;
    let punishment = 'Verbal Warning';
    let reason = 'Staff conduct policy violation';
    let appealable = true;

    if (context.options?.getUser) {
      user = context.options.getUser('user');
      punishment = context.options.getString('punishment') || 'Verbal Warning';
      reason = context.options.getString('reason') || reason;
      appealable = context.options.getBoolean('appealable') ?? true;
    } else {
      if (args[0]) {
        const id = args[0].replace(/[<@!>]/g, '');
        if (context.guild?.members?.cache?.has(id)) {
          user = context.guild.members.cache.get(id).user;
        } else {
          user = { id, username: 'StaffMember', tag: 'StaffMember#0001' };
        }
      }
      if (args[1]) punishment = args[1];
      if (args.length > 2) reason = args.slice(2).join(' ');
    }

    if (!user) {
      return context.reply({ content: '❌ Please specify a staff member to infract: `-infract <@user> <punishment> <reason>`' });
    }

    const issuer = context.user || context.author;

    // Numbering starting from 0001
    const count = db.prepare('SELECT COUNT(*) as count FROM infractions').get().count;
    const infId = `INF-${String(count + 1).padStart(4, '0')}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO infractions (id, staff_id, staff_tag, punishment, reason, issuer_id, issuer_tag, appealable, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).run(infId, user.id, user.tag || user.username, punishment, reason, issuer.id, issuer.tag || issuer.username, appealable ? 1 : 0, now);

    const v2Payload = createInfractionLogV2({
      infractionId: infId,
      staffUser: user,
      punishment,
      reason,
      issuer,
      appealable,
      timestamp: now
    });

    // Reply to channel with Discord Components V2
    const replyResult = await context.reply(v2Payload);
    const replyMsg = context.fetchReply ? await context.fetchReply() : replyResult;

    // 1. Automatically open a Discord Thread on the message to post evidence
    let thread = null;
    if (replyMsg && typeof replyMsg.startThread === 'function') {
      try {
        thread = await replyMsg.startThread({
          name: `Evidence | ${infId}`,
          autoArchiveDuration: 1440,
          reason: `Evidence archive for ${infId}`
        });

        await thread.send({
          content: `📁 **Evidence Archive for ${infId}**\n• **Target:** <@${user.id}> (\`${user.tag || user.username}\`)\n• **Issuer:** <@${issuer.id}>\n• **Punishment:** \`${punishment}\`\n• **Reason:** "${reason}"\n\n*Staff members and reviewers: Please upload all screenshots, video clips, and logs below.*`
        });
      } catch (threadErr) {
        console.warn(`Thread creation fallback for ${infId}:`, threadErr.message);
      }
    }

    // 2. DM the infraction to the member
    try {
      const dmEmbeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'infraction_dm',
        title: `WEST VIRGINIA STATE ROLEPLAY · DISCIPLINARY NOTICE`,
        description: [
          `Hello <@${user.id}>,`,
          '',
          `You have received an official staff infraction within **West Virginia State Roleplay**.`,
          '',
          '**Infraction Details:**',
          `• **Infraction ID:** \`${infId}\``,
          `• **Punishment:** \`${punishment}\``,
          `• **Reason:** "${reason}"`,
          `• **Issued By:** <@${issuer.id}>`,
          `• **Timestamp:** <t:${Math.floor(now / 1000)}:F>`,
          `• **Appealable:** ${appealable ? '✅ Yes' : '❌ No'}`,
          '',
          appealable
            ? '*If you believe this infraction was issued in error, click the button below to open an official appeal channel.*'
            : '*This infraction has been marked as non-appealable by High Command.*'
        ].join('\n')
      });

      const recipient = context.guild?.members?.cache?.get(user.id)?.user || user;
      if (recipient?.send) {
        await recipient.send({ embeds: dmEmbeds, components: appealable ? [appealButton] : [] });
      }
    } catch (dmErr) {
      console.warn(`Could not DM infraction ${infId} to ${user.id}:`, dmErr.message);
      if (thread && thread.send) {
        await thread.send({ content: `⚠️ *Note: Could not deliver DM notice to <@${user.id}> (DMs disabled).*` });
      }
    }

    return replyResult;
  }
};
