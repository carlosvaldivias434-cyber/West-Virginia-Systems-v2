import db from '../database/index.js';
import robloxService from './robloxService.js';
import cookieTranscriptService from './cookieTranscriptService.js';
import {
  WvrpEmbedBuilder,
  BANNERS,
  createTicketWelcomeV2,
  createTicketClosureLogV2
} from '../embeds/wvrpEmbeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';

export class TicketService {
  /**
   * Check if a member is blacklisted from opening tickets
   */
  isBlacklisted(userId) {
    const bl = db.prepare("SELECT * FROM blacklists WHERE user_id = ? AND type = 'TICKET'").get(userId);
    return bl || null;
  }

  /**
   * Check if member already has an open ticket
   */
  hasOpenTicket(userId) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE user_id = ? AND status = 'OPEN'").get(userId);
    return ticket || null;
  }

  /**
   * Create an actual private Discord ticket channel
   */
  async createTicketChannel(guild, user, categoryName = 'General Support', initialInquiry = 'General member inquiry') {
    // 1. Blacklist check
    const bl = this.isBlacklisted(user.id);
    if (bl) {
      return {
        success: false,
        error: `🚫 You are blacklisted from opening support tickets.\n> **Reason:** ${bl.reason}\n> **Blacklisted By:** <@${bl.issuer_id}>`
      };
    }

    // 2. Duplicate check
    const existingTicket = this.hasOpenTicket(user.id);
    if (existingTicket) {
      return {
        success: false,
        error: `⚠️ You already have an open ticket (<#${existingTicket.channel_id || existingTicket.id}>). Please use your existing ticket or close it before opening a new one.`
      };
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
    const ticketId = String(count + 1).padStart(4, '0');
    const channelName = `ticket-${ticketId}`;

    let channel = null;

    // 3. Create private Discord text channel with strict overwrites
    if (guild && guild.channels?.create) {
      try {
        const ticketCategory = guild.channels.cache.find(
          c => c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes('ticket') || c.name.toLowerCase().includes('support'))
        );

        const permissionOverwrites = [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks
            ]
          }
        ];

        // Add staff roles permissions
        const staffRoles = guild.roles.cache.filter(r =>
          r.name.toLowerCase().includes('staff') ||
          r.name.toLowerCase().includes('support') ||
          r.name.toLowerCase().includes('mod') ||
          r.name.toLowerCase().includes('admin')
        );
        for (const [_, role] of staffRoles) {
          permissionOverwrites.push({
            id: role.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.EmbedLinks]
          });
        }

        // Add bot self permission
        if (guild.client?.user?.id) {
          permissionOverwrites.push({
            id: guild.client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages]
          });
        }

        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: ticketCategory ? ticketCategory.id : null,
          permissionOverwrites,
          reason: `Support Ticket opened by ${user.tag || user.username} (${categoryName})`
        });
      } catch (err) {
        console.warn(`Discord channel creation fallback (Simulation Mode):`, err.message);
      }
    }

    const channelId = channel ? channel.id : `ticket_chan_${ticketId}`;
    const now = Date.now();

    // 4. Resolve Roblox profile via Bloxlink
    const robloxUser = await robloxService.getRobloxUserFromDiscord(user.id);

    // 5. Save to database
    db.prepare(`
      INSERT INTO tickets (id, channel_id, user_id, user_tag, roblox_username, roblox_id, category, inquiry, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `).run(
      ticketId,
      channelId,
      user.id,
      user.tag || user.username,
      robloxUser.username,
      robloxUser.id,
      categoryName,
      initialInquiry,
      now
    );

    // 6. Build official Components V2 greeting container with Top & Bottom banners and 6 working buttons
    const v2Payload = createTicketWelcomeV2({
      ticketId,
      category: categoryName,
      creator: user,
      assignedStaffRole: 'Support Team',
      initialInquiry,
      robloxUser
    });

    if (channel && channel.send) {
      await channel.send({ content: `<@${user.id}> @here`, ...v2Payload });
    }

    return {
      success: true,
      ticketId,
      channelId,
      channel,
      category: categoryName
    };
  }

  /**
   * Claim an active ticket
   */
  claimTicket(ticketIdOrChannelId, staffUser) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? OR channel_id = ?').get(ticketIdOrChannelId, ticketIdOrChannelId);
    if (!ticket) return { success: false, error: 'Ticket not found' };

    if (ticket.claimed_by && ticket.claimed_by !== (staffUser.tag || staffUser.username)) {
      return { success: false, error: `This ticket is already claimed by @${ticket.claimed_by}.` };
    }

    db.prepare('UPDATE tickets SET claimed_by = ? WHERE id = ?').run(staffUser.tag || staffUser.username, ticket.id);
    return { success: true, claimedBy: staffUser.tag || staffUser.username, ticketId: ticket.id };
  }

  /**
   * Unclaim an active ticket
   */
  unclaimTicket(ticketIdOrChannelId) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? OR channel_id = ?').get(ticketIdOrChannelId, ticketIdOrChannelId);
    if (!ticket) return { success: false, error: 'Ticket not found' };

    db.prepare('UPDATE tickets SET claimed_by = NULL WHERE id = ?').run(ticket.id);
    return { success: true, ticketId: ticket.id };
  }

  /**
   * Add a member to the ticket channel
   */
  async addMemberToTicket(ticketIdOrChannelId, channel, targetUserId, executor) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? OR channel_id = ?').get(ticketIdOrChannelId, ticketIdOrChannelId);
    if (!ticket) return { success: false, error: 'Ticket not found' };

    if (channel && channel.permissionOverwrites?.edit) {
      try {
        await channel.permissionOverwrites.edit(targetUserId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true,
          EmbedLinks: true
        });
      } catch (err) {
        console.warn(`Channel permission overwrite edit fallback:`, err.message);
      }
    }

    return { success: true, ticketId: ticket.id, targetUserId };
  }

  /**
   * Remove a member from the ticket channel
   */
  async removeMemberFromTicket(ticketIdOrChannelId, channel, targetUserId, executor) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? OR channel_id = ?').get(ticketIdOrChannelId, ticketIdOrChannelId);
    if (!ticket) return { success: false, error: 'Ticket not found' };

    if (channel && channel.permissionOverwrites?.delete) {
      try {
        await channel.permissionOverwrites.delete(targetUserId);
      } catch (err) {
        console.warn(`Channel permission delete fallback:`, err.message);
      }
    }

    return { success: true, ticketId: ticket.id, targetUserId };
  }

  /**
   * Rename the ticket channel
   */
  async renameTicket(ticketIdOrChannelId, channel, rawName, executor) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? OR channel_id = ?').get(ticketIdOrChannelId, ticketIdOrChannelId);
    if (!ticket) return { success: false, error: 'Ticket not found' };

    const sanitized = (rawName || 'ticket').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
    const finalName = sanitized.startsWith('ticket-') ? sanitized : `ticket-${sanitized}`;

    if (channel && channel.setName) {
      try {
        await channel.setName(finalName, `Ticket renamed by ${executor.tag || executor.username}`);
      } catch (err) {
        console.warn(`Channel setName fallback:`, err.message);
      }
    }

    return { success: true, ticketId: ticket.id, newName: finalName };
  }

  /**
   * Close ticket and generate transcript
   */
  async closeTicket(ticketIdOrChannelId, closerUser, guild = null) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? OR channel_id = ?').get(ticketIdOrChannelId, ticketIdOrChannelId);
    const now = Date.now();

    const transcriptRes = await cookieTranscriptService.generateTranscript(ticket?.id || '0001', closerUser);

    if (ticket) {
      db.prepare(`
        UPDATE tickets
        SET status = 'CLOSED', closed_at = ?, closed_by = ?, transcript_url = ?
        WHERE id = ?
      `).run(now, closerUser.tag || closerUser.username, transcriptRes.url, ticket.id);
    }

    const durationMins = ticket ? Math.max(1, Math.round((now - ticket.created_at) / 60000)) : 15;

    const payload = createTicketClosureLogV2({
      ticketId: ticket?.id || '0001',
      category: ticket?.category || 'General Support',
      handledBy: ticket?.claimed_by ? { username: ticket.claimed_by } : closerUser,
      closedBy: closerUser,
      openedAt: ticket?.created_at || (now - 3600000),
      closedAt: now,
      duration: `${durationMins}m`,
      messageCount: transcriptRes.messageCount,
      transcriptUrl: transcriptRes.url
    });

    // Send to transcript log channel
    const logChannelId = process.env.TRANSCRIPT_LOG_CHANNEL_ID || process.env.TICKET_TRANSCRIPT_CHANNEL_ID || process.env.STAFF_LOG_CHANNEL_ID;
    if (guild && logChannelId) {
      try {
        const chan = guild.channels?.cache?.get(logChannelId) || (await guild.channels?.fetch(logChannelId).catch(() => null));
        if (chan && typeof chan.send === 'function') {
          await chan.send(payload);
        }
      } catch (e) {
        console.warn(`[TicketService] Could not send transcript log to ${logChannelId}:`, e.message);
      }
    }

    return {
      success: true,
      ticketId: ticket?.id || '0001',
      durationMins,
      transcriptUrl: transcriptRes.url,
      payload
    };
  }

  /**
   * Reopen a closed ticket
   */
  reopenTicket(ticketIdOrChannelId, staffUser) {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? OR channel_id = ?').get(ticketIdOrChannelId, ticketIdOrChannelId);
    if (!ticket) return { success: false, error: 'Ticket not found' };

    db.prepare("UPDATE tickets SET status = 'OPEN', closed_at = NULL, closed_by = NULL WHERE id = ?").run(ticket.id);
    return { success: true, ticketId: ticket.id };
  }
}

export const ticketService = new TicketService();
export default ticketService;
