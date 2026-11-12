import departmentService from '../../../WVRP/bot/services/departmentService.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';

export default {
  name: 'coc',
  description: 'View the official West Virginia State Roleplay Chain of Command (Prefix Only)',
  category: 'Information',
  permission: 'EVERYONE',
  aliases: ['coc', 'chainofcommand', '!coc', '!chainofcommand'],
  usage: '!coc [department] or !chainofcommand [department]',
  slashData: null, // Strictly prefix-only as required
  async execute(context, args = []) {
    const deptId = (args[0] || 'staff').toLowerCase();
    const depts = departmentService.getAllDepartments();
    const activeDept = departmentService.getDepartment(deptId) || depts[0];

    const hierarchy = departmentService.getChainOfCommand(activeDept.id);

    let desc = `Official leadership hierarchy for **${activeDept.name}**:\n\n`;

    if (hierarchy.length > 0) {
      desc += hierarchy.map(h => {
        const title = h.rank_name || h.position_title || h.rank_title || 'Command Rank';
        const holder = h.user_tag || h.holder_name || 'Designated Officer';
        const userId = h.user_id || h.holder_user_id || '0';
        const notes = h.position_title || h.notes || 'Full departmental command and jurisdiction';
        return `**Tier ${h.rank_order} · ${title}**\n> 👤 Personnel: ${holder} (<@${userId}>)\n> 📋 Responsibilities: *${notes}*`;
      }).join('\n\n');
    } else {
      desc += '*No custom Chain of Command positions configured yet for this department.*';
    }

    desc += `\n\n📌 **Department Index:**\n${depts.map(d => `• \`!coc ${d.id}\` — ${d.name}`).join('\n')}`;

    const embed = WvrpEmbedBuilder.createBase({
      title: `🏛️ West Virginia Roleplay · Chain of Command (${activeDept.name})`,
      description: desc,
      footerText: 'West Virginia State Roleplay · Executive Leadership'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
