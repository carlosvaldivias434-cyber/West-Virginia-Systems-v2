import boostService from '../../../WVRP/bot/services/boostService.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'boost',
  description: 'Server Boost and Server Tag automation testing and settings',
  category: 'Administration',
  permission: 'STAFF',
  aliases: ['serverboost', 'boostrep'],
  usage: '-boost <test|tag|config>',
  subcommands: ['test', 'tag', 'config'],
  slashData: new SlashCommandBuilder()
    .setName('boost')
    .setDescription('Server Boost and Server Tag automation testing')
    .addSubcommand(sub => sub.setName('test').setDescription('Simulate a server boost thank-you embed'))
    .addSubcommand(sub => sub.setName('tag').setDescription('Simulate a server tag equip thank-you embed'))
    .addSubcommand(sub => sub.setName('config').setDescription('Display server boost and tag configuration')),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'test';
    const user = context.author || context.user || { id: '2056966914', username: 'Booster' };

    if (sub === 'test') {
      const boostLevel = context.guild?.premiumTier || 3;
      const boostCount = context.guild?.premiumSubscriptionCount || 14;
      const res = await boostService.simulateBoost({
        userId: user.id,
        username: user.username,
        boostLevel,
        boostCount
      });

      return context.reply({
        content: `🧪 **[Simulation] Server Boost Thank-You**`,
        embeds: res.payload.embeds
      });
    }

    if (sub === 'tag') {
      const tag = process.env.TAG_IDENTIFIER || 'WVRP';
      const res = await boostService.simulateTag({
        userId: user.id,
        username: user.username,
        tag
      });

      return context.reply({
        content: `🧪 **[Simulation] Server Tag Equipped Thank-You**`,
        embeds: res.payload.embeds
      });
    }

    const cfg = boostService.getConfig();
    const embed = WvrpEmbedBuilder.createBase({
      title: '🚀 WVRP Server Boost & Tag Configuration',
      description: `**Server Boost Automation:** ${cfg.boostEnabled ? '🟢 Enabled' : '🔴 Disabled'}\n**Boost Channel ID:** \`${cfg.boostChannelId || 'Auto-detect (#boosts / #announcements)'}\`\n**Show Booster Avatar:** \`${cfg.showAvatar ? 'Yes' : 'No'}\`\n**Show Boost Count:** \`${cfg.showCount ? 'Yes' : 'No'}\`\n**Show Boost Tier Level:** \`${cfg.showLevel ? 'Yes' : 'No'}\`\n\n🏷️ **Server Tag Automation:**\n**Tag Notifications:** ${cfg.tagEnabled ? '🟢 Enabled' : '🔴 Disabled'}\n**Target Tag String:** \`${cfg.tagIdentifier}\`\n**Tag Channel ID:** \`${cfg.tagChannelId || 'Same as Boost Channel'}\``,
      footerText: 'West Virginia State Roleplay · Supporter Perks'
    });

    return context.reply({ embeds: [embed] });
  }
};
