import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  commands,
  prefixCommands,
  categoriesSet,
  registerCommand,
  checkPermission,
  getCategories,
  suggestSimilarCommands,
  formatUnknownCommandMessage
} from './registryStore.js';

export {
  commands,
  prefixCommands,
  categoriesSet,
  registerCommand,
  checkPermission,
  getCategories,
  suggestSimilarCommands,
  formatUnknownCommandMessage
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively find all command files within a directory
 */
export function discoverCommandFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(discoverCommandFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) &&
      !entry.name.endsWith('.d.ts') &&
      entry.name !== 'commandRegistry.js' &&
      entry.name !== 'registryStore.js'
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Automatically scan src/commands recursively and load every command module
 */
export async function loadCommands(baseDir = __dirname) {
  const commandFiles = discoverCommandFiles(baseDir);
  console.log(`[CommandLoader] Discovering commands in ${baseDir}... Found ${commandFiles.length} command files.`);

  let loadedCount = 0;
  for (const filePath of commandFiles) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const mod = await import(fileUrl);
      const commandObj = mod.default || mod.command || mod;

      if (!commandObj || typeof commandObj !== 'object' || !commandObj.name) {
        // Skip helper modules without a command name
        continue;
      }

      // Infer category from parent directory name if not explicitly set
      if (!commandObj.category) {
        const parentDir = path.basename(path.dirname(filePath));
        if (parentDir && parentDir !== 'commands') {
          commandObj.category = parentDir.charAt(0).toUpperCase() + parentDir.slice(1);
        }
      }

      registerCommand(commandObj);
      loadedCount++;
    } catch (err) {
      console.error(`[CommandLoader] Failed to load command at ${filePath}:`, err);
    }
  }

  console.log(`[CommandLoader] Successfully loaded ${loadedCount} primary commands and ${prefixCommands.size} triggers across ${getCategories().length} categories.`);
  return { commands, prefixCommands, count: loadedCount };
}

// Auto-load all commands on initial import
await loadCommands(__dirname);

export default {
  commands,
  prefixCommands,
  categoriesSet,
  registerCommand,
  loadCommands,
  checkPermission,
  getCategories
};
