import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  name: 'say',
  description: 'Broadcast an official announcement or message as the bot',
  category: 'Moderation',
  permission: 'MODERATOR',
  aliases: ['say', 'announce', 'broadcast', 'echo'],
  usage: '-say [embed|raw] <message> or /say message:<text> [format:embed|raw]',
  slashData: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Broadcast an official message as the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt => opt.setName('message').setDescription('Message content').setRequired(true))
    .addStringOption(opt =>
      opt.setName('format')
        .setDescription('Presentation format')
        .setRequired(false)
        .addChoices(
          { name: 'Official WVRP Embed', value: 'embed' },
          { name: 'Plain Text Message', value: 'raw' }
        )
    ),
  async execute(context, args = []) {
    const isSlash = Boolean(context.options?.getString);
    let messageText = '';
    let format = 'embed';

    if (isSlash) {
      messageText = context.options.getString('message');
      format = context.options.getString('format') || 'embed';
    } else {
      if (args[0] && (args[0].toLowerCase() === 'embed' || args[0].toLowerCase() === 'raw')) {
        format = args[0].toLowerCase();
        messageText = args.slice(1).join(' ');
      } else {
        messageText = args.join(' ');
      }
    }

    if (!messageText || messageText.trim().length === 0) {
      return context.reply({ content: '❌ Please provide a message to send: `-say [embed|raw] <message>`' });
    }

    const executor = context.user || context.author;
    const now = Date.now();

    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES ('BOT_ANNOUNCEMENT', ?, ?, ?, ?)
    `).run(
      executor.id,
      context.channel ? context.channel.id : 'CHANNEL',
      `Sent via ${format}: ${messageText.slice(0, 200)}`,
      now
    );

    if (format === 'raw') {
      return context.reply({ content: messageText });
    }

    const embed = WvrpEmbedBuilder.createBase({
      title: '📢 West Virginia State Roleplay — Announcement',
      description: messageText,
      footerText: 'West Virginia State Roleplay · Official Communication'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
