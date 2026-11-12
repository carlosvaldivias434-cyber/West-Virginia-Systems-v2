import dotenv from 'dotenv';
import db from '../database/index.js';
import { WvrpEmbedBuilder, getOrdinalSuffix } from '../embeds/wvrpEmbeds.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

dotenv.config();

export class WelcomeService {
  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    this.enabled = process.env.WELCOME_ENABLED !== 'false';
    this.channelId = process.env.WELCOME_CHANNEL_ID || '';
    this.showMemberCount = process.env.WELCOME_SHOW_MEMBER_COUNT !== 'false';
    this.verifyButton = process.env.WELCOME_VERIFY_BUTTON !== 'false';
    this.erlcButton = process.env.WELCOME_ERLC_BUTTON !== 'false';
    this.verifyUrl = process.env.WELCOME_VERIFY_URL || 'https://blox.link/verify';
    this.erlcJoinUrl = process.env.WELCOME_ERLC_JOIN_URL || 'https://policeroleplay.community/join/wvrp';
  }

  getConfig() {
    this.refreshConfig();
    return {
      enabled: this.enabled,
      channelId: this.channelId,
      showMemberCount: this.showMemberCount,
      verifyButton: this.verifyButton,
      erlcButton: this.erlcButton,
      verifyUrl: this.verifyUrl,
      erlcJoinUrl: this.erlcJoinUrl
    };
  }

  /**
   * Builds the action buttons for the welcome message:
   * 1. Show Members (Interactive button to view community stats)
   * 2. Verify (Opens configured Bloxlink verification destination)
   * 3. ER:LC Server (Opens configured WVRP join destination)
   */
  createWelcomeButtons(memberCount = 20028) {
    const row = new ActionRowBuilder();

    // 1. Show Members button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('welcome_show_members')
        .setLabel('Show Members')
        .setEmoji('👥')
        .setStyle(ButtonStyle.Secondary)
    );

    // 2. Verify button
    if (this.verifyButton) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('Verify')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Link)
          .setURL(this.verifyUrl)
      );
    }

    // 3. ER:LC Server button
    if (this.erlcButton) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('ER:LC Server')
          .setEmoji('🚨')
          .setStyle(ButtonStyle.Link)
          .setURL(this.erlcJoinUrl)
      );
    }

    return [row];
  }

  /**
   * Generates the welcome message payload (embeds + components)
   */
  generateWelcomePayload(member, memberCountOverride = null) {
    const memberCount = memberCountOverride || member.guild?.memberCount || 20028;
    const memberMention = `<@${member.id}>`;
    const username = member.user?.username || member.username || 'NewMember';
    const avatarUrl = typeof member.user?.displayAvatarURL === 'function'
      ? member.user.displayAvatarURL({ dynamic: true, size: 512 })
      : (member.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png');

    const accountCreated = member.user?.createdAt
      ? new Date(member.user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Recently';

    const joinedAt = member.joinedAt
      ? new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const embeds = WvrpEmbedBuilder.createWelcomeEmbed({
      memberMention,
      username,
      avatarUrl,
      memberCount,
      accountCreated,
      joinedAt
    });

    const components = this.createWelcomeButtons(memberCount);

    return {
      content: `👋 Welcome to **West Virginia State Roleplay**, ${memberMention}!`,
      embeds,
      components,
      memberCount,
      ordinal: getOrdinalSuffix(memberCount)
    };
  }

  /**
   * Discord guildMemberAdd event handler with deduplication & persistent storage
   */
  async handleMemberJoin(member) {
    this.refreshConfig();
    if (!this.enabled) return null;

    // Check deduplication (prevent duplicate welcomes within 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const existing = db.prepare('SELECT * FROM welcome_records WHERE user_id = ? AND created_at > ?').get(member.id, tenMinutesAgo);
    if (existing) {
      console.log(`Skipping duplicate welcome for ${member.id} within 10m window.`);
      return null;
    }

    const channelId = this.channelId;
    let targetChannel = null;

    if (channelId && member.guild?.channels?.cache) {
      targetChannel = member.guild.channels.cache.get(channelId);
    }

    // Fallback: look for channel named 'welcome', 'joins', or system channel
    if (!targetChannel && member.guild?.channels?.cache) {
      targetChannel = member.guild.channels.cache.find(c => 
        c.isTextBased() && (c.name.includes('welcome') || c.name.includes('join') || c.name.includes('general'))
      ) || member.guild.systemChannel;
    }

    const payload = this.generateWelcomePayload(member);

    let messageId = null;
    if (targetChannel && typeof targetChannel.send === 'function') {
      try {
        const sent = await targetChannel.send({
          content: payload.content,
          embeds: payload.embeds,
          components: payload.components
        });
        messageId = sent.id;
      } catch (err) {
        console.error('Failed to send welcome message to channel:', err.message);
      }
    }

    // Persist welcome record
    try {
      db.prepare(`
        INSERT INTO welcome_records (user_id, user_tag, member_count, channel_id, message_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        member.id,
        member.user?.tag || member.user?.username || member.username || 'Member',
        payload.memberCount,
        targetChannel?.id || channelId || 'SYSTEM',
        messageId || `sim_${Date.now()}`,
        Date.now()
      );
    } catch (e) {
      console.warn('Error saving welcome record to DB:', e.message);
    }

    return {
      success: true,
      sentToChannel: Boolean(targetChannel),
      channelName: targetChannel?.name || 'Unconfigured',
      memberCount: payload.memberCount,
      ordinal: payload.ordinal
    };
  }

  /**
   * Simulates a member join for testing from Web Dashboard or Discord test command
   */
  async simulateJoin({ userId = '2056966914', username = 'CarlosWVRP', memberCount = 20028 }) {
    const mockMember = {
      id: userId,
      username,
      user: {
        id: userId,
        username,
        tag: `${username}#0001`,
        createdAt: new Date('2022-04-12T10:00:00Z'),
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png'
      },
      joinedAt: new Date(),
      guild: {
        memberCount: memberCount
      }
    };

    const payload = this.generateWelcomePayload(mockMember, memberCount);

    // Save simulation record to DB
    db.prepare(`
      INSERT INTO welcome_records (user_id, user_tag, member_count, channel_id, message_id, created_at)
      VALUES (?, ?, ?, 'simulation_channel', ?, ?)
    `).run(userId, `${username}#0001`, memberCount, `sim_${Date.now()}`, Date.now());

    return {
      success: true,
      payload,
      memberCount,
      ordinal: payload.ordinal
    };
  }

  getRecentWelcomes(limit = 20) {
    return db.prepare('SELECT * FROM welcome_records ORDER BY created_at DESC LIMIT ?').all(limit);
  }
}

export const welcomeService = new WelcomeService();
export default welcomeService;
