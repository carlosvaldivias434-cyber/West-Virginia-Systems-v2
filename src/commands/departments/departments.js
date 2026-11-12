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
  name: 'departments',
  description: 'Post the West Virginia Whitelisted Departments panel (Components V2)',
  category: 'Departments',
  permission: 'ADMIN',
  aliases: ['departments', 'depts'],
  usage: '-departments or /departments',
  slashData: new SlashCommandBuilder().setName('departments').setDescription('Post the West Virginia Whitelisted Departments panel (Components V2)'),
  async execute(context) {
    const desc = [
      `# 🏛️ West Virginia State Roleplay · Certified Departments`,
      `Explore the various specialized branches and emergency divisions within West Virginia State Roleplay. Each agency offers dedicated careers, custom vehicle fleets, tactical training, and immersive simulation.`,
      '',
      `• **Department Policy:** One primary law enforcement agency at a time; auxiliary divisions are unlimited.`,
      `• **Senior High Rank (SHR):** Limited to one command position across state agencies.`,
      '',
      `### ⭐ West Virginia State Police (WVSP)`,
      `Statewide primary law enforcement agency. Specializes in highway interdiction, tactical operations, high-speed pursuit, and state capital security.`,
      '',
      `### 🌟 Kanawha County Sheriff's Office (KCSO)`,
      `Primary county sheriff division overseeing county patrol, regional warrant service, court security, and civil process.`,
      '',
      `### 🌲 West Virginia Division of Forestry (WVDNR)`,
      `Conservation law enforcement, wildlife protection, rural search & rescue, and forest fire prevention across the Appalachian foothills.`,
      '',
      `### 🚑 Kanawha Valley Fire & Rescue / EMS`,
      `Paramedicine, emergency vehicle extrication, structural firefighting, and hazardous materials response.`,
      '',
      `### 💼 Manfredi Enterprise & Civil Operations`,
      `Certified whitelisted civilian commerce and licensed private roleplay group.`
    ].join('\n');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('dept_wvsp').setLabel('WV State Police').setStyle(ButtonStyle.Primary).setEmoji('⭐'),
      new ButtonBuilder().setCustomId('dept_kcso').setLabel('Kanawha County SO').setStyle(ButtonStyle.Secondary).setEmoji('🌟'),
      new ButtonBuilder().setCustomId('dept_fire').setLabel('Fire & EMS').setStyle(ButtonStyle.Secondary).setEmoji('🚑'),
      new ButtonBuilder().setCustomId('dept_manfredi').setLabel('Enterprise').setStyle(ButtonStyle.Secondary).setEmoji('💼')
    );

    const container = createComponentsV2Container({
      type: 'departments',
      accentColor: 0x00A8FF,
      description: desc,
      actionRows: [row]
    });

    const payload = createV2MessagePayload(container);
    return context.reply(payload);
  }
};
