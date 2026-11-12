import ticketWorkflowService, { WORKFLOW_DEFINITIONS } from '../../../WVRP/bot/services/ticketWorkflowService.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'workflow',
  description: 'Manually trigger or view an intelligent ticket workflow in this channel',
  category: 'Tickets',
  permission: 'STAFF',
  aliases: ['ticketworkflow', 'fastpass'],
  usage: '-workflow [type] or /workflow [type]',
  subcommands: ['fast_pass', 'dept_transfer', 'staff_app', 'roblox_verify', 'ban_appeal', 'partnership', 'dept_app', 'general_support', 'staff_complaint', 'erlc_support'],
  slashData: new SlashCommandBuilder()
    .setName('workflow')
    .setDescription('Manually trigger or view an intelligent ticket workflow')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Workflow to trigger')
        .setRequired(false)
        .addChoices(
          { name: '⚡ Fast-Pass', value: 'fast_pass' },
          { name: '🚓 Department Transfer', value: 'dept_transfer' },
          { name: '📝 Staff Applications', value: 'staff_app' },
          { name: '🔗 Roblox Verification', value: 'roblox_verify' },
          { name: '⚖️ Ban Appeals', value: 'ban_appeal' },
          { name: '🤝 Partnerships', value: 'partnership' },
          { name: '🛡️ Department Applications', value: 'dept_app' },
          { name: '⚙️ General Support', value: 'general_support' },
          { name: '🚨 Staff Complaints', value: 'staff_complaint' },
          { name: '🎮 ER:LC Support', value: 'erlc_support' }
        )
    ),
  async execute(context, args = []) {
    const chosenType = context.options?.getString?.('type') || args[0];
    const ticketId = context.channel?.name?.includes('ticket-') ? context.channel.name.split('-')[1] : 'MANUAL';
    const staff = context.author || context.user;

    if (!chosenType) {
      // List all available workflows
      const listText = WORKFLOW_DEFINITIONS.map(w => `• **${w.emoji} ${w.name}** (\`${w.type}\`)\n  ↳ *Triggers:* ${w.keywords.slice(0, 3).join(', ')}`).join('\n\n');
      const embed = WvrpEmbedBuilder.createBase({
        title: '📋 WVRP Ticket Automation Workflows',
        description: `West Virginia Roleplay automatically recognizes member inquiries and triggers official templates.\n\n${listText}\n\n*To manually post a workflow, use \`-workflow <type>\` or \`/workflow type:<type>\`.*`,
        footerText: 'West Virginia State Roleplay · Ticket Intelligence'
      });
      return context.reply({ embeds: [embed] });
    }

    const res = await ticketWorkflowService.triggerManualWorkflow(ticketId, context.channel, chosenType, staff);
    if (!res.success) {
      return context.reply({ content: `❌ ${res.error}` });
    }

    return context.reply({
      content: `✅ Manually posted **${chosenType}** workflow in this ticket channel.`,
      embeds: res.payload.embeds,
      components: res.payload.components || []
    });
  }
};
