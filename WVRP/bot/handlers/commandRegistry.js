/**
 * WVRP Command Registry Bridge
 * Re-exports dynamic command registry and loader from src/commands/commandRegistry.js
 * Ensuring complete backward compatibility with all existing imports.
 */

export {
  commands,
  prefixCommands,
  registerCommand,
  loadCommands,
  checkPermission,
  getCategories,
  suggestSimilarCommands,
  formatUnknownCommandMessage,
  default
} from '../../../src/commands/commandRegistry.js';
