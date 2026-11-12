import db from '../../../WVRP/bot/database/index.js';
import {
  createComponentsV2Container,
  createV2MessagePayload
} from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import { checkPermission } from '../registryStore.js';

export default {
  name: 'modpanel',
  description: 'Open the West Virginia Staff & Moderator Operations Dashboard in Discord Components V2',
  category: 'Staff',
  permission: 'STAFF',
  aliases: ['modpanel', 'mod-panel', 'staffpanel'],
  usage: '-modpanel or /modpanel',
  slashData: new SlashCommandBuilder()
    .setName('modpanel')
    .setDescription('Open the WVRP Staff Moderator Operations Panel (Components V2)'),
  async execute(context) {
    const moderatorMember = context.member;
    const hasPerm = checkPermission(moderatorMember, 'STAFF');
    if (!hasPerm && moderatorMember) {
      return context.reply({
        content: '❌ **Access Denied:** You must be an authorized staff member to open the moderator panel.',
        ephemeral: true
      });
    }

    const activeShiftsCount = db.prepare("SELECT COUNT(*) as count FROM staff_active_status WHERE status = 'ON_SHIFT'").get()?.count || 0;
    const openTicketsCount = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'OPEN'").get()?.count || 0;
    const pendingAppsCount = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'PENDING'").get()?.count || 0;
    const totalInfractions = db.prepare("SELECT COUNT(*) as count FROM infractions WHERE status = 'ACTIVE'").get()?.count || 0;
    const totalModCases = db.prepare("SELECT COUNT(*) as count FROM moderation_cases").get()?.count || 0;
    const activeMutes = db.prepare("SELECT COUNT(*) as count FROM moderation_cases WHERE action_type = 'MUTE' AND status = 'ACTIVE' AND expiration_timestamp > ?").get(Date.now())?.count || 0;

    const desc = [
      'Welcome to the staff operations console. Use the interactive controls below to monitor live duties, review pending queues, audit shifts, inspect disciplinary records, and view real-time moderation metrics.',
      '',
      '**📊 Live Staff & Operational Metrics:**',
      `• **Active Staff on Duty:** \`${activeShiftsCount} Staff Members\``,
      `• **Open Support Tickets:** \`${openTicketsCount} Tickets\``,
      `• **Pending Applications:** \`${pendingAppsCount} Applications\``,
      `• **Active Staff Infractions:** \`${totalInfractions} Active Records\``,
      `• **Total Moderation Cases:** \`${totalModCases} Recorded\``,
      `• **Active Member Mutes:** \`${activeMutes} Currently Timed Out\``,
      '',
      '📌 **Staff Directives:** Maintain professional conduct at all times in both Discord and ER:LC servers. All moderation actions receive unique sequential `MOD-0000` case IDs.'
    ].join('\n');

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mod_active_shifts').setLabel('Active Shifts').setStyle(ButtonStyle.Success).setEmoji('🟢'),
      new ButtonBuilder().setCustomId('mod_open_tickets').setLabel('Open Tickets').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
      new ButtonBuilder().setCustomId('mod_app_hub').setLabel('Review Applications').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
      new ButtonBuilder().setCustomId('mod_stats_open').setLabel('Moderation Stats').setStyle(ButtonStyle.Primary).setEmoji('📊')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mod_infraction_btn').setLabel('Infractions Queue').setStyle(ButtonStyle.Danger).setEmoji('⚖️'),
      new ButtonBuilder().setCustomId('mod_antiping_logs').setLabel('Anti-Ping Logs').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
      new ButtonBuilder().setCustomId('mod_quota_audit').setLabel('Quota Audit').setStyle(ButtonStyle.Secondary).setEmoji('📈'),
      new ButtonBuilder().setLabel('Web Dashboard').setStyle(ButtonStyle.Link).setURL(process.env.PUBLIC_URL || 'https://wvrp-dashboard.local').setEmoji('🌐')
    );

    const container = createComponentsV2Container({
      type: 'staff_dashboard',
      accentColor: 0x00A8FF,
      title: '🛡️ WVRP MODERATOR OPERATIONS CONTROL PANEL',
      subtitle: 'West Virginia State Roleplay · Staff Department Console',
      description: desc,
      actionRows: [row1, row2]
    });

    return context.reply(createV2MessagePayload(container));
  }
};
