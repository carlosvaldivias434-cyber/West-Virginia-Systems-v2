import db from '../../../WVRP/bot/database/index.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
  name: 'blackjack',
  description: 'Play a hand of Blackjack (21) against the dealer for cash',
  category: 'Economy',
  permission: 'EVERYONE',
  aliases: ['blackjack', 'bj', '21'],
  usage: '-blackjack <amount>',
  slashData: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play a hand of Blackjack against the dealer')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true)),
  async execute(context, args = []) {
    const userId = (context.user || context.author).id;
    let acc = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!acc) {
      db.prepare('INSERT INTO economy (user_id, wallet, bank) VALUES (?, 1000, 5000)').run(userId);
      acc = { wallet: 1000, bank: 5000 };
    }

    const amount = context.options?.getInteger?.('amount') || parseInt(args[0] || '100', 10);
    if (amount <= 0 || isNaN(amount)) return context.reply({ content: '❌ Please bet a valid amount greater than $0.' });
    if (acc.wallet < amount) return context.reply({ content: `❌ Insufficient wallet cash! Wallet: **$${acc.wallet.toLocaleString()}**` });

    // Generate cards (Values 2-11)
    const draw = () => Math.min(10, Math.floor(Math.random() * 10) + 2);

    let playerHand = [draw(), draw()];
    let dealerHand = [draw(), draw()];

    const getScore = (hand) => {
      let sum = hand.reduce((a, b) => a + b, 0);
      return sum;
    };

    let playerScore = getScore(playerHand);
    let dealerScore = getScore(dealerHand);

    // Dealer draws if under 16
    while (dealerScore < 16) {
      dealerHand.push(draw());
      dealerScore = getScore(dealerHand);
    }

    let isWin = false;
    let isPush = false;
    let outcomeText = '';

    if (playerScore === 21 && playerHand.length === 2) {
      isWin = true;
      outcomeText = '🎉 **BLACKJACK! Natural 21!**';
    } else if (playerScore > 21) {
      isWin = false;
      outcomeText = '💥 **Bust! You exceeded 21.**';
    } else if (dealerScore > 21) {
      isWin = true;
      outcomeText = '🎉 **Dealer Busted! You win!**';
    } else if (playerScore > dealerScore) {
      isWin = true;
      outcomeText = '🎉 **You beat the dealer!**';
    } else if (playerScore === dealerScore) {
      isPush = true;
      outcomeText = '🤝 **Push (Tie)! Bet returned.**';
    } else {
      isWin = false;
      outcomeText = '💀 **Dealer won.**';
    }

    db.transaction(() => {
      if (isWin) {
        db.prepare('UPDATE economy SET wallet = wallet + ? WHERE user_id = ?').run(amount, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'BLACKJACK_WIN', amount, 'Blackjack win', Date.now());
      } else if (!isPush) {
        db.prepare('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?').run(amount, userId);
        db.prepare('INSERT INTO economy_transactions (user_id, type, amount, details, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run(userId, 'BLACKJACK_LOSS', amount, 'Blackjack loss', Date.now());
      }
    })();

    return context.reply({
      content: `🃏 **BLACKJACK TABLE**\n> 👤 **Your Hand:** [ ${playerHand.join(' + ')} ] = **${playerScore}**\n> 🏦 **Dealer Hand:** [ ${dealerHand.join(' + ')} ] = **${dealerScore}**\n\n${outcomeText}\n${isWin ? `💰 **Payout:** +$${(amount * 2).toLocaleString()}` : isPush ? '💰 **Bet Refunded.**' : `💸 **Loss:** -$${amount.toLocaleString()}`}`
    });
  }
};
