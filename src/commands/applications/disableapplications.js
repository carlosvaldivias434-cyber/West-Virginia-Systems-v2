import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'disableapplications',
  description: 'Officially close staff and department applications in the Application Hub',
  category: 'Applications',
  permission: 'ADMIN',
  aliases: ['disableapplications', 'closeapplications', 'closeapps'],
  usage: '-disableapplications or /disableapplications',
  slashData: new SlashCommandBuilder()
    .setName('disableapplications')
    .setDescription('Close staff applications for the community'),
  async execute(context) {
    const staff = context.author || context.user;
    const now = Date.now();

    db.prepare(`
      INSERT OR REPLACE INTO application_settings (key, value, updated_by, updated_at)
      VALUES ('applications_status', 'CLOSED', ?, ?)
    `).run(staff.username, now);

    const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'application',
      title: '🔒 WVRP Applications Are Officially CLOSED',
      description: `Staff and department applications for **West Virginia State Roleplay** have officially closed for this recruitment wave.\n\n• Thank you to everyone who submitted an application!\n• Our Leadership Team is reviewing all submissions.\n• You will receive a direct notification regarding your application status once evaluated.\n• Keep an eye on announcements for the next application cycle!`
    });

    return context.reply({ embeds });
  }
};
