import { PermissionFlagsBits } from 'discord.js';

export const commands = new Map();
export const prefixCommands = new Map();
export const categoriesSet = new Set();

/**
 * Check member staff / hierarchy permissions
 */
export function checkPermission(member, requiredLevel = 'EVERYONE') {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (requiredLevel === 'EVERYONE') return true;

  const roles = member.roles?.cache ? Array.from(member.roles.cache.values()).map(r => r.name.toLowerCase()) : [];
  
  if (requiredLevel === 'STAFF') {
    return roles.some(r => r.includes('staff') || r.includes('mod') || r.includes('admin') || r.includes('trainee'));
  }
  if (requiredLevel === 'HIGH_RANK') {
    return roles.some(r => r.includes('high rank') || r.includes('management') || r.includes('director') || r.includes('admin'));
  }
  if (requiredLevel === 'SENIOR_HIGH_RANK') {
    return roles.some(r => r.includes('senior high rank') || r.includes('directive') || r.includes('owner'));
  }
  return false;
}

/**
 * Register a validated command object into registry maps
 */
export function registerCommand(cmd) {
  if (!cmd || typeof cmd !== 'object') {
    throw new Error('registerCommand: Command definition must be an object.');
  }

  if (!cmd.name || typeof cmd.name !== 'string') {
    throw new Error('registerCommand: Command is missing a valid "name" string.');
  }

  if (!cmd.description || typeof cmd.description !== 'string') {
    throw new Error(`registerCommand [${cmd.name}]: Command is missing a "description" string.`);
  }

  if (typeof cmd.execute !== 'function') {
    throw new Error(`registerCommand [${cmd.name}]: Command must provide an "execute(context, args)" function.`);
  }

  // Prevent duplicate registration
  if (commands.has(cmd.name)) {
    console.warn(`[CommandRegistry] Warning: Command "${cmd.name}" is already registered. Updating registration.`);
  }

  const category = cmd.category || 'General';
  categoriesSet.add(category);

  commands.set(cmd.name, cmd);
  prefixCommands.set(cmd.name.toLowerCase(), cmd);

  if (Array.isArray(cmd.aliases)) {
    for (const alias of cmd.aliases) {
      if (alias && typeof alias === 'string') {
        prefixCommands.set(alias.toLowerCase(), cmd);
      }
    }
  }

  return cmd;
}

/**
 * Return all registered categories sorted alphabetically
 */
export function getCategories() {
  return Array.from(categoriesSet).sort();
}

/**
 * Levenshtein distance between two strings
 */
function levenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;
  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Suggest closest matching commands for unknown inputs
 */
export function suggestSimilarCommands(inputName, limit = 3) {
  const clean = (inputName || '').replace(/^[-/]/, '').toLowerCase();
  if (!clean) return [];

  const candidates = [];

  for (const cmd of commands.values()) {
    // Primary command
    const dist = levenshtein(clean, cmd.name.toLowerCase());
    const hasSubstr = cmd.name.toLowerCase().includes(clean) || clean.includes(cmd.name.toLowerCase());
    const score = dist - (hasSubstr ? 2 : 0);
    candidates.push({
      prefix: '-',
      name: cmd.name,
      desc: cmd.description,
      score
    });

    // Subcommands
    if (cmd.subcommands && Array.isArray(cmd.subcommands)) {
      for (const sub of cmd.subcommands) {
        const fullSub = `${cmd.name} ${sub}`;
        const subDist = levenshtein(clean, sub.toLowerCase());
        const fullDist = levenshtein(clean, fullSub.toLowerCase());
        const minSub = Math.min(subDist, fullDist);
        candidates.push({
          prefix: '/',
          name: `${cmd.name} ${sub}`,
          desc: `${cmd.name} ${sub} action`,
          score: minSub + 0.5
        });
      }
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  // Return unique candidates by name
  const seen = new Set();
  const results = [];
  for (const c of candidates) {
    if (!seen.has(c.name)) {
      seen.add(c.name);
      results.push(c);
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Format intelligent unknown command response message
 */
export function formatUnknownCommandMessage(cmdName) {
  const suggestions = suggestSimilarCommands(cmdName, 3);
  let suggestionLines = '';
  if (suggestions.length > 0) {
    suggestionLines = `\nDid you mean one of these?\n` + suggestions.map(s => `${s.prefix}${s.name} · ${s.desc}`).join('\n') + `\n\n`;
  }
  return `❌ Unknown Command\n-${cmdName} isn't a command.${suggestionLines}See every command with -commands.`;
}

export default {
  commands,
  prefixCommands,
  categoriesSet,
  checkPermission,
  registerCommand,
  getCategories,
  suggestSimilarCommands,
  formatUnknownCommandMessage
};
