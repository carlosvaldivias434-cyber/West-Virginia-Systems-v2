import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  name: 'eco',
  description: 'Administrative economy manager (add, remove, set, reset)',
  category: 'Economy',
  permission: 'ADMINISTRATOR',
  aliases: ['eco', 'economymanage'],
  usage: '-eco <add|remove|set|reset|help> <@user> [wallet|bank] [amount]',
  slashData: new SlashCommandBuilder()
    .setName('eco')
    .setDescription('Administrative economy controls')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add money to user balance')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Wallet or Bank')
            .setRequired(true)
            .addChoices({ name: 'Wallet', value: 'wallet' }, { name: 'Bank', value: 'bank' })
        )
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to add').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove money from user balance')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Wallet or Bank')
            .setRequired(true)
            .addChoices({ name: 'Wallet', value: 'wallet' }, { name: 'Bank', value: 'bank' })
        )
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set user balance to specific amount')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Wallet or Bank')
            .setRequired(true)
            .addChoices({ name: 'Wallet', value: 'wallet' }, { name: 'Bank', value: 'bank' })
        )
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to set').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Reset user wallet and bank to default balances')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    ),
  async execute(context, args = []) {
    const isSlash = Boolean(context.options?.getSubcommand);
    let sub = '';
    let targetUser = null;
    let type = 'wallet';
    let amount = 0;

    if (isSlash) {
      sub = context.options.getSubcommand();
      targetUser = context.options.getUser('user');
      type = context.options.getString('type') || 'wallet';
      amount = context.options.getInteger('amount') || 0;
    } else {
      sub = (args[0] || 'help').toLowerCase();
      const rawUser = args[1];
      if (rawUser) {
        const id = rawUser.replace(/[<@!>]/g, '');
        if (context.guild?.members?.cache?.has(id)) {
          targetUser = context.guild.members.cache.get(id).user;
        } else {
          targetUser = { id, username: 'Unknown Member' };
        }
      }
      type = (args[2] || 'wallet').toLowerCase();
      amount = parseInt(args[3], 10) || 0;
    }

    if (sub === 'help' || !sub) {
      const helpEmbed = WvrpEmbedBuilder.createBase({
        title: '💼 Administrative Economy Management',
        description: [
          'Commands for authorized Server Management & Administrators:',
          '',
          '• `-eco add <@user> <wallet|bank> <amount>` — Deposit funds into member account',
          '• `-eco remove <@user> <wallet|bank> <amount>` — Deduct funds from member account',
          '• `-eco set <@user> <wallet|bank> <amount>` — Force set balance',
          '• `-eco reset <@user>` — Wipe balances back to default ($1,000 / $5,000)',
          '',
          '*All manual balance modifications are recorded in the central economy audit log.*'
        ].join('\n'),
        footerText: 'West Virginia Department of Treasury'
      });
      helpEmbed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');
      return context.reply({ embeds: [helpEmbed] });
    }

    if (!targetUser) {
      return context.reply({ content: '❌ Please specify a valid target user: `-eco <add|remove|set|reset> <@user>`' });
    }

    if (type !== 'wallet' && type !== 'bank') {
      type = 'wallet';
    }

    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(targetUser.id);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(targetUser.id);
      acc = { wallet: 1000, bank: 5000 };
    }

    const executor = context.user || context.author;
    const now = Date.now();
    let message = '';

    if (sub === 'add') {
      if (amount <= 0) return context.reply({ content: '❌ Amount must be greater than 0.' });
      db.prepare(`UPDATE economy SET ${type} = ${type} + ? WHERE user_id = ?`).run(amount, targetUser.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(targetUser.id, 'ADMIN_ADD', amount, `Added to ${type} by ${executor.tag || executor.username}`, now);
      message = `Added **+$${amount.toLocaleString()}** to <@${targetUser.id}>'s **${type}**.`;
    } else if (sub === 'remove') {
      if (amount <= 0) return context.reply({ content: '❌ Amount must be greater than 0.' });
      db.prepare(`UPDATE economy SET ${type} = MAX(0, ${type} - ?) WHERE user_id = ?`).run(amount, targetUser.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(targetUser.id, 'ADMIN_REMOVE', amount, `Deducted from ${type} by ${executor.tag || executor.username}`, now);
      message = `Removed **-$${amount.toLocaleString()}** from <@${targetUser.id}>'s **${type}**.`;
    } else if (sub === 'set') {
      if (amount < 0) return context.reply({ content: '❌ Amount cannot be negative.' });
      db.prepare(`UPDATE economy SET ${type} = ? WHERE user_id = ?`).run(amount, targetUser.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(targetUser.id, 'ADMIN_SET', amount, `Set ${type} to ${amount} by ${executor.tag || executor.username}`, now);
      message = `Set <@${targetUser.id}>'s **${type}** to **$${amount.toLocaleString()}**.`;
    } else if (sub === 'reset') {
      db.prepare('UPDATE economy SET wallet = 1000, bank = 5000 WHERE user_id = ?').run(targetUser.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(targetUser.id, 'ADMIN_RESET', 0, `Reset account by ${executor.tag || executor.username}`, now);
      message = `Reset <@${targetUser.id}>'s economy balance to default ($1,000 Wallet / $5,000 Bank).`;
    } else {
      return context.reply({ content: '❌ Unknown subcommand. Options: `add`, `remove`, `set`, `reset`, `help`.' });
    }

    const updated = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(targetUser.id);

    const embed = WvrpEmbedBuilder.createBase({
      title: '💼 Administrative Economy Action',
      description: `✅ ${message}\n\n• **Target:** <@${targetUser.id}>\n• **Authorized Admin:** <@${executor.id}>\n• **Updated Wallet:** \`$${updated.wallet.toLocaleString()}\`\n• **Updated Bank:** \`$${updated.bank.toLocaleString()}\`\n• **Total Net Worth:** \`$${(updated.wallet + updated.bank).toLocaleString()}\``,
      footerText: 'West Virginia Department of Treasury'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
