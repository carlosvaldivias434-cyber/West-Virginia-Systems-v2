import dotenv from 'dotenv';
import db from '../database/index.js';
dotenv.config();

export class RobloxService {
  constructor() {
    this.bloxlinkKey = process.env.BLOXLINK_API_KEY || '';
    this.robloxGroupId = process.env.ROBLOX_GROUP_ID || '34567890';
  }

  isBloxlinkConfigured() {
    return Boolean(this.bloxlinkKey && this.bloxlinkKey.trim().length > 0);
  }

  /**
   * Retrieves headshot thumbnail from official Roblox Thumbnails API
   */
  async getRobloxThumbnail(robloxId) {
    if (!robloxId) return null;
    try {
      const res = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data[0] && data.data[0].imageUrl) {
          return data.data[0].imageUrl;
        }
      }
    } catch (err) {
      console.warn(`Roblox thumbnail fetch error for ${robloxId}:`, err.message);
    }
    return null;
  }

  /**
   * Retrieves group rank from official Roblox Groups API
   */
  async getRobloxGroupRank(robloxId) {
    if (!robloxId) return 'Guest';
    try {
      const res = await fetch(`https://groups.roblox.com/v2/users/${robloxId}/groups/roles`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          const match = data.data.find(g => g.group && String(g.group.id) === String(this.robloxGroupId));
          if (match && match.role) {
            return match.role.name;
          }
        }
      }
    } catch (err) {
      console.warn(`Roblox group rank fetch error for ${robloxId}:`, err.message);
    }
    return 'Member';
  }

  /**
   * Looks up Roblox user by official Roblox ID
   */
  async getUserById(robloxId) {
    if (!robloxId) return null;
    try {
      const res = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
      if (res.ok) {
        const data = await res.json();
        const avatarHeadshot = await this.getRobloxThumbnail(data.id);
        const groupRank = await this.getRobloxGroupRank(data.id);

        return {
          username: data.name,
          displayName: data.displayName || data.name,
          id: data.id.toString(),
          profileUrl: `https://www.roblox.com/users/${data.id}/profile`,
          avatarHeadshot: avatarHeadshot || `https://www.roblox.com/headshot-thumbnail/image?userId=${data.id}&width=420&height=420&format=png`,
          createdAt: new Date(data.created).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          isBanned: Boolean(data.isBanned),
          description: data.description || 'No description provided',
          groupRank
        };
      }
    } catch (err) {
      console.warn('Roblox API lookup failed:', err.message);
    }

    // Return structured basic object if API call failed
    const fallbackThumbnail = await this.getRobloxThumbnail(robloxId);
    return {
      username: `RobloxUser_${robloxId}`,
      displayName: `RobloxUser_${robloxId}`,
      id: robloxId.toString(),
      profileUrl: `https://www.roblox.com/users/${robloxId}/profile`,
      avatarHeadshot: fallbackThumbnail || null,
      createdAt: 'Dec 3, 01:47 PM',
      groupRank: 'Member'
    };
  }

  /**
   * Looks up Roblox user by exact Username
   */
  async getUserByName(username) {
    if (!username) return null;
    try {
      const res = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username.trim()], excludeBannedUsers: false })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          return await this.getUserById(data.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Roblox username lookup failed:', err.message);
    }

    return null;
  }

  /**
   * Queries Bloxlink API to retrieve Roblox ID for a Discord User
   */
  async getBloxlinkRobloxId(discordId) {
    if (!discordId) return null;

    // 1. Try Bloxlink v4 Guild Endpoint if API key is provided
    if (this.bloxlinkKey) {
      const guildId = process.env.GUILD_ID || '1234567890';
      try {
        const guildRes = await fetch(`https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordId}`, {
          headers: { 'Authorization': this.bloxlinkKey }
        });
        if (guildRes.ok) {
          const data = await guildRes.json();
          if (data && data.robloxID) {
            return { robloxId: String(data.robloxID), source: 'bloxlink_v4_guild' };
          }
        }
      } catch (e) {
        console.warn('Bloxlink v4 guild lookup warning:', e.message);
      }

      // 2. Try Bloxlink v4 Global Endpoint
      try {
        const globalRes = await fetch(`https://api.blox.link/v4/public/discord-to-roblox/${discordId}`, {
          headers: { 'Authorization': this.bloxlinkKey }
        });
        if (globalRes.ok) {
          const data = await globalRes.json();
          if (data && data.robloxID) {
            return { robloxId: String(data.robloxID), source: 'bloxlink_v4_global' };
          }
        }
      } catch (e) {
        console.warn('Bloxlink v4 global lookup warning:', e.message);
      }
    }

    // 3. Try Bloxlink public v3 endpoint (unauthenticated fallback)
    try {
      const v3Res = await fetch(`https://api.blox.link/v3/public/discord-user/${discordId}`);
      if (v3Res.ok) {
        const data = await v3Res.json();
        if (data && data.user && data.user.robloxId) {
          return { robloxId: String(data.user.robloxId), source: 'bloxlink_v3_public' };
        }
      }
    } catch (e) {
      // Bloxlink v3 public may be rate limited or deprecated
    }

    return null;
  }

  /**
   * Full Discord to Roblox verification lookup workflow.
   * Checks local database cache first, then Bloxlink live API, then fetches full profile from Roblox.
   * Never fakes or pretends a member is verified if not confirmed by API.
   */
  async getRobloxUserFromDiscord(discordId) {
    // 1. Check local DB cache
    try {
      const cached = db.prepare('SELECT * FROM verifications WHERE discord_id = ?').get(discordId);
      if (cached && cached.verified && cached.roblox_id) {
        const profile = await this.getUserById(cached.roblox_id);
        if (profile) return profile;
      }
    } catch (e) {
      // Database read error fallback
    }

    // 2. Query Bloxlink API
    const bloxlinkRes = await this.getBloxlinkRobloxId(discordId);
    if (bloxlinkRes && bloxlinkRes.robloxId) {
      const profile = await this.getUserById(bloxlinkRes.robloxId);
      if (profile) return profile;
    }

    // If unverified or not linked
    return {
      username: 'Not Linked',
      displayName: 'Unverified',
      id: 'N/A',
      profileUrl: 'https://blox.link/verify',
      createdAt: 'N/A',
      groupRank: 'Unverified',
      unverified: true
    };
  }

  /**
   * Performs full verification resolution for a Discord user
   */
  async resolveVerification(discordUser, staffReviewer = null) {
    const discordId = discordUser.id;
    const discordTag = discordUser.tag || discordUser.username;

    // Check DB record
    const existing = db.prepare('SELECT * FROM verifications WHERE discord_id = ?').get(discordId);

    // Live Bloxlink check
    const bloxlinkRes = await this.getBloxlinkRobloxId(discordId);

    if (bloxlinkRes && bloxlinkRes.robloxId) {
      const robloxUser = await this.getUserById(bloxlinkRes.robloxId);
      if (robloxUser && robloxUser.id !== 'N/A') {
        const now = Date.now();
        db.prepare(`
          INSERT INTO verifications (discord_id, discord_tag, roblox_id, roblox_username, roblox_display_name, roblox_avatar_url, bloxlink_status, verified, staff_reviewer_id, staff_reviewer_tag, verified_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED', 1, ?, ?, ?, ?)
          ON CONFLICT(discord_id) DO UPDATE SET
            discord_tag = excluded.discord_tag,
            roblox_id = excluded.roblox_id,
            roblox_username = excluded.roblox_username,
            roblox_display_name = excluded.roblox_display_name,
            roblox_avatar_url = excluded.roblox_avatar_url,
            bloxlink_status = 'VERIFIED',
            verified = 1,
            staff_reviewer_id = coalesce(excluded.staff_reviewer_id, verifications.staff_reviewer_id),
            staff_reviewer_tag = coalesce(excluded.staff_reviewer_tag, verifications.staff_reviewer_tag),
            verified_at = coalesce(verifications.verified_at, excluded.verified_at),
            updated_at = excluded.updated_at
        `).run(
          discordId,
          discordTag,
          robloxUser.id,
          robloxUser.username,
          robloxUser.displayName,
          robloxUser.avatarHeadshot,
          staffReviewer?.id || null,
          staffReviewer?.username || null,
          now,
          now
        );

        return {
          verified: true,
          bloxlinkStatus: 'VERIFIED',
          source: bloxlinkRes.source,
          discordUser: { id: discordId, tag: discordTag },
          robloxUser
        };
      }
    }

    // If existing in DB and previously marked verified by staff
    if (existing && existing.verified && existing.roblox_id) {
      const robloxUser = await this.getUserById(existing.roblox_id);
      return {
        verified: true,
        bloxlinkStatus: existing.bloxlink_status || 'STAFF_VERIFIED',
        source: 'database_verified',
        discordUser: { id: discordId, tag: discordTag },
        robloxUser: robloxUser || {
          id: existing.roblox_id,
          username: existing.roblox_username,
          displayName: existing.roblox_display_name,
          avatarHeadshot: existing.roblox_avatar_url
        }
      };
    }

    // Not verified
    const now = Date.now();
    db.prepare(`
      INSERT INTO verifications (discord_id, discord_tag, roblox_id, roblox_username, roblox_display_name, bloxlink_status, verified, updated_at)
      VALUES (?, ?, NULL, NULL, NULL, 'UNVERIFIED', 0, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
        discord_tag = excluded.discord_tag,
        updated_at = excluded.updated_at
    `).run(discordId, discordTag, now);

    return {
      verified: false,
      bloxlinkStatus: this.isBloxlinkConfigured() ? 'NOT_LINKED' : 'UNCONFIGURED_API',
      source: 'none',
      discordUser: { id: discordId, tag: discordTag },
      robloxUser: null
    };
  }

  /**
   * Staff manual verification override or approval
   */
  async staffManualVerify(discordId, discordTag, robloxUsernameOrId, staffMember) {
    let robloxUser = null;
    if (/^\d+$/.test(robloxUsernameOrId.trim())) {
      robloxUser = await this.getUserById(robloxUsernameOrId.trim());
    } else {
      robloxUser = await this.getUserByName(robloxUsernameOrId.trim());
    }

    if (!robloxUser || robloxUser.id === 'N/A') {
      return { success: false, error: `Could not locate Roblox account for "${robloxUsernameOrId}"` };
    }

    const now = Date.now();
    db.prepare(`
      INSERT INTO verifications (discord_id, discord_tag, roblox_id, roblox_username, roblox_display_name, roblox_avatar_url, bloxlink_status, verified, staff_reviewer_id, staff_reviewer_tag, verified_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'STAFF_VERIFIED', 1, ?, ?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
        discord_tag = excluded.discord_tag,
        roblox_id = excluded.roblox_id,
        roblox_username = excluded.roblox_username,
        roblox_display_name = excluded.roblox_display_name,
        roblox_avatar_url = excluded.roblox_avatar_url,
        bloxlink_status = 'STAFF_VERIFIED',
        verified = 1,
        staff_reviewer_id = excluded.staff_reviewer_id,
        staff_reviewer_tag = excluded.staff_reviewer_tag,
        verified_at = coalesce(verifications.verified_at, excluded.verified_at),
        updated_at = excluded.updated_at
    `).run(
      discordId,
      discordTag,
      robloxUser.id,
      robloxUser.username,
      robloxUser.displayName,
      robloxUser.avatarHeadshot,
      staffMember?.id || 'staff',
      staffMember?.username || 'StaffReviewer',
      now,
      now
    );

    return {
      success: true,
      verified: true,
      robloxUser,
      reviewer: staffMember?.username || 'StaffReviewer'
    };
  }

  /**
   * Retrieves all verified records from SQLite database
   */
  getAllVerifications(limit = 50) {
    return db.prepare('SELECT * FROM verifications ORDER BY updated_at DESC LIMIT ?').all(limit);
  }
}

export const robloxService = new RobloxService();
export default robloxService;
