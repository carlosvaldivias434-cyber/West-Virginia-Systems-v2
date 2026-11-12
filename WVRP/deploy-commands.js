import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { commands } from './bot/handlers/commandRegistry.js';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

console.log('--- West Virginia Roleplay (WVRP) Slash Command Deployment ---');
console.log(`Discovered ${commands.size} primary command modules in registry.`);

const slashPayload = [];
for (const [name, cmd] of commands.entries()) {
  if (cmd.slashData) {
    slashPayload.push(cmd.slashData.toJSON());
  }
}

console.log(`Prepared ${slashPayload.length} application (slash) commands for deployment.`);

if (!token || !clientId) {
  console.log('⚠️ DISCORD_TOKEN or CLIENT_ID is not configured in .env.');
  console.log('Skipping live REST deployment to Discord gateway. All commands are validated and ready.');
  process.exit(0);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${slashPayload.length} application (/) commands.`);

    let data;
    if (guildId) {
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: slashPayload }
      );
      console.log(`✅ Successfully reloaded ${data.length} guild application (/) commands for Guild ${guildId}.`);
    } else {
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: slashPayload }
      );
      console.log(`✅ Successfully reloaded ${data.length} global application (/) commands.`);
    }
  } catch (error) {
    console.error('❌ Error during slash command deployment:', error);
  }
})();
