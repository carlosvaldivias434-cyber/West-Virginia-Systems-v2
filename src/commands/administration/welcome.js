import welcomeService from '../../../WVRP/bot/services/welcomeService.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'welcome',
  description: 'Manage or test the West Virginia State Roleplay Welcome System',
  category: 'Administration',
  permission: 'STAFF',
  aliases: ['welcomesystem'],
  usage: '-welcome <test|config>',
  subcommands: ['test', 'config'],
  slashData: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Manage or test the WVRP Welcome System')
    .addSubcommand(sub => sub.setName('test').setDescription('Simulate an incoming member welcome notification'))
    .addSubcommand(sub => sub.setName('config').setDescription('Display current welcome configuration')),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'test';

    if (sub === 'test') {
      const user = context.author || context.user || { id: '2056966914', username: 'NewMember' };
      const memberCount = context.guild?.memberCount || 20028;
      const res = await welcomeService.simulateJoin({
        userId: user.id,
        username: user.username,
        memberCount
      });

      return context.reply({
        content: `🧪 **[Simulation] Incoming Member Welcome** (Target: ${res.ordinal} member)`,
        embeds: res.payload.embeds,
        components: res.payload.components
      });
    }

    const cfg = welcomeService.getConfig();
    const embed = WvrpEmbedBuilder.createBase({
      title: '👋 WVRP Automatic Welcome System Configuration',
      description: `**Status:** ${cfg.enabled ? '🟢 Enabled' : '🔴 Disabled'}\n**Channel ID:** \`${cfg.channelId || 'Auto-detect (#welcome / #joins)'}\`\n**Show Member Count:** \`${cfg.showMemberCount ? 'Yes' : 'No'}\`\n**Verify Button:** \`${cfg.verifyButton ? 'Enabled' : 'Disabled'}\`\n**ER:LC Button:** \`${cfg.erlcButton ? 'Enabled' : 'Disabled'}\`\n\n🔗 **Configured Destinations:**\n• **Bloxlink Verification URL:** [${cfg.verifyUrl}](${cfg.verifyUrl})\n• **ER:LC Server Join URL:** [${cfg.erlcJoinUrl}](${cfg.erlcJoinUrl})`,
      footerText: 'West Virginia State Roleplay · Welcome Automation'
    });

    return context.reply({ embeds: [embed] });
  }
};
