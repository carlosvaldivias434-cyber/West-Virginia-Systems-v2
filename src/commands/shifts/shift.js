import shiftService from '../../../WVRP/bot/services/shiftService.js';
import {
  createComponentsV2Container,
  createV2MessagePayload
} from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from 'discord.js';

export default {
  name: 'shift',
  description: 'View active staff shifts and leaderboards (Components V2)',
  category: 'Shifts',
  permission: 'STAFF',
  aliases: ['shift', 'shifts'],
  usage: '-shift <active|online>',
  subcommands: ['active', 'online'],
  slashData: new SlashCommandBuilder()
    .setName('shift')
    .setDescription('Staff shift tracking')
    .addSubcommand(sub => sub.setName('active').setDescription('Display the active-shifts panel'))
    .addSubcommand(sub => sub.setName('online').setDescription('Display staff currently on shift')),

  async execute(context) {
    const user = context.user || context.author;
    const data = shiftService.getActiveShifts();
    const stats = shiftService.getStaffWeeklyStats(user.id);

    let activeList = '';
    if (data.list.length === 0) {
      activeList = '*No staff members are currently on shift.*';
    } else {
      activeList = data.list.map(s => {
        const icon = s.status === 'ON_SHIFT' ? '🟢' : '🟡';
        return `${icon} **@${s.staffTag}** · **${s.status === 'ON_SHIFT' ? 'On Shift' : 'On Break'}**${s.shiftType === '50/50' ? ' · 50/50' : ''}\n> ⏱ **${s.elapsedFormatted}** on shift · started ${s.startedAgo} · ${s.breakCount} breaks · ${s.moderationCount} moderations`;
      }).join('\n\n');
    }

    const desc = [
      `# 🟢 West Virginia State Roleplay · Staff Shift Operations`,
      `### Active Shifts: **${data.onShiftCount}** on duty · **${data.onBreakCount}** on break`,
      '',
      activeList,
      '',
      `---`,
      `### 🪪 Your Shift Profile (<@${user.id}>)`,
      `• **Status:** ${shiftService.getActiveShift(user.id) ? '🟢 On Duty' : '⚪ Off Duty'}`,
      `• **Weekly Time:** **${stats.totalFormatted}** / ${stats.quotaFormatted} (${stats.percent}%)`,
      `• **Total Shifts This Week:** \`${stats.shiftCount}\``,
      `• **Quota Reset:** Every Monday at 00:00 UTC`
    ].join('\n');

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('shift_start_normal').setLabel('Start Shift').setStyle(ButtonStyle.Success).setEmoji('🟢'),
      new ButtonBuilder().setCustomId('shift_start_5050').setLabel('Start 50/50').setStyle(ButtonStyle.Primary).setEmoji('🔷'),
      new ButtonBuilder().setCustomId('shift_break_toggle').setLabel('Break').setStyle(ButtonStyle.Secondary).setEmoji('☕'),
      new ButtonBuilder().setCustomId('shift_end').setLabel('End Shift').setStyle(ButtonStyle.Danger).setEmoji('🛑')
    );

    const container = createComponentsV2Container({
      type: 'staff_activity',
      accentColor: 0x00A8FF,
      description: desc,
      actionRows: [buttons]
    });

    const payload = createV2MessagePayload(container);
    return context.reply(payload);
  }
};
