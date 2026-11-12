import { commands, getCategories, checkPermission } from '../registryStore.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  SlashCommandBuilder
} from 'discord.js';

export default {
  name: 'commands',
  description: 'View the complete West Virginia Roleplay command catalog and directory',
  category: 'Information',
  permission: 'EVERYONE',
  aliases: ['commands', 'help', 'cmds'],
  usage: '-commands [category] or /commands [category]',
  slashData: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('View the complete WVRP command directory')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Filter by command category')
        .setRequired(false)
    ),
  async execute(context, args = []) {
    const selectedCategory = context.options?.getString?.('category') || (args[0] ? args[0].trim() : null);
    const member = context.member;
    const allCategories = getCategories();

    // If a specific category was requested
    if (selectedCategory) {
      const matchedCat = allCategories.find(c => c.toLowerCase() === selectedCategory.toLowerCase());
      if (matchedCat) {
        const catCommands = Array.from(commands.values()).filter(c => (c.category || 'Misc').toLowerCase() === matchedCat.toLowerCase());

        let desc = `### ${matchedCat} Commands (${catCommands.length})\n\n`;
        for (const cmd of catCommands) {
          const hasPerm = checkPermission(member, cmd.permission || 'EVERYONE');
          const permBadge = cmd.permission && cmd.permission !== 'EVERYONE' ? ` \`[${cmd.permission}]\`` : '';
          const lockIcon = hasPerm ? '🔹' : '🔒';

          desc += `${lockIcon} **\`-${cmd.name}\`**${permBadge}\n`;
          desc += `> ${cmd.description || 'No description provided.'}\n`;
          if (cmd.usage) {
            desc += `> **Usage:** \`${cmd.usage}\`\n`;
          }
          if (cmd.aliases && cmd.aliases.length > 1) {
            const extraAliases = cmd.aliases.filter(a => a !== cmd.name);
            if (extraAliases.length > 0) {
              desc += `> **Aliases:** \`${extraAliases.join('`, `')}\`\n`;
            }
          }
          if (cmd.subcommands && cmd.subcommands.length > 0) {
            desc += `> **Subcommands:** \`${cmd.subcommands.join('`, `')}\`\n`;
          }
          desc += '\n';
        }

        const embed = WvrpEmbedBuilder.createBase({
          title: `West Virginia Roleplay · ${matchedCat} Directory`,
          description: desc.trim(),
          footerText: 'West Virginia State Roleplay · Command Catalog'
        });

        const categoryOptions = allCategories.map(c => ({
          label: c,
          value: c,
          default: c.toLowerCase() === matchedCat.toLowerCase(),
          description: `View commands in ${c}`
        }));

        const menuRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('commands_cat_select')
            .setPlaceholder('Browse another category')
            .addOptions(categoryOptions.slice(0, 25))
        );

        return context.reply({ embeds: [embed], components: [menuRow] });
      }
    }

    // Default Overview
    const categoryBreakdown = allCategories.map(c => {
      const count = Array.from(commands.values()).filter(cmd => (cmd.category || 'Misc').toLowerCase() === c.toLowerCase()).length;
      return `• **${c}:** \`${count}\` commands`;
    }).join('\n');

    const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
      type: 'commands',
      title: 'West Virginia Roleplay — Command Directory',
      description: `Welcome to the WVRP Discord Bot command directory. All commands are organized into modular domains.\n\n**Total Registered Commands:** \`${commands.size}\` primary modules\n**Default Prefix:** \`-\`\n**Slash Commands:** Fully supported via \`/\`\n\n**Available Categories:**\n${categoryBreakdown}\n\n*Select a category below to view detailed command usages, subcommands, and permissions.*`
    });

    const categoryOptions = allCategories.map(c => ({
      label: c,
      value: c,
      description: `View ${c} commands`
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('commands_cat_select')
        .setPlaceholder('Select a category to view commands')
        .addOptions(categoryOptions.slice(0, 25))
    );

    return context.reply({ embeds, components: [row] });
  }
};
