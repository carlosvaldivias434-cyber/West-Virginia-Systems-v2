import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'feedback',
  description: 'Submit official community or staff feedback to WVRP Management',
  category: 'Utility',
  permission: 'EVERYONE',
  aliases: ['feedback', 'suggest', 'stafffeedback'],
  usage: '-feedback <@staff|topic> <1-5> <comments> or /feedback target:<user> rating:<1-5> comments:<text>',
  slashData: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Submit official staff or server feedback')
    .addUserOption(opt => opt.setName('staff').setDescription('Staff member (optional)').setRequired(false))
    .addIntegerOption(opt =>
      opt.setName('rating')
        .setDescription('Star rating (1 to 5)')
        .setRequired(true)
        .addChoices(
          { name: '⭐⭐⭐⭐⭐ (5 - Exceptional)', value: 5 },
          { name: '⭐⭐⭐⭐ (4 - Great)', value: 4 },
          { name: '⭐⭐⭐ (3 - Satisfactory)', value: 3 },
          { name: '⭐⭐ (2 - Needs Improvement)', value: 2 },
          { name: '⭐ (1 - Unacceptable)', value: 1 }
        )
    )
    .addStringOption(opt => opt.setName('comments').setDescription('Your comments and details').setRequired(true)),
  async execute(context, args = []) {
    const submitter = context.user || context.author;
    let staffUser = null;
    let rating = 5;
    let comments = '';

    if (context.options?.getInteger) {
      staffUser = context.options.getUser('staff');
      rating = context.options.getInteger('rating') || 5;
      comments = context.options.getString('comments') || '';
    } else {
      if (args[0] && (args[0].startsWith('<@') || args[0].match(/^\d+$/))) {
        const id = args[0].replace(/[<@!>]/g, '');
        staffUser = { id, username: 'Staff Member' };
        rating = parseInt(args[1], 10) || 5;
        comments = args.slice(2).join(' ');
      } else {
        rating = parseInt(args[0], 10) || 5;
        comments = args.slice(1).join(' ');
      }
    }

    if (!comments || comments.trim().length < 3) {
      return context.reply({ content: '❌ Please provide specific comments for your feedback: `-feedback [@staff] <1-5> <comments>`' });
    }

    if (rating < 1) rating = 1;
    if (rating > 5) rating = 5;

    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    const feedbackId = `FB-${Math.floor(Math.random() * 9000) + 1000}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES ('FEEDBACK_SUBMITTED', ?, ?, ?, ?)
    `).run(
      submitter.id,
      staffUser ? staffUser.id : 'COMMUNITY',
      `Rating: ${rating}/5 | Feedback: ${comments.slice(0, 500)}`,
      now
    );

    const desc = [
      `Thank you <@${submitter.id}>! Your feedback has been securely transmitted to **West Virginia Roleplay High Command**.\n`,
      `• **Feedback ID:** \`${feedbackId}\``,
      `• **Target:** ${staffUser ? `<@${staffUser.id}>` : '*General Community Operations*'}`,
      `• **Rating:** ${stars} (\`${rating}/5\`)`,
      `• **Submission Date:** <t:${Math.floor(now / 1000)}:R>`,
      '',
      `**Submitted Commentary:**`,
      `> "${comments}"`,
      '',
      '*We continuously strive to deliver the highest quality roleplay experience.*'
    ].join('\n');

    const embed = WvrpEmbedBuilder.createBase({
      title: '📋 Community Feedback Transmitted',
      description: desc,
      footerText: 'West Virginia State Roleplay · Quality Assurance'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
