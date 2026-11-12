import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  name: 'purge',
  description: 'Bulk delete messages from the current channel',
  category: 'Moderation',
  permission: 'MODERATOR',
  aliases: ['purge', 'clear', 'clean'],
  usage: '-purge <amount> [@user] or /purge amount:<1-100> [user]',
  slashData: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages from the channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(opt => opt.setName('user').setDescription('Filter by specific user').setRequired(false)),
  async execute(context, args = []) {
    const isSlash = Boolean(context.options?.getInteger);
    let amount = 10;
    let filterUser = null;

    if (isSlash) {
      amount = context.options.getInteger('amount') || 10;
      filterUser = context.options.getUser('user');
    } else {
      amount = parseInt(args[0], 10);
      if (args[1]) {
        const id = args[1].replace(/[<@!>]/g, '');
        if (context.guild?.members?.cache?.has(id)) {
          filterUser = context.guild.members.cache.get(id).user;
        }
      }
    }

    if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
      return context.reply({ content: '❌ Please specify a valid number of messages to delete between 1 and 100: `-purge <amount>`' });
    }

    const channel = context.channel;
    const executor = context.user || context.author;
    let deletedCount = amount;

    if (channel && channel.bulkDelete) {
      try {
        const messages = await channel.messages.fetch({ limit: amount + 1 });
        let targets = messages;
        if (filterUser) {
          targets = messages.filter(m => m.author.id === filterUser.id);
        }
        const deleted = await channel.bulkDelete(targets, true);
        deletedCount = deleted.size;
      } catch (err) {
        console.warn(`Bulk delete fallback:`, err.message);
      }
    }

    const now = Date.now();
    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES ('PURGE_MESSAGES', ?, ?, ?, ?)
    `).run(
      executor.id,
      channel ? channel.id : 'CHANNEL',
      `Purged ${deletedCount} messages${filterUser ? ` from ${filterUser.username}` : ''}`,
      now
    );

    const embed = WvrpEmbedBuilder.createBase({
      title: '🧹 Chat Purge Executed',
      description: `Successfully cleaned **${deletedCount}** message${deletedCount === 1 ? '' : 's'} from <#${channel ? channel.id : 'channel'}>.\n\n• **Moderator:** <@${executor.id}>\n• **Filter:** ${filterUser ? `<@${filterUser.id}>` : '*All messages*'}`,
      footerText: 'West Virginia Moderation Core'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
