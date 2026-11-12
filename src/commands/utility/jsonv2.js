import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { EMBED_COLOR, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';

export default {
  name: 'jsonv2',
  description: 'Construct and dispatch an official embed from a raw JSON payload',
  category: 'Utility',
  permission: 'ADMINISTRATOR',
  aliases: ['jsonv2', 'embedjson', 'rawembed'],
  usage: '-jsonv2 <json_payload> or /jsonv2 payload:<json_string>',
  slashData: new SlashCommandBuilder()
    .setName('jsonv2')
    .setDescription('Dispatch a custom embed from a raw JSON payload')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt => opt.setName('payload').setDescription('JSON embed payload').setRequired(true)),
  async execute(context, args = []) {
    let rawJson = '';
    if (context.options?.getString) {
      rawJson = context.options.getString('payload');
    } else {
      rawJson = args.join(' ');
    }

    if (!rawJson) {
      const exampleJson = JSON.stringify({
        title: 'WVRP Official Directive',
        description: 'Detailed announcement text here.',
        color: WVRP_COLORS.PRIMARY,
        fields: [{ name: 'Section', value: 'Details', inline: true }]
      }, null, 2);

      return context.reply({
        content: `❌ Please provide valid JSON: \`-jsonv2 <json>\`\nExample format:\n\`\`\`json\n${exampleJson}\n\`\`\``
      });
    }

    // Clean markdown code blocks if passed
    const cleanJson = rawJson.replace(/```(?:json)?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (err) {
      return context.reply({ content: `❌ Invalid JSON format: \`${err.message}\`` });
    }

    try {
      const embed = new EmbedBuilder();
      if (parsed.title) embed.setTitle(parsed.title);
      if (parsed.description) embed.setDescription(parsed.description);
      embed.setColor(parsed.color || EMBED_COLOR);
      if (parsed.fields && Array.isArray(parsed.fields)) {
        embed.addFields(parsed.fields);
      }
      if (parsed.thumbnail) embed.setThumbnail(parsed.thumbnail);
      if (parsed.image) {
        embed.setImage(parsed.image);
      } else {
        embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
      }
      if (parsed.footer) {
        embed.setFooter(typeof parsed.footer === 'string' ? { text: parsed.footer } : parsed.footer);
      } else {
        embed.setFooter({ text: 'West Virginia State Roleplay · Embed Engine V2' });
      }

      return context.reply({ embeds: [embed] });
    } catch (err) {
      return context.reply({ content: `❌ Error constructing embed: ${err.message}` });
    }
  }
};
