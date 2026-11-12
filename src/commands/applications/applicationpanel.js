import { createApplicationPanelV2 } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from 'discord.js';

export default {
  name: 'applicationpanel',
  description: 'Post the West Virginia Application Hub panel (Discord Components V2)',
  category: 'Applications',
  permission: 'ADMIN',
  aliases: ['applicationpanel', 'applypanel'],
  usage: '-applicationpanel or /applicationpanel',
  slashData: new SlashCommandBuilder()
    .setName('applicationpanel')
    .setDescription('Post the West Virginia Application Hub panel (Components V2)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(context) {
    const payload = createApplicationPanelV2();
    return context.reply(payload);
  }
};
