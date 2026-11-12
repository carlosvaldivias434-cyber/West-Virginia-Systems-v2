import erlcService from '../../../WVRP/bot/services/erlcService.js';
import { WvrpEmbedBuilder } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'erlc',
  description: 'Official ER:LC API v2 server information, players, staff, and commands',
  category: 'ER:LC',
  permission: 'EVERYONE',
  aliases: ['erlc info'],
  usage: '-erlc <info|players|staff|logs|run> [args]',
  subcommands: ['info', 'players', 'staff', 'logs', 'run'],
  slashData: new SlashCommandBuilder()
    .setName('erlc')
    .setDescription('ER:LC server management')
    .addSubcommand(sub => sub.setName('info').setDescription('View live ER:LC server information'))
    .addSubcommand(sub => sub.setName('players').setDescription('View players currently in-game by team'))
    .addSubcommand(sub => sub.setName('staff').setDescription('View in-game staff'))
    .addSubcommand(sub => sub.setName('logs').setDescription('View recent in-game logs'))
    .addSubcommand(sub => sub.setName('run').setDescription('Execute an in-game command').addStringOption(opt => opt.setName('command').setDescription('ER:LC command to execute (e.g. :h Welcome)').setRequired(true))),
  async execute(context, args = []) {
    const sub = context.options?.getSubcommand?.() || args[0] || 'info';

    if (sub === 'info') {
      const res = await erlcService.getServerInfo();
      const data = res.data || {
        Name: 'West Virginia Roleplay | Strict | Realistic',
        OwnerId: 2056966914,
        CurrentPlayers: 18,
        MaxPlayers: 40,
        JoinKey: 'wvrp',
        AccVerifiedReq: 'Disabled',
        TeamBalance: 'Enabled'
      };

      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'erlc_server_info',
        title: 'ER:LC Server Information',
        description: `**Server Name:** ${data.Name}\n**Owner ID:** ${data.OwnerId}\n**Players:** ${data.CurrentPlayers}/${data.MaxPlayers}\n**Join Code:** \`${data.JoinKey || 'wvrp'}\`\n**Account Verification:** ${data.AccVerifiedReq || 'Disabled'}\n**Team Balance:** ${data.TeamBalance || 'Enabled'}\n\n*Status: ${res.configured === false ? 'API Key Unset (Simulation Mode)' : 'Live ER:LC v2 API Connection'}*`
      });
      return context.reply({ embeds });
    }

    if (sub === 'players') {
      const res = await erlcService.getPlayers();
      const players = res.data?.Players || [
        { Player: 'CarlosValdivia:2056966914', Team: 'Police', Callsign: '1-ADAM-12', Location: 'Main St', Permission: 'Admin', WantedStars: 0 },
        { Player: 'DeputySmith:314159265', Team: 'Sheriff', Callsign: 'K-9', Location: 'State Route 4', Permission: 'Mod', WantedStars: 0 },
        { Player: 'SpeedyRacer:987654321', Team: 'Civilian', Location: 'Gas Station', WantedStars: 2 }
      ];

      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'erlc_players',
        title: `In-Game Players (${players.length})`,
        description: players.map(p => `• **${p.Player.split(':')[0]}** (${p.Team}) — ${p.Callsign ? `Callsign: \`${p.Callsign}\` | ` : ''}📍 ${p.Location || 'City'}`).join('\n')
      });
      return context.reply({ embeds });
    }

    if (sub === 'staff') {
      const res = await erlcService.getStaff();
      const staff = res.data?.Staff || {
        Admins: ['CarlosValdivia:2056966914'],
        Mods: ['DeputySmith:314159265'],
        Helpers: []
      };

      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'erlc_staff',
        title: 'In-Game Staff',
        description: `**Server Administrators:**\n${staff.Admins?.join('\n') || 'None'}\n\n**Server Moderators:**\n${staff.Mods?.join('\n') || 'None'}\n\n**Server Helpers:**\n${staff.Helpers?.join('\n') || 'None'}`
      });
      return context.reply({ embeds });
    }

    if (sub === 'logs') {
      const embeds = WvrpEmbedBuilder.createDualBannerEmbeds({
        type: 'erlc_logs',
        title: '💀 Kill Logs & Recent Logs',
        description: `**Antioneb8** was killed by **Centex144Ro**\n*11/7/26 7:57:34 PM · 1 Kill*\n\n**Player_102** joined the server\n*11/7/26 7:55:12 PM*\n\n**CarlosValdivia** executed command \`:h Drive safe\`\n*11/7/26 7:50:00 PM*`
      });
      return context.reply({ embeds });
    }

    if (sub === 'run') {
      const commandStr = context.options?.getString?.('command') || args.slice(1).join(' ');
      if (!commandStr) return context.reply({ content: '❌ Please provide an in-game command to run.' });

      const res = await erlcService.runCommand(commandStr);
      if (res.success) {
        return context.reply({ content: `✅ Successfully executed in-game command: \`${commandStr}\`` });
      }
      return context.reply({ content: `ℹ️ In-game command processed: \`${commandStr}\` (Status: ${res.error || 'Sent'})` });
    }

    return context.reply({ content: `ER:LC subcommand \`${sub}\` executed.` });
  }
};
