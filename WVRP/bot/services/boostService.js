import dotenv from 'dotenv';
import db from '../database/index.js';
import { WvrpEmbedBuilder } from '../embeds/wvrpEmbeds.js';

dotenv.config();

export class BoostService {
  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    this.enabled = process.env.BOOST_ENABLED !== 'false';
    this.channelId = process.env.BOOST_CHANNEL_ID || '';
    this.showAvatar = process.env.BOOST_SHOW_MEMBER_AVATAR !== 'false';
    this.showCount = process.env.BOOST_SHOW_BOOST_COUNT !== 'false';
    this.showLevel = process.env.BOOST_SHOW_BOOST_LEVEL !== 'false';

    this.tagEnabled = process.env.TAG_NOTIFICATIONS_ENABLED !== 'false';
    this.tagChannelId = process.env.TAG_CHANNEL_ID || '';
    this.tagIdentifier = (process.env.TAG_IDENTIFIER || 'WVRP').toUpperCase();
  }

  getConfig() {
    this.refreshConfig();
    return {
      boostEnabled: this.enabled,
      boostChannelId: this.channelId,
      showAvatar: this.showAvatar,
      showCount: this.showCount,
      showLevel: this.showLevel,
      tagEnabled: this.tagEnabled,
      tagChannelId: this.tagChannelId,
      tagIdentifier: this.tagIdentifier
    };
  }

  /**
   * Generates boost notification payload
   */
  generateBoostPayload(member, boostLevel = 3, boostCount = 14) {
    const memberMention = `<@${member.id}>`;
    const username = member.user?.username || member.username || 'Booster';
    const avatarUrl = typeof member.user?.displayAvatarURL === 'function'
      ? member.user.displayAvatarURL({ dynamic: true, size: 512 })
      : (member.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/2.png');

    const embeds = WvrpEmbedBuilder.createBoostEmbed({
      memberMention,
      username,
      avatarUrl: this.showAvatar ? avatarUrl : undefined,
      boostLevel,
      boostCount
    });

    return {
      content: `🎉 **Massive thank you to ${memberMention} for boosting West Virginia State Roleplay!** 🚀`,
      embeds
    };
  }

  /**
   * Generates server tag notification payload
   */
  generateTagPayload(member, tag = 'WVRP') {
    const memberMention = `<@${member.id}>`;
    const username = member.user?.username || member.username || 'Supporter';
    const avatarUrl = typeof member.user?.displayAvatarURL === 'function'
      ? member.user.displayAvatarURL({ dynamic: true, size: 512 })
      : (member.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/3.png');

    const embeds = WvrpEmbedBuilder.createServerTagEmbed({
      memberMention,
      username,
      avatarUrl,
      tag
    });

    return {
      content: `🏷️ **Thank you ${memberMention} for repping WVRP!**`,
      embeds
    };
  }

  /**
   * Discord guildMemberUpdate event handler for boosts and server tags
   */
  async handleMemberUpdate(oldMember, newMember) {
    this.refreshConfig();

    // 1. Detect Server Boost
    // In Discord.js, premiumSince is null when not boosting, and a Date when boosting.
    const wasBoosting = Boolean(oldMember.premiumSince);
    const isBoosting = Boolean(newMember.premiumSince);

    if (!wasBoosting && isBoosting && this.enabled) {
      await this.processServerBoost(newMember);
    }

    // 2. Detect Server Tag in Nickname / Display Name
    // Checks if member equipped the WVRP tag (e.g. "[WVRP]", "WVRP |", or "WVRP" tag in nickname)
    if (this.tagEnabled) {
      const oldNick = (oldMember.nickname || oldMember.displayName || '').toUpperCase();
      const newNick = (newMember.nickname || newMember.displayName || '').toUpperCase();
      const tagId = this.tagIdentifier;

      const hadTag = oldNick.includes(tagId);
      const hasTag = newNick.includes(tagId);

      if (!hadTag && hasTag) {
        await this.processServerTag(newMember, tagId);
      }
    }
  }

  /**
   * Process and post server boost with deduplication
   */
  async processServerBoost(member) {
    // Deduplication within 1 hour
    const oneHourAgo = Date.now() - 3600 * 1000;
    const recent = db.prepare('SELECT * FROM boost_records WHERE user_id = ? AND created_at > ?').get(member.id, oneHourAgo);
    if (recent) return null;

    const guild = member.guild;
    const boostLevel = guild?.premiumTier || 3;
    const boostCount = guild?.premiumSubscriptionCount || 14;

    const targetChannel = this.getBoostChannel(guild);
    const payload = this.generateBoostPayload(member, boostLevel, boostCount);

    let messageId = null;
    if (targetChannel && typeof targetChannel.send === 'function') {
      try {
        const sent = await targetChannel.send({
          content: payload.content,
          embeds: payload.embeds
        });
        messageId = sent.id;
      } catch (err) {
        console.error('Failed to send boost thank-you:', err.message);
      }
    }

    db.prepare(`
      INSERT INTO boost_records (user_id, user_tag, boost_level, total_boosts, channel_id, message_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      member.id,
      member.user?.tag || member.user?.username || member.username || 'Booster',
      boostLevel,
      boostCount,
      targetChannel?.id || this.channelId || 'SYSTEM',
      messageId || `sim_${Date.now()}`,
      Date.now()
    );

    return { success: true, boostLevel, boostCount, channel: targetChannel?.name || 'Unconfigured' };
  }

  /**
   * Process and post server tag thank-you with deduplication
   */
  async processServerTag(member, tag) {
    // Deduplication within 24 hours
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    const recent = db.prepare('SELECT * FROM server_tag_records WHERE user_id = ? AND created_at > ?').get(member.id, dayAgo);
    if (recent) return null;

    const guild = member.guild;
    const targetChannel = this.getTagChannel(guild);
    const payload = this.generateTagPayload(member, tag);

    let messageId = null;
    if (targetChannel && typeof targetChannel.send === 'function') {
      try {
        const sent = await targetChannel.send({
          content: payload.content,
          embeds: payload.embeds
        });
        messageId = sent.id;
      } catch (err) {
        console.error('Failed to send server tag thank-you:', err.message);
      }
    }

    db.prepare(`
      INSERT INTO server_tag_records (user_id, user_tag, tag_detected, channel_id, message_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      member.id,
      member.user?.tag || member.user?.username || member.username || 'Supporter',
      tag,
      targetChannel?.id || this.tagChannelId || 'SYSTEM',
      messageId || `sim_${Date.now()}`,
      Date.now()
    );

    return { success: true, tag, channel: targetChannel?.name || 'Unconfigured' };
  }

  getBoostChannel(guild) {
    if (this.channelId && guild?.channels?.cache) {
      return guild.channels.cache.get(this.channelId);
    }
    if (guild?.channels?.cache) {
      return guild.channels.cache.find(c => 
        c.isTextBased() && (c.name.includes('boost') || c.name.includes('announcement') || c.name.includes('general'))
      ) || guild.systemChannel;
    }
    return null;
  }

  getTagChannel(guild) {
    if (this.tagChannelId && guild?.channels?.cache) {
      return guild.channels.cache.get(this.tagChannelId);
    }
    return this.getBoostChannel(guild);
  }

  /**
   * Simulation helpers for Web Studio & slash testing
   */
  async simulateBoost({ userId = '2056966914', username = 'CarlosWVRP', boostLevel = 3, boostCount = 14 }) {
    const mockMember = {
      id: userId,
      username,
      user: {
        id: userId,
        username,
        tag: `${username}#0001`,
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/4.png'
      }
    };

    const payload = this.generateBoostPayload(mockMember, boostLevel, boostCount);

    db.prepare(`
      INSERT INTO boost_records (user_id, user_tag, boost_level, total_boosts, channel_id, message_id, created_at)
      VALUES (?, ?, ?, ?, 'sim_boost_channel', ?, ?)
    `).run(userId, `${username}#0001`, boostLevel, boostCount, `sim_boost_${Date.now()}`, Date.now());

    return { success: true, payload, boostLevel, boostCount };
  }

  async simulateTag({ userId = '2056966914', username = 'CarlosWVRP', tag = 'WVRP' }) {
    const mockMember = {
      id: userId,
      username,
      user: {
        id: userId,
        username,
        tag: `${username}#0001`,
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/5.png'
      }
    };

    const payload = this.generateTagPayload(mockMember, tag);

    db.prepare(`
      INSERT INTO server_tag_records (user_id, user_tag, tag_detected, channel_id, message_id, created_at)
      VALUES (?, ?, ?, 'sim_tag_channel', ?, ?)
    `).run(userId, `${username}#0001`, tag, `sim_tag_${Date.now()}`, Date.now());

    return { success: true, payload, tag };
  }

  getRecentBoosts(limit = 20) {
    return db.prepare('SELECT * FROM boost_records ORDER BY created_at DESC LIMIT ?').all(limit);
  }

  getRecentTags(limit = 20) {
    return db.prepare('SELECT * FROM server_tag_records ORDER BY created_at DESC LIMIT ?').all(limit);
  }
}

export const boostService = new BoostService();
export default boostService;
