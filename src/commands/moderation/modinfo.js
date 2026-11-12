import { SlashCommandBuilder } from 'discord.js';
import moderationService from '../../../WVRP/bot/services/moderationService.js';
import { createModerationCaseInfoV2 } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { checkPermission } from '../registryStore.js';

export default {
  name: 'modinfo',
  description: 'Inspect complete file records for a specific moderation case (e.g. MOD-0001)',
  category: 'Moderation',
  permission: 'STAFF',
  aliases: ['modinfo', 'caseinfo', 'case'],
  usage: '-modinfo <case_id>',
  slashData: new SlashCommandBuilder()
    .setName('modinfo')
    .setDescription('Inspect a specific moderation case by ID (e.g. MOD-0001)')
    .addStringOption(opt =>
      opt.setName('case_id')
        .setDescription('Case ID to inspect (e.g. MOD-0001 or 1)')
        .setRequired(true)
    ),
  async execute(context, args = []) {
    const moderatorMember = context.member;

    // Staff permission check
    const hasPerm = checkPermission(moderatorMember, 'STAFF');
    if (!hasPerm && moderatorMember) {
      return context.reply({
        content: '❌ **Access Denied:** You must be an authorized staff member to inspect moderation case files.',
        ephemeral: true
      });
    }

    let caseId = null;
    if (context.options?.getString) {
      caseId = context.options.getString('case_id');
    } else {
      caseId = args[0];
    }

    if (!caseId) {
      return context.reply({
        content: '❌ **Usage:** `-modinfo <MOD-0001>`'
      });
    }

    const caseData = moderationService.getCase(caseId);
    if (!caseData) {
      return context.reply({
        content: `❌ **Case Not Found:** No moderation record exists for \`${caseId}\`.`,
        ephemeral: true
      });
    }

    const payload = createModerationCaseInfoV2({ caseData });
    return context.reply(payload);
  }
};
