import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from './WVRP/bot/database/index.js';
import erlcService from './WVRP/bot/services/erlcService.js';
import groqService from './WVRP/bot/services/groqService.js';
import saplingService from './WVRP/bot/services/saplingService.js';
import cookieTranscriptService from './WVRP/bot/services/cookieTranscriptService.js';
import shiftService from './WVRP/bot/services/shiftService.js';
import robloxService from './WVRP/bot/services/robloxService.js';
import antiPingService from './WVRP/bot/services/antiPingService.js';
import afkService from './WVRP/bot/services/afkService.js';
import welcomeService from './WVRP/bot/services/welcomeService.js';
import boostService from './WVRP/bot/services/boostService.js';
import ticketWorkflowService, { WORKFLOW_TYPES, WORKFLOW_DEFINITIONS } from './WVRP/bot/services/ticketWorkflowService.js';
import departmentService from './WVRP/bot/services/departmentService.js';
import applicationService from './WVRP/bot/services/applicationService.js';
import ticketService from './WVRP/bot/services/ticketService.js';
import moderationService from './WVRP/bot/services/moderationService.js';
import { commands, prefixCommands, formatUnknownCommandMessage } from './WVRP/bot/handlers/commandRegistry.js';
import { WvrpEmbedBuilder, BANNERS, BANNER_MAPPINGS, resolveBanners, DEFAULT_LOCAL_BANNERS } from './WVRP/bot/embeds/wvrpEmbeds.js';
import { client } from './WVRP/index.js';

import cookieParser from 'cookie-parser';
import { runWebMigrations } from './server/db/index.js';
import { attachUser, verifyCsrf } from './server/auth.js';
import { webRouter } from './server/routes/webRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize web migrations
runWebMigrations();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET || 'wvrp-super-secure-cookie-key'));
app.use(attachUser);
app.use(verifyCsrf);

app.use(express.static(path.resolve('public')));
app.use('/transcripts', express.static(path.resolve('transcripts')));

// Mount comprehensive Web API routes
app.use('/api', webRouter);

// API: System & Bot Health Status
app.get('/api/status', (req, res) => {
  const getCount = (tbl: string) => {
    try {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${tbl}`).get() as any;
      return row ? row.count : 0;
    } catch {
      return 0;
    }
  };

  const tableCounts = {
    tickets: getCount('tickets'),
    infractions: getCount('infractions'),
    promotions: getCount('promotions'),
    shifts: getCount('staff_shifts'),
    activeShifts: getCount('staff_active_status'),
    applications: getCount('applications'),
    marketplaceListings: getCount('marketplace_listings'),
    economyUsers: getCount('economy'),
    antiPingStrikes: getCount('anti_ping_strikes'),
    antiPingLogs: getCount('anti_ping_logs'),
    afkUsers: getCount('afk_status WHERE is_afk = 1'),
    welcomeRecords: getCount('welcome_records'),
    boostRecords: getCount('boost_records'),
    tagRecords: getCount('server_tag_records'),
    verifications: getCount('verifications'),
    ticketWorkflows: getCount('ticket_automation_workflows'),
    autoResponses: getCount('ticket_auto_responses'),
    moderationCases: getCount('moderation_cases'),
    moderationBans: getCount("moderation_cases WHERE action_type = 'BAN'"),
    moderationKicks: getCount("moderation_cases WHERE action_type = 'KICK'"),
    moderationMutes: getCount("moderation_cases WHERE action_type = 'MUTE'"),
    moderationUnmutes: getCount("moderation_cases WHERE action_type = 'UNMUTE'"),
    activeMutes: getCount("moderation_cases WHERE action_type = 'MUTE' AND status = 'ACTIVE'")
  };

  res.json({
    botName: 'West Virginia Roleplay (WVRP)',
    prefix: process.env.DEFAULT_PREFIX || '-',
    discordConnected: Boolean(client?.isReady?.()),
    erlcConfigured: erlcService.isConfigured(),
    groqConfigured: groqService.isConfigured(),
    saplingConfigured: saplingService.isConfigured(),
    bloxlinkConfigured: robloxService.isBloxlinkConfigured(),
    cookieTranscriptConfigured: cookieTranscriptService.isConfigured(),
    databaseStats: tableCounts,
    commandsLoaded: commands.size,
    prefixTriggersLoaded: prefixCommands.size
  });
});

// API: WVRP Banner Configuration & Resolution System
app.get('/api/banners', (req, res) => {
  const envBanners: Record<string, string | undefined> = {};
  for (const key of Object.keys(process.env)) {
    if (key.includes('BANNER') || key === 'EMBED_COLOR') {
      envBanners[key] = process.env[key];
    }
  }

  const types = Object.keys(BANNER_MAPPINGS);
  const resolvedList = types.map((type) => {
    const mapping = (BANNER_MAPPINGS as any)[type];
    const resolved = resolveBanners(type);
    return {
      type,
      noTopBanner: Boolean(mapping.noTopBanner),
      specificTopEnv: mapping.specificTopEnv || null,
      systemTopEnv: mapping.systemTopEnv || null,
      specificBottomEnv: mapping.specificBottomEnv || null,
      systemBottomEnv: mapping.systemBottomEnv || null,
      resolvedTop: resolved.topBanner,
      resolvedBottom: resolved.bottomBanner,
      defaultTop: mapping.defaultTop || DEFAULT_LOCAL_BANNERS.TOP,
      defaultBottom: mapping.defaultBottom || DEFAULT_LOCAL_BANNERS.BOTTOM
    };
  });

  res.json({
    totalConfiguredTypes: types.length,
    envBanners,
    resolvedList,
    globalFallbacks: {
      TOP_BANNER_URL: process.env.TOP_BANNER_URL || null,
      BOTTOM_BANNER_URL: process.env.BOTTOM_BANNER_URL || null,
      EMBED_COLOR: process.env.EMBED_COLOR || '#00A8FF'
    }
  });
});

// API: Test Banner Resolution with Priority Breakdown
app.post('/api/banners/test', (req, res) => {
  const { type = 'community', overrideTop = null, overrideBottom = null } = req.body;
  const mapping = (BANNER_MAPPINGS as any)[type] || (BANNER_MAPPINGS as any).community;
  const resolved = resolveBanners(type, overrideTop, overrideBottom);

  let topSource = 'local_default';
  if (mapping.noTopBanner) {
    topSource = 'disabled_by_rule (noTopBanner: true)';
  } else if (overrideTop && overrideTop.trim().length > 0) {
    topSource = 'custom_override';
  } else if (mapping.specificTopEnv && process.env[mapping.specificTopEnv]) {
    topSource = `specific_env (${mapping.specificTopEnv})`;
  } else if (mapping.systemTopEnv && process.env[mapping.systemTopEnv]) {
    topSource = `system_env (${mapping.systemTopEnv})`;
  } else if (process.env.TOP_BANNER_URL) {
    topSource = 'global_fallback (TOP_BANNER_URL)';
  }

  let bottomSource = 'local_default';
  if (overrideBottom && overrideBottom.trim().length > 0) {
    bottomSource = 'custom_override';
  } else if (mapping.specificBottomEnv && process.env[mapping.specificBottomEnv]) {
    bottomSource = `specific_env (${mapping.specificBottomEnv})`;
  } else if (mapping.systemBottomEnv && process.env[mapping.systemBottomEnv]) {
    bottomSource = `system_env (${mapping.systemBottomEnv})`;
  } else if (process.env.BOTTOM_BANNER_URL) {
    bottomSource = 'global_fallback (BOTTOM_BANNER_URL)';
  }

  res.json({
    type,
    resolvedTop: resolved.topBanner,
    resolvedBottom: resolved.bottomBanner,
    topSource,
    bottomSource,
    noTopBanner: Boolean(mapping.noTopBanner)
  });
});

// API: Execute prefix or slash command
app.post('/api/command/execute', async (req, res) => {
  const { command, args = [], user = { id: '2056966914', username: 'carlos473', tag: 'Carlos473#0001' } } = req.body;
  
  const fullParts = (command || '').replace(/^[-/]/, '').trim().split(/ +/);
  const cleanCmd = (fullParts[0] || '').toLowerCase();
  const effectiveArgs = args && args.length > 0 ? args : fullParts.slice(1);
  const cmdObj = prefixCommands.get(cleanCmd) || commands.get(cleanCmd);

  if (!cmdObj) {
    const unknownText = formatUnknownCommandMessage(cleanCmd);
    return res.status(200).json({
      success: true,
      command: cleanCmd,
      output: { content: unknownText }
    });
  }

  let capturedReply = null;
  const mockContext = {
    user,
    author: user,
    channel: { id: 'channel_101', name: 'general-support-0850' },
    guild: { id: 'guild_wvrp', name: 'West Virginia Roleplay' },
    options: {
      getSubcommand: () => effectiveArgs[0] || '',
      getString: (key: string) => effectiveArgs[1] || '',
      getUser: () => (effectiveArgs[1] ? { id: effectiveArgs[1].replace(/[<@!>]/g, ''), username: 'TargetMember', tag: 'TargetMember#0001' } : null),
      getBoolean: () => true
    },
    reply: (payload: any) => {
      capturedReply = payload;
      return Promise.resolve(payload);
    }
  };

  try {
    await cmdObj.execute(mockContext, effectiveArgs);
    res.json({
      success: true,
      command: cleanCmd,
      output: capturedReply
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Shift Management
app.get('/api/shifts/active', (req, res) => {
  res.json(shiftService.getActiveShifts());
});

app.get('/api/shifts/leaderboard', (req, res) => {
  const page = parseInt(req.query.page as string || '1');
  res.json(shiftService.getLeaderboard(page, 10));
});

app.post('/api/shifts/action', (req, res) => {
  const { action, staffMember = { id: '2056966914', username: 'carlos473' }, shiftType = 'NORMAL' } = req.body;
  if (action === 'start') {
    return res.json(shiftService.startShift(staffMember, shiftType));
  } else if (action === 'break') {
    return res.json(shiftService.startBreak(staffMember));
  } else if (action === 'resume') {
    return res.json(shiftService.endBreak(staffMember));
  } else if (action === 'end') {
    return res.json(shiftService.endShift(staffMember));
  }
  res.status(400).json({ error: 'Unknown shift action' });
});

// API: ER:LC In-Game Chat Shift Command (;shift start, ;shift 50/50, ;shift break, ;shift end)
app.post('/api/erlc/ingame-shift', (req, res) => {
  const { robloxId = '2056966914', username = 'carlos473', command } = req.body;
  const result = shiftService.handleInGameChatCommand(robloxId, username, command);
  res.json(result);
});

// API: ER:LC Live Data
app.get('/api/erlc/data', async (req, res) => {
  const server = await erlcService.getServerInfo();
  const players = await erlcService.getPlayers();
  const staff = await erlcService.getStaff();
  const killLogs = await erlcService.getKillLogs();
  res.json({
    configured: erlcService.isConfigured(),
    server: server.data,
    players: players.data?.Players || [],
    staff: staff.data?.Staff || null,
    killLogs: killLogs.data?.KillLogs || []
  });
});

// ==========================================
// API: Moderation System Endpoints (Components V2)
// ==========================================
app.get('/api/moderation/stats', (req, res) => {
  const filter = (req.query.filter as string) || 'ALL';
  const userId = req.query.userId ? String(req.query.userId) : null;
  const stats = (moderationService as any).getStats(filter, userId);
  res.json(stats);
});

app.get('/api/moderation/cases', (req, res) => {
  const action = (req.query.action as string) || 'ALL';
  const limit = parseInt(req.query.limit as string || '50', 10);
  const page = parseInt(req.query.page as string || '1', 10);
  const cases = moderationService.getAllCases({ action, limit, page });
  res.json(cases);
});

app.get('/api/moderation/cases/:id', (req, res) => {
  const caseData = moderationService.getCase(req.params.id);
  if (!caseData) return res.status(404).json({ error: 'Case not found' });
  res.json(caseData);
});

app.get('/api/moderation/history/:userId', (req, res) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '10', 10);
  const history = moderationService.getHistory(req.params.userId, page, limit);
  res.json(history);
});

app.post('/api/moderation/action', async (req, res) => {
  try {
    const {
      action, // 'BAN' | 'KICK' | 'MUTE' | 'UNMUTE'
      targetUserId,
      targetUsername = 'Member',
      reason = 'Breaking community rules',
      duration = '10m',
      deleteDays = 0,
      moderator = { id: '2056966914', username: 'carlos473', tag: 'Carlos473#0001' }
    } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const cleanTargetId = String(targetUserId).replace(/[<@!>]/g, '').trim();
    const targetUser = { id: cleanTargetId, username: targetUsername, tag: `${targetUsername}#0001` };

    // Resolve guild and member if Discord client is active
    let guild = null;
    let targetMember = null;
    let moderatorMember = null;

    if (client?.guilds?.cache?.first()) {
      guild = client.guilds.cache.get(process.env.GUILD_ID || '') || client.guilds.cache.first();
      if (guild) {
        targetMember = guild.members.cache.get(cleanTargetId) || (await guild.members.fetch(cleanTargetId).catch(() => null));
        moderatorMember = guild.members.cache.get(moderator.id) || (await guild.members.fetch(moderator.id).catch(() => null));
      }
    }

    const act = (action || '').toUpperCase();
    let result: any = null;

    if (act === 'BAN') {
      result = await moderationService.executeBan({
        guild,
        targetUser,
        targetMember,
        moderatorUser: moderator,
        moderatorMember,
        reason,
        deleteDays: parseInt(String(deleteDays), 10) || 0,
        client
      });
    } else if (act === 'KICK') {
      // If targetMember is not in guild in dev/simulator mode, synthesize a mock member if client not logged in
      const effectiveMember = targetMember || (!client?.isReady?.() ? {
        id: cleanTargetId,
        user: targetUser,
        kickable: true,
        kick: async () => Promise.resolve()
      } : null);

      result = await moderationService.executeKick({
        guild,
        targetUser,
        targetMember: effectiveMember,
        moderatorUser: moderator,
        moderatorMember,
        reason,
        client
      });
    } else if (act === 'MUTE') {
      const effectiveMember = targetMember || (!client?.isReady?.() ? {
        id: cleanTargetId,
        user: targetUser,
        moderatable: true,
        timeout: async () => Promise.resolve()
      } : null);

      result = await moderationService.executeMute({
        guild,
        targetUser,
        targetMember: effectiveMember,
        moderatorUser: moderator,
        moderatorMember,
        durationStr: duration || '10m',
        reason,
        client
      });
    } else if (act === 'UNMUTE') {
      const effectiveMember = targetMember || (!client?.isReady?.() ? {
        id: cleanTargetId,
        user: targetUser,
        communicationDisabledUntilTimestamp: Date.now() + 600000,
        timeout: async () => Promise.resolve()
      } : null);

      result = await moderationService.executeUnmute({
        guild,
        targetUser,
        targetMember: effectiveMember,
        moderatorUser: moderator,
        moderatorMember,
        reason,
        client
      });
    } else {
      return res.status(400).json({ error: `Unknown action: ${action}. Supported: BAN, KICK, MUTE, UNMUTE` });
    }

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Infraction Appeals
app.get('/api/appeals', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.*, i.staff_tag, i.reason as infraction_reason, i.punishment as infraction_punishment
      FROM infraction_appeals a
      LEFT JOIN infractions i ON a.infraction_id = i.id
      ORDER BY a.created_at DESC LIMIT 50
    `).all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appeals/submit', async (req, res) => {
  try {
    const { infractionId, statement, user = { id: '2056966914', username: 'CarlosWVRP' } } = req.body;
    if (!infractionId || !statement) {
      return res.status(400).json({ error: 'infractionId and statement are required' });
    }
    const saplingRes = await saplingService.analyzeAnswers([statement]).catch(() => ({ score: 90, aiDetected: false, summary: 'Writing analyzed.' }));
    const appealId = `APL-${Date.now().toString().slice(-4)}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO infraction_appeals (id, infraction_id, user_id, user_tag, statement, sapling_score, sapling_ai_detected, sapling_summary, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      appealId,
      infractionId,
      user.id,
      user.username,
      statement,
      saplingRes.score || 90,
      saplingRes.aiDetected ? 1 : 0,
      saplingRes.summary || 'Grammar clear',
      now
    );

    res.json({ success: true, appealId, sapling: saplingRes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appeals/review', (req, res) => {
  try {
    const { appealId, decision, reviewer = { id: 'admin', username: 'HighCommand' }, reason = '' } = req.body;
    const appeal = db.prepare('SELECT * FROM infraction_appeals WHERE id = ?').get(appealId) as any;
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    const now = Date.now();
    if (decision === 'accept' || decision === 'APPROVED') {
      db.transaction(() => {
        db.prepare("UPDATE infractions SET status = 'REVOKED', revoked_by = ?, revoke_reason = ? WHERE id = ?")
          .run(reviewer.username, `Appeal accepted: ${reason || 'Approved by High Command'}`, appeal.infraction_id);
        db.prepare("UPDATE infraction_appeals SET status = 'ACCEPTED', reviewer_id = ?, reviewer_tag = ?, reviewed_at = ? WHERE id = ?")
          .run(reviewer.id, reviewer.username, now, appealId);
      })();
      return res.json({ success: true, decision: 'ACCEPTED', appealId });
    } else {
      db.prepare("UPDATE infraction_appeals SET status = 'DENIED', reviewer_id = ?, reviewer_tag = ?, reviewed_at = ? WHERE id = ?")
        .run(reviewer.id, reviewer.username, now, appealId);
      return res.json({ success: true, decision: 'DENIED', appealId, reason });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// API: Marketplace
app.get('/api/marketplace/listings', (req, res) => {
  const listings = db.prepare('SELECT * FROM marketplace_listings WHERE active = 1').all();
  res.json(listings);
});

app.post('/api/marketplace/order', (req, res) => {
  const { listingId, itemTitle, details = '', user = { id: '2056966914', username: 'Carlos473' } } = req.body;
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  db.prepare(`
    INSERT INTO marketplace_orders (id, customer_id, customer_tag, listing_id, item_title, status, details, created_at)
    VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)
  `).run(orderId, user.id, user.username, listingId, itemTitle, details, Date.now());

  res.json({ success: true, orderId });
});

// ==========================================
// API: Anti-Ping System Endpoints
// ==========================================
app.get('/api/antiping/config', (req, res) => {
  res.json(antiPingService.getConfig());
});

app.get('/api/antiping/records', (req, res) => {
  const strikes = db.prepare('SELECT * FROM anti_ping_strikes ORDER BY updated_at DESC LIMIT 50').all();
  const logs = antiPingService.getRecentLogs(30);
  res.json({ strikes, logs });
});

app.post('/api/antiping/action', (req, res) => {
  const { action, userId, count, staffTag = 'WebStaff' } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  if (action === 'reset') {
    const result = antiPingService.resetUserStrikes(userId, staffTag);
    return res.json(result);
  }
  if (action === 'set') {
    const result = antiPingService.setUserStrikes(userId, count || 0, staffTag);
    return res.json(result);
  }
  res.status(400).json({ error: 'Invalid action. Supported: reset, set' });
});

app.post('/api/antiping/simulate', async (req, res) => {
  const {
    userId = '1122334455',
    username = 'CuriousUser',
    team = 'Foundership Team',
    mockMessageContent = 'Hey @Foundership Team, when is session?'
  } = req.body;

  const mockMessage = {
    id: `sim_msg_${Date.now()}`,
    content: mockMessageContent,
    author: { id: userId, username, tag: `${username}#0001`, bot: false },
    member: {
      id: userId,
      roles: { cache: new Map() },
      permissions: { has: () => false },
      timeout: async (ms: number, reason: string) => {
        return Promise.resolve();
      }
    },
    guild: { id: 'wvrp_guild', channels: { cache: new Map() } },
    channel: {
      id: 'general_chat',
      send: async (payload: any) => Promise.resolve(payload)
    },
    deletable: true,
    delete: async () => Promise.resolve()
  };

  const detection = {
    detected: true,
    type: 'ROLE_MENTION',
    teamName: team,
    targetRoleId: 'role_foundership_999'
  };

  const result = await antiPingService.processViolation(mockMessage, detection);
  res.json(result);
});

// ==========================================
// API: AFK System Endpoints
// ==========================================
app.get('/api/afk/list', (req, res) => {
  const activeAfk = afkService.getActiveAfkUsers();
  const recentPings = db.prepare('SELECT * FROM afk_pings ORDER BY created_at DESC LIMIT 30').all();
  res.json({ activeAfk, recentPings, config: afkService.getConfig() });
});

app.post('/api/afk/set', async (req, res) => {
  const { userId = '2056966914', username = 'CarlosValdivia', reason = 'Taking a dinner break' } = req.body;
  const mockMember = {
    displayName: username,
    nickname: username,
    setNickname: async (newNick: string) => {
      mockMember.nickname = newNick;
      return Promise.resolve();
    }
  };
  const mockUser = { id: userId, username, tag: `${username}#0001` };

  const result = await afkService.setAfk(mockMember, mockUser, reason);
  res.json(result);
});

app.post('/api/afk/simulate-ping', async (req, res) => {
  const {
    afkUserId = '2056966914',
    pingerId = '9988776655',
    pingerUsername = 'OfficerDave',
    content = 'Hey @CarlosValdivia need backup on Main St'
  } = req.body;

  let capturedNotice: any = null;
  const mockMessage = {
    id: `msg_ping_${Date.now()}`,
    content,
    author: { id: pingerId, username: pingerUsername, tag: `${pingerUsername}#0001`, bot: false },
    mentions: {
      users: new Map([[afkUserId, { id: afkUserId, username: 'CarlosValdivia', displayName: 'CarlosValdivia' }]])
    },
    channel: {
      id: 'patrol_chat',
      name: 'patrol-comms',
      send: async (payload: any) => {
        capturedNotice = payload;
        return Promise.resolve(payload);
      }
    }
  };

  const responses = await afkService.handleMentions(mockMessage);
  res.json({ success: true, capturedNotice, responses });
});

app.post('/api/afk/simulate-return', async (req, res) => {
  const { userId = '2056966914', username = 'CarlosValdivia' } = req.body;

  let capturedWelcome: any = null;
  const mockMember = {
    displayName: `AFK | ${username}`,
    nickname: `AFK | ${username}`,
    setNickname: async (orig: string) => {
      mockMember.nickname = orig;
      return Promise.resolve();
    }
  };

  const mockMessage = {
    id: `msg_return_${Date.now()}`,
    content: 'Back from dinner!',
    author: { id: userId, username, tag: `${username}#0001`, bot: false },
    member: mockMember,
    channel: {
      id: 'general_chat',
      send: async (payload: any) => {
        capturedWelcome = payload;
        return Promise.resolve(payload);
      }
    }
  };

  const result = await afkService.handleReturn(mockMessage);
  res.json({ success: true, result, capturedWelcome });
});

// ==========================================
// API: Automatic Welcome System Endpoints
// ==========================================
app.get('/api/welcome/config', (req, res) => {
  res.json(welcomeService.getConfig());
});

app.get('/api/welcome/records', (req, res) => {
  res.json(welcomeService.getRecentWelcomes(40));
});

app.post('/api/welcome/simulate', async (req, res) => {
  const {
    userId = '2056966914',
    username = 'CarlosWVRP',
    memberCount = 20028
  } = req.body;

  const result = await welcomeService.simulateJoin({
    userId,
    username,
    memberCount: parseInt(memberCount, 10) || 20028
  });

  res.json(result);
});

// ==========================================
// API: Server Boost & Server Tag Endpoints
// ==========================================
app.get('/api/boost/config', (req, res) => {
  res.json(boostService.getConfig());
});

app.get('/api/boost/records', (req, res) => {
  res.json({
    boosts: boostService.getRecentBoosts(30),
    tags: boostService.getRecentTags(30)
  });
});

app.post('/api/boost/simulate', async (req, res) => {
  const {
    userId = '2056966914',
    username = 'CarlosWVRP',
    boostLevel = 3,
    boostCount = 14
  } = req.body;

  const result = await boostService.simulateBoost({
    userId,
    username,
    boostLevel: parseInt(boostLevel, 10) || 3,
    boostCount: parseInt(boostCount, 10) || 14
  });

  res.json(result);
});

app.post('/api/boost/simulate-tag', async (req, res) => {
  const {
    userId = '2056966914',
    username = 'CarlosWVRP',
    tag = 'WVRP'
  } = req.body;

  const result = await boostService.simulateTag({
    userId,
    username,
    tag
  });

  res.json(result);
});

// ==========================================
// API: Roblox & Bloxlink Verification Endpoints
// ==========================================
app.get('/api/verification/list', (req, res) => {
  res.json(robloxService.getAllVerifications(50));
});

app.post('/api/verification/lookup', async (req, res) => {
  const { query, type = 'discord_id' } = req.body;
  if (!query) return res.status(400).json({ error: 'Search query is required' });

  if (type === 'roblox_username') {
    const robloxUser = await robloxService.getUserByName(query);
    if (!robloxUser) return res.status(404).json({ error: `Roblox user "${query}" not found.` });
    return res.json({ verified: true, robloxUser });
  }

  // Discord ID lookup
  const mockUser = { id: query.replace(/[<@!>]/g, ''), username: 'MemberTarget' };
  const result = await robloxService.resolveVerification(mockUser);
  res.json(result);
});

app.post('/api/verification/manual-verify', async (req, res) => {
  const { discordId, discordTag = 'Member', robloxUsernameOrId, staffMember = { id: 'staff', username: 'WebStaff' } } = req.body;
  if (!discordId || !robloxUsernameOrId) {
    return res.status(400).json({ error: 'Discord ID and Roblox Username/ID are required' });
  }

  const result = await robloxService.staffManualVerify(discordId, discordTag, robloxUsernameOrId, staffMember);
  res.json(result);
});

// ==========================================
// API: Ticket Automation & Workflows Endpoints
// ==========================================
app.get('/api/workflows/definitions', (req, res) => {
  res.json(WORKFLOW_DEFINITIONS);
});

app.get('/api/workflows/history', (req, res) => {
  res.json({
    activeWorkflows: ticketWorkflowService.getActiveWorkflows(40),
    recentResponses: ticketWorkflowService.getRecentAutoResponses(40)
  });
});

app.post('/api/workflows/simulate', async (req, res) => {
  const { messageContent = 'Can I get a fast pass for my experience?', ticketId = '0850', user = { id: '2056966914', username: 'carlos473' } } = req.body;
  
  // Test both keyword and Groq context matching
  const keywordMatch = ticketWorkflowService.detectKeywordWorkflow(messageContent);
  const groqMatch = await ticketWorkflowService.detectGroqWorkflow(messageContent);

  const matched = groqMatch || keywordMatch;
  let payload = null;

  if (matched) {
    payload = ticketWorkflowService.generateWorkflowPayload(matched.type, user, ticketId);
  }

  res.json({
    messageContent,
    matched: Boolean(matched),
    detection: matched,
    keywordMatch,
    groqMatch,
    payload
  });
});

app.post('/api/workflows/manual-trigger', async (req, res) => {
  const { workflowType, ticketId = '0850', staffMember = { id: 'staff', username: 'WebStaff' } } = req.body;
  const result = await ticketWorkflowService.triggerManualWorkflow(ticketId, null, workflowType, staffMember);
  res.json(result);
});

// ==========================================
// API: Department Management & Rosters
// ==========================================
app.get('/api/departments', (req, res) => {
  const depts = (departmentService.getAllDepartments() || []) as any[];
  const enhanced = depts.map((d: any) => {
    const roster = departmentService.getRoster(d.id);
    let questions = [];
    try { questions = JSON.parse(d.questions_json || '[]'); } catch { questions = []; }
    return {
      ...d,
      questions,
      rosterCount: roster.length,
      roster
    };
  });
  res.json(enhanced);
});

app.get('/api/departments/:id', (req, res) => {
  const dept = departmentService.getDepartment(req.params.id) as any;
  if (!dept) return res.status(404).json({ error: 'Department not found' });
  const roster = departmentService.getRoster(dept.id);
  let questions = [];
  try { questions = JSON.parse(dept.questions_json || '[]'); } catch { questions = []; }
  res.json({ ...dept, questions, roster });
});

app.post('/api/departments', (req, res) => {
  const result = departmentService.createDepartment(req.body);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.put('/api/departments/:id', (req, res) => {
  const result = departmentService.editDepartment(req.params.id, req.body);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.delete('/api/departments/:id', (req, res) => {
  const result = departmentService.deleteDepartment(req.params.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/departments/:id/roster', (req, res) => {
  const { userId, userTag = 'Member', rank = 'Member', callsign = '' } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  const result = departmentService.addMemberToRoster(req.params.id, { id: userId, tag: userTag }, rank, callsign);
  res.json(result);
});

app.delete('/api/departments/:id/roster/:memberId', (req, res) => {
  const result = departmentService.removeMemberFromRoster(req.params.id, req.params.memberId);
  res.json(result);
});

// ==========================================
// API: Chain of Command Hierarchy
// ==========================================
app.get('/api/coc/:deptId?', (req, res) => {
  const deptId = req.params.deptId || 'staff';
  const hierarchy = departmentService.getChainOfCommand(deptId);
  res.json({ departmentId: deptId, hierarchy });
});

app.post('/api/coc', (req, res) => {
  const { departmentId = 'staff', rankOrder, rankTitle, holderUserId = '0', holderName = 'Officer', notes = '' } = req.body;
  if (!rankOrder || !rankTitle) {
    return res.status(400).json({ error: 'rankOrder and rankTitle are required' });
  }
  const result = departmentService.setChainOfCommandRank({
    departmentId,
    rankName: rankTitle,
    rankOrder: parseInt(rankOrder, 10) || 1,
    userId: holderUserId,
    userTag: holderName,
    positionTitle: notes || rankTitle,
    isLeadership: 1
  });
  res.json(result);
});

// ==========================================
// API: Applications Management
// ==========================================
app.get('/api/applications', (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY created_at DESC LIMIT 50').all();
  res.json(apps);
});

app.get('/api/applications/:id', (req, res) => {
  const appData = applicationService.getApplication(req.params.id) as any;
  if (!appData) return res.status(404).json({ error: 'Application not found' });
  const answers = applicationService.getAnswers(appData.id);
  res.json({ ...appData, answers });
});

app.post('/api/applications/create', async (req, res) => {
  const { userId = '2056966914', username = 'CarlosWVRP', departmentId = 'staff' } = req.body;
  const userMock = { id: userId, username, tag: `${username}#0001` };
  const session = await applicationService.createApplicationSession(null, userMock, departmentId);
  res.json(session);
});

app.post('/api/applications/answer', async (req, res) => {
  const { appId, questionIndex, answerText, userId = '2056966914', username = 'CarlosWVRP' } = req.body;
  if (!appId || questionIndex === undefined || !answerText) {
    return res.status(400).json({ error: 'appId, questionIndex, and answerText are required' });
  }
  const userMock = { id: userId, username, tag: `${username}#0001` };
  const result = await applicationService.recordAnswer(appId, parseInt(questionIndex, 10), answerText, userMock);
  res.json(result);
});

app.post('/api/applications/review', async (req, res) => {
  const { appId, action, reviewer = { id: 'admin', username: 'SuperAdmin' }, reason = '', notes = '' } = req.body;
  if (!appId || !action) return res.status(400).json({ error: 'appId and action are required' });

  if (action === 'accept') {
    const result = await applicationService.acceptApplication(appId, reviewer);
    return res.json(result);
  } else if (action === 'deny') {
    const result = await applicationService.denyApplication(appId, reviewer, reason || 'Did not meet requirements.');
    return res.json(result);
  } else if (action === 'interview') {
    const result = await applicationService.requestInterview(appId, reviewer, notes || 'Interview scheduled');
    return res.json(result);
  } else if (action === 'changes') {
    const result = await applicationService.requestChanges(appId, reviewer, notes || 'Please revise your scenario answers');
    return res.json(result);
  } else {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }
});

// ==========================================
// API: Support Tickets Management
// ==========================================
app.get('/api/tickets', (req, res) => {
  const tickets = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 50').all();
  res.json(tickets);
});

app.post('/api/tickets/create', async (req, res) => {
  const { userId = '2056966914', username = 'CarlosWVRP', category = 'General Support', inquiry = 'Inquiry from web portal' } = req.body;
  const userMock = { id: userId, username, tag: `${username}#0001` };
  const result = await ticketService.createTicketChannel(null, userMock, category, inquiry);
  res.json(result);
});

app.post('/api/tickets/:id/claim', (req, res) => {
  const { staffUser = { id: 'staff', username: 'StaffOfficer' } } = req.body;
  const result = ticketService.claimTicket(req.params.id, staffUser);
  res.json(result);
});

app.post('/api/tickets/:id/close', async (req, res) => {
  const { closerUser = { id: 'staff', username: 'StaffOfficer' } } = req.body;
  const result = await ticketService.closeTicket(req.params.id, closerUser);
  res.json(result);
});

// Vite Middleware integration for dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WVRP Server and Discord Hub running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
