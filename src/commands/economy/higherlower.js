import db from '../../../WVRP/bot/database/index.js';
import { WvrpEmbedBuilder, BANNERS } from '../../../WVRP/bot/embeds/wvrpEmbeds.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'higherlower',
  description: 'Gamble on whether the next roll will be higher or lower',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['hl', 'higherlower', 'highlow'],
  usage: '-higherlower <bet> <higher|lower> or /higherlower bet:<amount> choice:<higher|lower>',
  slashData: new SlashCommandBuilder()
    .setName('higherlower')
    .setDescription('Bet if the next roll (1-100) will be higher or lower')
    .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true))
    .addStringOption(opt =>
      opt.setName('choice')
        .setDescription('Your prediction')
        .setRequired(true)
        .addChoices(
          { name: 'Higher', value: 'higher' },
          { name: 'Lower', value: 'lower' }
        )
    ),
  async execute(context, args = []) {
    const user = context.user || context.author;
    let bet = 0;
    let choice = '';

    if (context.options?.getInteger) {
      bet = context.options.getInteger('bet');
      choice = (context.options.getString('choice') || '').toLowerCase();
    } else {
      bet = parseInt(args[0], 10);
      choice = (args[1] || '').toLowerCase();
    }

    if (!bet || isNaN(bet) || bet <= 0) {
      return context.reply({ content: '❌ Please specify a valid bet amount greater than 0: `-higherlower <bet> <higher|lower>`' });
    }

    if (choice !== 'higher' && choice !== 'lower' && choice !== 'h' && choice !== 'l') {
      return context.reply({ content: '❌ Please choose either `higher` or `lower`: `-higherlower <bet> <higher|lower>`' });
    }

    const isHigher = choice === 'higher' || choice === 'h';

    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(user.id);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(user.id);
      acc = { wallet: 1000, bank: 5000 };
    }

    if (acc.wallet < bet) {
      return context.reply({ content: `❌ You do not have enough cash in your wallet! Wallet balance: **$${acc.wallet.toLocaleString()}**` });
    }

    const baseNumber = Math.floor(Math.random() * 80) + 10; // 10 to 89
    const nextNumber = Math.floor(Math.random() * 100) + 1; // 1 to 100

    const won = isHigher ? nextNumber > baseNumber : nextNumber < baseNumber;
    const isTie = nextNumber === baseNumber;

    let delta = 0;
    let newWallet = acc.wallet;

    if (isTie) {
      // Tie -> return bet
      delta = 0;
    } else if (won) {
      delta = Math.floor(bet * 0.85); // net win 85%
      newWallet += delta;
      db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(delta, user.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(user.id, 'GAMBLE_WIN', delta, `Higher/Lower win against ${baseNumber} with ${nextNumber}`, Date.now());
    } else {
      delta = -bet;
      newWallet -= bet;
      db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(bet, user.id);
      db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(user.id, 'GAMBLE_LOSS', bet, `Higher/Lower loss against ${baseNumber} with ${nextNumber}`, Date.now());
    }

    const title = won ? '🎉 Higher or Lower · You Won!' : isTie ? '⚖️ Higher or Lower · Push (Tie)!' : '💀 Higher or Lower · You Lost!';
    const desc = [
      `Base Number: **${baseNumber}**`,
      `Your Prediction: **${isHigher ? 'Higher ⬆️' : 'Lower ⬇️'}**`,
      `Next Roll: **${nextNumber}**`,
      '',
      isTie
        ? `Result: **Push!** Both numbers were identical. Your bet of **$${bet.toLocaleString()}** was returned.`
        : won
        ? `Result: **Won!** You profited **+$${delta.toLocaleString()}**!`
        : `Result: **Lost!** You lost **-$${bet.toLocaleString()}**.`,
      '',
      `💵 **New Wallet Balance:** $${newWallet.toLocaleString()}`
    ].join('\n');

    const embed = WvrpEmbedBuilder.createBase({
      title,
      description: desc,
      footerText: 'West Virginia Casino & Wagering'
    });
    embed.setImage(BANNERS.BOTTOM || 'https://wvrp-assets.local/banners/wvrp-banner-bottom.svg');

    return context.reply({ embeds: [embed] });
  }
};
