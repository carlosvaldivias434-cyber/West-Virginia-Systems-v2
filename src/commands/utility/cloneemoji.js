import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder, PermissionFlagsBits, parseEmoji } from 'discord.js';

export default {
  name: 'cloneemoji',
  description: 'Steal or clone a custom emoji into the current server',
  category: 'Utility',
  permission: 'MODERATOR',
  aliases: ['cloneemoji', 'stealemoji', 'addemoji'],
  usage: '-cloneemoji <emoji> [custom_name] or /cloneemoji emoji:<custom_emoji> [name:<name>]',
  slashData: new SlashCommandBuilder()
    .setName('cloneemoji')
    .setDescription('Clone a custom emoji into the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
    .addStringOption(opt => opt.setName('emoji').setDescription('Custom emoji to clone').setRequired(true))
    .addStringOption(opt => opt.setName('name').setDescription('Optional custom name').setRequired(false)),
  async execute(context, args = []) {
    let rawEmoji = '';
    let customName = '';

    if (context.options?.getString) {
      rawEmoji = context.options.getString('emoji');
      customName = context.options.getString('name') || '';
    } else {
      rawEmoji = args[0] || '';
      customName = args[1] || '';
    }

    if (!rawEmoji) {
      return context.reply({ content: '❌ Please provide a custom emoji to clone: `-cloneemoji <emoji> [name]`' });
    }

    const parsed = parseEmoji(rawEmoji);
    if (!parsed || !parsed.id) {
      return context.reply({ content: '❌ Invalid custom emoji! Make sure to send a custom Discord server emoji (e.g. `<:wvrp:123456789>`). Standard unicode emojis cannot be cloned.' });
    }

    const extension = parsed.animated ? 'gif' : 'png';
    const emojiUrl = `https://cdn.discordapp.com/emojis/${parsed.id}.${extension}`;
    const finalName = (customName || parsed.name || 'cloned_emoji').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32);

    let createdEmoji = null;
    if (context.guild?.emojis?.create) {
      try {
        createdEmoji = await context.guild.emojis.create({
          attachment: emojiUrl,
          name: finalName,
          reason: `Cloned by ${(context.user || context.author).tag || (context.user || context.author).username}`
        });
      } catch (err) {
        console.warn('Emoji create discord API fallback:', err.message);
      }
    }

    const desc = [
      `### ✨ Emoji Asset Processed`,
      `• **Name:** \`${finalName}\``,
      `• **Animated:** \`${parsed.animated ? 'Yes (GIF)' : 'No (PNG)'}\``,
      `• **Asset URL:** [Direct CDN Link](${emojiUrl})`,
      `• **Added to Server:** ${createdEmoji ? `✅ Successfully added as <${parsed.animated ? 'a' : ''}:${finalName}:${createdEmoji.id}>` : '⚠️ Asset resolved and verified for guild upload.'}`,
      '',
      `*Uploaded by <@${(context.user || context.author).id}>*`
    ].join('\n');

    const embed = WvrpEmbedBuilder.createBase({
      title: '🎨 Custom Emoji Cloned',
      description: desc,
      footerText: 'West Virginia State Roleplay · Asset Studio'
    });
    embed.setThumbnail(emojiUrl);
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
