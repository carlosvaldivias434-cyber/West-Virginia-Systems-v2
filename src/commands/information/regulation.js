import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'regulation',
  description: 'Search official West Virginia State Roleplay community guidelines and penal regulations',
  category: 'Information',
  permission: 'EVERYONE',
  aliases: ['regulation', 'rules', 'rule', 'handbook'],
  usage: '-regulation [rule_number|topic] or /regulation [topic]',
  slashData: new SlashCommandBuilder()
    .setName('regulation')
    .setDescription('Look up WVRP community regulations')
    .addStringOption(opt =>
      opt.setName('topic')
        .setDescription('Regulation topic to view')
        .setRequired(false)
        .addChoices(
          { name: 'General Server Conduct', value: 'general' },
          { name: 'ER:LC Roleplay (FRP/RDM/VDM)', value: 'roleplay' },
          { name: 'Emergency Vehicle & Pursuit Rules', value: 'pursuits' },
          { name: 'Staff Code of Conduct', value: 'staff' },
          { name: 'Anti-Ping & Hierarchy Protection', value: 'antiping' }
        )
    ),
  async execute(context, args = []) {
    let topic = 'general';
    if (context.options?.getString) {
      topic = context.options.getString('topic') || 'general';
    } else if (args[0]) {
      topic = args[0].toLowerCase();
    }

    const rules = {
      general: {
        title: '📜 Regulation 1.0 — Community Conduct',
        text: [
          '• **1.1 Respect & Decorum:** Harassment, hate speech, slurs, discrimination, and excessive toxicity are strictly prohibited.',
          '• **1.2 Advertising:** Direct messaging server members with invites or promoting external servers without executive partnership is forbidden.',
          '• **1.3 Account Security:** Alternate accounts created to evade moderation penalties will result in immediate global ban.',
          '• **1.4 Directives:** Instructions issued by High Command or Server Moderators must be adhered to at all times.'
        ].join('\n')
      },
      roleplay: {
        title: '🚔 Regulation 2.0 — In-Game ER:LC Standards',
        text: [
          '• **2.1 Fail Roleplay (FRP):** Unrealistic driving (e.g. driving a sedan off 80ft cliffs without consequence) or ignoring realistic physics is prohibited.',
          '• **2.2 Random Deathmatch (RDM):** Initiating lethal force against players without prior roleplay initiation or clear reasonable storyline.',
          '• **2.3 Vehicle Deathmatch (VDM):** Using motor vehicles as primary lethal weapons to ram pedestrians or unarmored players.',
          '• **2.4 New Life Rule (NLR):** Upon respawn after death, you cannot recall past events leading to your death or return to the scene for 15 minutes.'
        ].join('\n')
      },
      pursuits: {
        title: '🚨 Regulation 3.0 — High-Speed Pursuits & Traffic',
        text: [
          '• **3.1 Pursuit Authorization:** LEO vehicles may initiate pursuit upon active felony evasion.',
          '• **3.2 PIT Maneuvers:** Prohibited above 75 MPH and prohibited in congested residential zones or construction sectors.',
          '• **3.3 Spike Strips:** Must be deployed with minimum 3 seconds warning to surrounding traffic.',
          '• **3.4 LEO Livery:** Unauthorized civilian use of restricted state police liveries is subject to livery unwhitelisting.'
        ].join('\n')
      },
      staff: {
        title: '🛡️ Regulation 4.0 — Staff Member Code of Conduct',
        text: [
          '• **4.1 Impartiality:** Staff must handle tickets, reports, and player moderation objectively without bias or favoritism.',
          '• **4.2 In-Game Moderation:** No moderation commands (;mod, ;kick, ;ban) may be used while actively participating in active civilian crimes.',
          '• **4.3 Quota Compliance:** Active staff must maintain minimum required weekly shift duration (default 3.3 hours).',
          '• **4.4 Confidentiality:** Leaking internal staff discussions, tickets, or reports will result in immediate termination.'
        ].join('\n')
      },
      antiping: {
        title: '🔕 Regulation 5.0 — Anti-Ping & Leadership Protection',
        text: [
          '• **5.1 Unauthorized Leadership Pings:** Pinging High Command, Ownership, or Staff Team roles without a valid emergency is prohibited.',
          '• **5.2 Automatic Escalation:** 1st Offense: Formal Warning | 2nd Offense: 10m Timeout | 3rd Offense: 1h Timeout | 4th Offense: Kick | 5th Offense: Ban.',
          '• **5.3 Support Process:** For assistance, always open a support ticket in `#support-tickets`.'
        ].join('\n')
      }
    };

    const target = rules[topic] || rules.general;

    const embed = WvrpEmbedBuilder.createBase({
      title: target.title,
      description: `${target.text}\n\n*Violation of regulations may result in formal infraction, game server kick, or community ban.*`,
      footerText: 'West Virginia State Roleplay · Penal Code'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
