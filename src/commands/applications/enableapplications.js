import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';

export default {
  name: 'enableapplications',
  description: 'Officially open staff and department applications in the Application Hub',
  category: 'Applications',
  permission: 'ADMIN',
  aliases: ['enableapplications', 'openapplications', 'openapps'],
  usage: '-enableapplications or /enableapplications',
  slashData: new SlashCommandBuilder()
    .setName('enableapplications')
    .setDescription('Open staff applications for the community'),
  async execute(context) {
    const staff = context.author || context.user;
    const now = Date.now();

    db.prepare(`
      INSERT OR REPLACE INTO application_settings (key, value, updated_by, updated_at)
      VALUES ('applications_status', 'OPEN', ?, ?)
    `).run(staff.username, now);

    const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application',
      title: '📢 WVRP Applications Are Officially OPEN!',
      description: `We are thrilled to announce that staff applications for **West Virginia State Roleplay** are now officially open!\n\n📋 **Available Openings:**\n• **Staff Team (Trainee Moderator):** Help regulate the in-game server, respond to tickets, and assist members.\n• **Community Engagement Team (CET):** Host events, minigames, and community activities.\n• **Media Team:** Capture high-quality roleplay screenshots, trailers, and social clips.\n\n⏱ **Requirements:**\n• Must be at least 13 years old.\n• Full sentences, detailed answers, and proper SPaG.\n• **NO AI usage** (all responses run through Sapling AI detection).\n• Do not ask staff to review your application.`
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('app_apply_staff').setLabel('Apply for Staff').setStyle(ButtonStyle.Success).setEmoji('📝'),
      new ButtonBuilder().setCustomId('app_apply_media').setLabel('Apply for Media').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('app_apply_cet').setLabel('Apply for CET').setStyle(ButtonStyle.Secondary)
    );

    return context.reply({ embeds, components: [row] });
  }
};
