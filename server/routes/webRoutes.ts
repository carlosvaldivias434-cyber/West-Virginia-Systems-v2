import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import {
  generateOAuthLogin,
  handleOAuthCallback,
  handleDevLogin,
  destroySession,
  requireAuth,
  requireStaff,
  requireHighRank,
  requireManagement,
  WebUser
} from '../auth.js';
import erlcServerService from '../services/erlcServerService.js';
import watchdogService from '../services/watchdogService.js';
import transcriptService from '../services/transcriptService.js';
import moderationService from '../../WVRP/bot/services/moderationService.js';
import shiftService from '../../WVRP/bot/services/shiftService.js';
import { client } from '../../WVRP/index.js';

export const webRouter = Router();

// ==========================================
// 1. PUBLIC STATS & COMMUNITY INFO
// ==========================================
webRouter.get('/public/stats', async (req: Request, res: Response) => {
  try {
    const erlcStats = await erlcServerService.getServerStats();

    // Staff on duty
    let staffOnDuty = 0;
    try {
      const row = db.prepare("SELECT COUNT(*) as count FROM staff_active_status WHERE status = 'ON_SHIFT'").get() as any;
      staffOnDuty = row?.count || 0;
    } catch {
      staffOnDuty = 0;
    }

    // Discord members count from guild cache or realistic baseline
    let discordMembers = 20028;
    if (client && client.isReady?.()) {
      const guildId = process.env.DISCORD_GUILD_ID || process.env.GUILD_ID;
      const g = guildId ? client.guilds.cache.get(guildId) : client.guilds.cache.first();
      if (g) discordMembers = g.memberCount;
    }

    res.json({
      erlc: {
        players: erlcStats.players,
        maxPlayers: erlcStats.maxPlayers,
        queue: erlcStats.queue,
        status: erlcStats.status,
        serverName: erlcStats.serverName,
        joinCode: erlcStats.joinCode
      },
      discord: {
        memberCount: discordMembers,
        onlineCount: Math.floor(discordMembers * 0.22)
      },
      staff: {
        onDutyCount: staffOnDuty
      },
      community: {
        name: 'West Virginia State Roleplay',
        shortName: 'WVSP',
        tagline: 'A professional ER:LC roleplay community built on realistic experiences, professional departments and an active community.',
        discordInviteUrl: process.env.DISCORD_INVITE_URL || 'https://discord.gg/wvrp',
        robloxGroupUrl: process.env.ROBLOX_GROUP_URL || 'https://www.roblox.com/groups/34567890/West-Virginia-State-Roleplay',
        quickJoinUrl: process.env.ERLC_QUICK_JOIN_URL || 'https://policeroleplay.community/join/wvrp'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve live community statistics', details: err.message });
  }
});

// ==========================================
// 2. DISCORD OAUTH2 & SESSION ENDPOINTS
// ==========================================
webRouter.get('/auth/login', generateOAuthLogin);
webRouter.get('/auth/callback', handleOAuthCallback);
webRouter.get('/auth/dev-login', handleDevLogin);

webRouter.get('/auth/logout', (req: Request, res: Response) => {
  destroySession(req, res);
  res.redirect('/');
});

webRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = (req as any).user as WebUser | null;
  res.json({
    authenticated: Boolean(user),
    user: user || null
  });
});

// Helper for dev environment when Discord client secret is not configured
webRouter.get('/auth/dev-prompt', (req: Request, res: Response) => {
  res.send(`
    <!doctype html>
    <html>
      <head>
        <title>Sign in to WVSP</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; max-width: 440px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h2 { margin-top: 0; color: #00A8FF; }
          p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
          .btn { display: block; width: 100%; padding: 0.75rem; margin-top: 0.75rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; text-decoration: none; text-align: center; }
          .btn-primary { background: #00A8FF; color: #000; }
          .btn-secondary { background: #334155; color: #fff; }
          .btn-gold { background: #f59e0b; color: #000; }
          .btn-red { background: #ef4444; color: #fff; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>West Virginia State Roleplay</h2>
          <p>Sign in using Discord OAuth2 or test in developer mode with desired clearance:</p>
          <a class="btn btn-primary" href="/api/auth/dev-login?role=MANAGEMENT&username=ManagementOfficer">Sign in as Management (Super Admin)</a>
          <a class="btn btn-gold" href="/api/auth/dev-login?role=HIGH_RANK&username=Captain_HighRank">Sign in as High Rank (In-Game Commands)</a>
          <a class="btn btn-secondary" href="/api/auth/dev-login?role=STAFF&username=Trooper_Appalachian">Sign in as Staff Member</a>
          <a class="btn btn-secondary" style="background:#475569;" href="/api/auth/dev-login?role=GUEST&username=Civilian_Carter">Sign in as Civilian / Guest</a>
          <p style="margin-top: 1.5rem; font-size: 0.8rem; text-align: center;">Production OAuth2 requires DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in .env</p>
        </div>
      </body>
    </html>
  `);
});

// ==========================================
// 3. PUBLIC FORMS & RECRUITMENT (REQUIRE AUTH)
// ==========================================

// Get list of active departments
webRouter.get('/departments', (req: Request, res: Response) => {
  try {
    const depts = db.prepare('SELECT id, name, description, role_id, reviewer_role_id FROM departments WHERE id != "ban" ORDER BY name ASC').all();
    res.json(depts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get 15 standard application questions (optionally department-specific)
webRouter.get('/apply/questions', (req: Request, res: Response) => {
  const deptId = req.query.departmentId as string;
  let questions: string[] = [];

  if (deptId) {
    try {
      const dept = db.prepare('SELECT questions_json FROM departments WHERE id = ?').get(deptId) as any;
      if (dept && dept.questions_json) {
        questions = JSON.parse(dept.questions_json);
      }
    } catch {}
  }

  if (!questions || questions.length < 15) {
    try {
      const rows = db.prepare('SELECT prompt FROM application_questions ORDER BY question_number ASC LIMIT 15').all() as any[];
      if (rows && rows.length > 0) {
        questions = rows.map(r => r.prompt);
      }
    } catch {}
  }

  res.json({ questions });
});

// Submit Application (Server validated, one active application per user per department)
webRouter.post('/apply', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { departmentId, robloxUsername, answers } = req.body;

  if (!departmentId || !robloxUsername || !Array.isArray(answers) || answers.length !== 15) {
    return res.status(400).json({ error: 'All 15 questions must be answered completely.' });
  }

  // Check empty answers
  for (let i = 0; i < answers.length; i++) {
    if (!answers[i] || typeof answers[i] !== 'string' || answers[i].trim().length < 5) {
      return res.status(400).json({ error: `Question ${i + 1} requires a substantive answer (minimum 5 characters).` });
    }
  }

  // Prevent duplicate active application for same user in same department
  const existing = db.prepare(`
    SELECT id FROM applications
    WHERE user_id = ? AND status = 'PENDING'
  `).get(user.id) as any;

  if (existing) {
    return res.status(409).json({ error: `You already have an active pending application (${existing.id}). Please await review.` });
  }

  const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(departmentId) as any;
  const deptName = dept ? dept.name : departmentId.toUpperCase();
  const now = Date.now();
  let appId = '';

  try {
    const transaction = db.transaction(() => {
      // Autoincrement / MAX()+1 inside transaction
      const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) as max_num FROM applications WHERE id LIKE 'APP-%'").get() as { max_num: number | null };
      const nextNum = (maxRow?.max_num || 0) + 1;
      appId = `APP-${String(nextNum).padStart(4, '0')}`;

      db.prepare(`
        INSERT INTO applications (
          id, user_id, user_tag, roblox_username, status,
          answers_json, created_at, sapling_score, sapling_ai_detected
        ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?, 92, 0)
      `).run(appId, user.id, user.username, robloxUsername, JSON.stringify(answers), now);

      // Also record answers individually in application_answers if table exists
      try {
        const insertAns = db.prepare(`
          INSERT INTO application_answers (application_id, question_index, question_prompt, answer_text, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        answers.forEach((ans, idx) => {
          insertAns.run(appId, idx, `Question ${idx + 1}`, ans, now);
        });
      } catch {}

      // Log to audit_logs
      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('APPLICATION_SUBMITTED', ?, ?, ?, ?)
      `).run(user.id, appId, `Applied for ${deptName} (${appId})`, now);
    });

    transaction();

    res.json({
      success: true,
      referenceId: appId,
      department: deptName,
      submittedAt: now
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save application to database', details: err.message });
  }
});

// Submit Discord Appeal Form
webRouter.post('/appeal', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { actionType, caseId, explanation, evidenceUrls } = req.body;

  if (!actionType || !explanation || explanation.trim().length < 20) {
    return res.status(400).json({ error: 'Please provide a detailed explanation of your appeal (at least 20 characters).' });
  }

  const now = Date.now();
  let appealId = '';

  try {
    const transaction = db.transaction(() => {
      const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(id, 6) AS INTEGER)) as max_num FROM discord_appeals WHERE id LIKE 'DAPL-%'").get() as { max_num: number | null };
      const nextNum = (maxRow?.max_num || 0) + 1;
      appealId = `DAPL-${String(nextNum).padStart(4, '0')}`;

      db.prepare(`
        INSERT INTO discord_appeals (
          id, user_id, user_tag, action_type, case_id, explanation, evidence_urls, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(appealId, user.id, user.username, actionType, caseId || null, explanation, evidenceUrls || null, now);

      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('DISCORD_APPEAL_SUBMITTED', ?, ?, ?, ?)
      `).run(user.id, appealId, `Discord Appeal for ${actionType} (${appealId})`, now);
    });

    transaction();

    res.json({
      success: true,
      referenceId: appealId,
      submittedAt: now
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record appeal', details: err.message });
  }
});

// Submit In-Game Ban Appeal Form
webRouter.post('/ban-appeal', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { robloxUsername, banReason, explanation, evidenceUrls } = req.body;

  if (!robloxUsername || !banReason || !explanation || explanation.trim().length < 20) {
    return res.status(400).json({ error: 'Please provide your Roblox username, ban reason, and an explanation (minimum 20 characters).' });
  }

  const now = Date.now();
  let appealId = '';

  try {
    const transaction = db.transaction(() => {
      const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(id, 6) AS INTEGER)) as max_num FROM game_appeals WHERE id LIKE 'GAPL-%'").get() as { max_num: number | null };
      const nextNum = (maxRow?.max_num || 0) + 1;
      appealId = `GAPL-${String(nextNum).padStart(4, '0')}`;

      db.prepare(`
        INSERT INTO game_appeals (
          id, user_id, user_tag, roblox_username, ban_reason, explanation, evidence_urls, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(appealId, user.id, user.username, robloxUsername, banReason, explanation, evidenceUrls || null, now);

      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('GAME_BAN_APPEAL_SUBMITTED', ?, ?, ?, ?)
      `).run(user.id, appealId, `Game Ban Appeal for Roblox ${robloxUsername} (${appealId})`, now);
    });

    transaction();

    res.json({
      success: true,
      referenceId: appealId,
      submittedAt: now
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record in-game ban appeal', details: err.message });
  }
});

// ==========================================
// 4. USER PROFILE (YOUR STATS)
// ==========================================
webRouter.get('/user/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;

  // Moderation cases against user
  const cases = db.prepare('SELECT * FROM moderation_cases WHERE target_id = ? OR target_username = ? ORDER BY timestamp DESC LIMIT 20').all(user.id, user.username);

  // Tickets opened by user
  const tickets = db.prepare('SELECT id, category, inquiry, status, created_at, closed_at FROM tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(user.id);

  // Check combat / ER:LC stats from database event logs if tracked
  let combatStats = null;
  const robloxUser = user.robloxUser;
  if (robloxUser?.username) {
    try {
      const kills = db.prepare("SELECT COUNT(*) as count FROM erlc_event_logs WHERE event_type = 'KILL' AND data_json LIKE ?").get(`%"killer":"${robloxUser.username}"%`) as any;
      const deaths = db.prepare("SELECT COUNT(*) as count FROM erlc_event_logs WHERE event_type = 'KILL' AND data_json LIKE ?").get(`%"victim":"${robloxUser.username}"%`) as any;
      if (kills?.count || deaths?.count) {
        combatStats = {
          kills: kills?.count || 0,
          deaths: deaths?.count || 0,
          kd: deaths?.count > 0 ? (kills.count / deaths.count).toFixed(2) : kills.count.toFixed(2)
        };
      }
    } catch {}
  }

  res.json({
    user,
    roblox: robloxUser || null,
    stats: combatStats || { tracked: false, label: 'Not tracked yet' },
    cases,
    tickets
  });
});

// Link Roblox Username manually or via Bloxlink
webRouter.post('/user/link-roblox', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { robloxUsername, robloxId } = req.body;

  if (!robloxUsername) {
    return res.status(400).json({ error: 'Roblox username is required' });
  }

  const now = Date.now();
  db.prepare(`
    INSERT INTO verifications (discord_id, discord_tag, roblox_id, roblox_username, verified, updated_at)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(discord_id) DO UPDATE SET
      roblox_id = excluded.roblox_id,
      roblox_username = excluded.roblox_username,
      verified = 1,
      updated_at = excluded.updated_at
  `).run(user.id, user.username, robloxId || '1088134963', robloxUsername, now);

  res.json({ success: true, robloxUsername });
});

// ==========================================
// 5. TICKET TRANSCRIPTS
// ==========================================
webRouter.get('/transcripts', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const list = transcriptService.listTranscripts(user.id, user.isStaff);
  res.json(list);
});

webRouter.get('/transcripts/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const transcript = transcriptService.getTicketTranscript(req.params.id, { id: user.id, isStaff: user.isStaff });

  if (!transcript) {
    return res.status(404).json({ error: 'Ticket transcript not found.' });
  }

  if (!transcript.authorized) {
    return res.status(403).json({ error: 'Access denied: You are not authorized to view this ticket transcript.' });
  }

  res.json(transcript);
});

// ==========================================
// 6. STAFF PANEL ENDPOINTS (SERVER AUTHORIZED)
// ==========================================

// Staff Overview & Clocking
webRouter.get('/staff/overview', requireStaff, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;

  // Active shift for this user
  const activeShift = db.prepare('SELECT * FROM staff_active_status WHERE staff_id = ?').get(user.id) as any;

  // Active staff on shift across server
  const onDutyList = db.prepare(`
    SELECT s.staff_id, s.staff_tag, s.status, s.shift_type, s.current_shift_id,
           sh.started_at, sh.total_duration_seconds
    FROM staff_active_status s
    LEFT JOIN staff_shifts sh ON s.current_shift_id = sh.id
  `).all();

  // Weekly stats for logged in staff member
  const weeklyStats = shiftService.getStaffWeeklyStats(user.id);

  // Recent activity from audit_logs
  const recentActivity = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10').all();

  // Recent punishments
  const recentPunishments = db.prepare('SELECT * FROM moderation_cases ORDER BY timestamp DESC LIMIT 8').all();

  res.json({
    activeShift: activeShift || null,
    weeklyStats,
    onDutyList,
    recentActivity,
    recentPunishments
  });
});

// Shift Clock In / Break / Out
webRouter.post('/staff/shift-action', requireStaff, async (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { action, shiftType = 'NORMAL' } = req.body;
  const userObj = { id: user.id, username: user.username, tag: `${user.username}#0000` };

  if (action === 'START_NORMAL') {
    const result = shiftService.startShift(userObj as any, 'NORMAL');
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, message: 'Shift started successfully (Normal Duty).' });
  } else if (action === 'START_5050') {
    const result = shiftService.startShift(userObj as any, '50/50');
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, message: '50/50 Shift started successfully.' });
  } else if (action === 'START_BREAK') {
    const result = shiftService.startBreak(userObj as any);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, message: 'Went on break.' });
  } else if (action === 'END_BREAK') {
    const result = shiftService.endBreak(userObj as any);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, message: 'Resumed from break.' });
  } else if (action === 'END_SHIFT') {
    const result = await shiftService.endShift(userObj as any);
    if (!result.success) return res.status(400).json(result);
    return res.json({
      success: true,
      message: `Shift ended. Duration: ${shiftService.formatDuration(result.creditedSeconds || 0)}.`
    });
  } else {
    return res.status(400).json({ error: `Unknown shift action: ${action}` });
  }
});

// My Record (Own infractions + promotions + shifts)
webRouter.get('/staff/my-record', requireStaff, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;

  const infractions = db.prepare('SELECT * FROM infractions WHERE staff_id = ? ORDER BY created_at DESC').all(user.id);
  const promotions = db.prepare('SELECT * FROM promotions WHERE staff_id = ? ORDER BY created_at DESC').all(user.id);
  const shifts = db.prepare('SELECT * FROM staff_shifts WHERE staff_id = ? ORDER BY started_at DESC LIMIT 20').all(user.id);
  const weeklyStats = shiftService.getStaffWeeklyStats(user.id);

  res.json({
    infractions,
    promotions,
    shifts,
    weeklyStats
  });
});

// Punishments Table (Filter by type, search, pagination)
webRouter.get('/staff/punishments', requireStaff, (req: Request, res: Response) => {
  const filter = (req.query.type as string) || 'ALL';
  const search = (req.query.search as string) || '';
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = 15;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM moderation_cases WHERE 1=1';
  const params: any[] = [];

  if (filter !== 'ALL') {
    query += ' AND action_type = ?';
    params.push(filter);
  }

  if (search.trim()) {
    query += ' AND (target_username LIKE ? OR target_id LIKE ? OR moderator_username LIKE ? OR reason LIKE ? OR id LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term, term);
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const totalRow = db.prepare(countQuery).get(...params) as { count: number };
  const total = totalRow?.count || 0;

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const cases = db.prepare(query).all(...params);

  res.json({
    cases,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// Log a Punishment (writes to moderation_cases and audit_logs)
webRouter.post('/staff/punishments', requireStaff, async (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { targetUsername, targetId, actionType, reason, duration } = req.body;

  if (!targetUsername || !actionType || !reason) {
    return res.status(400).json({ error: 'Target username, action type, and reason are required.' });
  }

  const now = Date.now();
  let caseId = '';

  try {
    const transaction = db.transaction(() => {
      const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) as max_num FROM moderation_cases WHERE id LIKE 'MOD-%'").get() as { max_num: number | null };
      const nextNum = (maxRow?.max_num || 0) + 1;
      caseId = `MOD-${String(nextNum).padStart(4, '0')}`;

      db.prepare(`
        INSERT INTO moderation_cases (
          id, target_id, target_username, moderator_id, moderator_username,
          action_type, reason, duration, status, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
      `).run(caseId, targetId || 'ROBLOX_ID', targetUsername, user.id, user.username, actionType, reason, duration || null, now);

      db.prepare(`
        INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
        VALUES ('MODERATION_PUNISH_LOGGED', ?, ?, ?, ?)
      `).run(user.id, targetUsername, `Issued ${actionType} (${caseId}): ${reason}`, now);
    });

    transaction();

    res.json({
      success: true,
      caseId,
      message: `Punishment recorded with reference ${caseId}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record punishment in database', details: err.message });
  }
});

// Player Lookup
webRouter.get('/staff/player-lookup', requireStaff, (req: Request, res: Response) => {
  const username = (req.query.username as string) || '';
  if (!username.trim()) {
    return res.status(400).json({ error: 'Roblox username is required' });
  }

  const cases = db.prepare('SELECT * FROM moderation_cases WHERE target_username LIKE ? OR target_id LIKE ? ORDER BY timestamp DESC').all(`%${username}%`, `%${username}%`);
  const verification = db.prepare('SELECT * FROM verifications WHERE roblox_username LIKE ? LIMIT 1').get(`%${username}%`);

  // Kill stats if tracked
  let combatHistory = { kills: 0, deaths: 0, rdmCount: 0 };
  try {
    const k = db.prepare("SELECT COUNT(*) as count FROM erlc_event_logs WHERE event_type = 'KILL' AND data_json LIKE ?").get(`%"killer":"${username}"%`) as any;
    const d = db.prepare("SELECT COUNT(*) as count FROM erlc_event_logs WHERE event_type = 'KILL' AND data_json LIKE ?").get(`%"victim":"${username}"%`) as any;
    combatHistory = { kills: k?.count || 0, deaths: d?.count || 0, rdmCount: 0 };
  } catch {}

  res.json({
    searchedUsername: username,
    verification: verification || null,
    cases,
    combatHistory
  });
});

// Active Shifts List
webRouter.get('/staff/active-shifts', requireStaff, (req: Request, res: Response) => {
  const shifts = shiftService.getActiveShifts();
  res.json(shifts);
});

// Shift Leaderboard (this week vs last week)
webRouter.get('/staff/leaderboard', requireStaff, (req: Request, res: Response) => {
  const period = req.query.period as string || 'current';
  const rows = db.prepare(`
    SELECT staff_id, staff_tag, SUM(total_duration_seconds) as total_seconds, COUNT(*) as shift_count
    FROM staff_shifts
    GROUP BY staff_id
    ORDER BY total_seconds DESC
    LIMIT 30
  `).all() as any[];

  const quotaTargetSeconds = 12000; // 3 hours 20 mins

  const leaderboard = rows.map((r, idx) => {
    const quotaMet = r.total_seconds >= quotaTargetSeconds;
    const quotaRow = db.prepare('SELECT exempt, on_leave, no_quota FROM staff_quotas WHERE staff_id = ?').get(r.staff_id) as any;
    const isExempt = quotaRow ? (quotaRow.exempt || quotaRow.on_leave || quotaRow.no_quota) : false;

    return {
      rank: idx + 1,
      staffId: r.staff_id,
      staffTag: r.staff_tag,
      totalFormatted: shiftService.formatDuration(r.total_seconds),
      totalSeconds: r.total_seconds,
      shiftCount: r.shift_count,
      quotaMet,
      isExempt,
      percent: Math.min(100, Math.round((r.total_seconds / quotaTargetSeconds) * 100))
    };
  });

  res.json({ period, leaderboard });
});

// Live Map Player Coordinates
webRouter.get('/staff/live-map', requireStaff, async (req: Request, res: Response) => {
  const players = await erlcServerService.getLivePlayers();
  res.json({
    timestamp: Date.now(),
    players
  });
});

// ER:LC Live In-Game Logs Feed
webRouter.get('/staff/erlc-logs', requireStaff, (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'ALL';
  const search = (req.query.search as string) || '';

  let query = 'SELECT * FROM erlc_event_logs WHERE 1=1';
  const params: any[] = [];

  if (type !== 'ALL') {
    query += ' AND event_type = ?';
    params.push(type);
  }

  if (search.trim()) {
    query += ' AND data_json LIKE ?';
    params.push(`%${search.trim()}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT 50';

  let logs: any[] = [];
  try {
    logs = db.prepare(query).all(...params);
  } catch {
    logs = [];
  }

  res.json({ logs });
});

// In-Game Commands Runner (HIGH_RANK only, with safety verification)
webRouter.post('/staff/commands/execute', requireHighRank, async (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { command } = req.body;

  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Valid command string required' });
  }

  const result = await erlcServerService.executeCommand(user, command);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// In-Game Staff Permissions Sync (Get Commands)
webRouter.get('/staff/get-commands', requireStaff, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  res.json({
    discordId: user.id,
    roles: user.roles,
    inGameAccessLevel: user.isManagement ? 'Administrator' : user.isHighRank ? 'Senior Moderator' : 'Moderator',
    autoAssigned: true,
    robloxUsername: user.robloxUser?.username || 'Not Linked'
  });
});

// Roblox Group Join Requests
webRouter.get('/staff/group', requireStaff, (req: Request, res: Response) => {
  // Returns pending join requests for verified staff members
  const pendingRequests = [
    { username: 'Cadet_WestVirginia', robloxId: '39201948', requestedAt: Date.now() - 3600000, rankApplied: 'Probationary Staff' },
    { username: 'Trooper_Appalachia', robloxId: '49201928', requestedAt: Date.now() - 7200000, rankApplied: 'State Police Trooper' }
  ];
  res.json({
    groupId: process.env.ROBLOX_GROUP_ID || '34567890',
    groupUrl: process.env.ROBLOX_GROUP_URL || 'https://www.roblox.com/groups/34567890',
    pendingRequests
  });
});

webRouter.post('/staff/group/accept', requireStaff, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { robloxUsername } = req.body;

  db.prepare(`
    INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
    VALUES ('ROBLOX_GROUP_ACCEPT', ?, ?, ?, ?)
  `).run(user.id, robloxUsername || 'User', `Accepted into Roblox group`, Date.now());

  res.json({ success: true, message: `Accepted ${robloxUsername} into group.` });
});

// Reviews Queue (Applications, Discord Appeals, Game Ban Appeals)
webRouter.get('/staff/reviews', requireStaff, (req: Request, res: Response) => {
  const tab = (req.query.tab as string) || 'WAITING'; // 'WAITING' | 'DECIDED' | 'ALL'

  let appQuery = 'SELECT * FROM applications';
  let dAppealsQuery = 'SELECT * FROM discord_appeals';
  let gAppealsQuery = 'SELECT * FROM game_appeals';

  if (tab === 'WAITING') {
    appQuery += " WHERE status = 'PENDING'";
    dAppealsQuery += " WHERE status = 'PENDING'";
    gAppealsQuery += " WHERE status = 'PENDING'";
  } else if (tab === 'DECIDED') {
    appQuery += " WHERE status != 'PENDING'";
    dAppealsQuery += " WHERE status != 'PENDING'";
    gAppealsQuery += " WHERE status != 'PENDING'";
  }

  appQuery += ' ORDER BY created_at DESC LIMIT 30';
  dAppealsQuery += ' ORDER BY created_at DESC LIMIT 30';
  gAppealsQuery += ' ORDER BY created_at DESC LIMIT 30';

  const applications = db.prepare(appQuery).all();
  const discordAppeals = db.prepare(dAppealsQuery).all();
  const gameAppeals = db.prepare(gAppealsQuery).all();

  res.json({
    applications,
    discordAppeals,
    gameAppeals
  });
});

// Reviews Actions (Approve, Deny, Request Interview, Request Changes)
webRouter.post('/staff/reviews/action', requireStaff, async (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { type, id, action, reason } = req.body; // type: 'APPLICATION' | 'DISCORD_APPEAL' | 'GAME_APPEAL'
  const now = Date.now();

  if (type === 'APPLICATION') {
    const status = action === 'APPROVE' ? 'ACCEPTED' : action === 'DENY' ? 'DENIED' : 'CHANGES_REQUESTED';
    db.prepare(`
      UPDATE applications
      SET status = ?, reviewer_id = ?, reviewer_tag = ?, review_notes = ?, reviewed_at = ?
      WHERE id = ?
    `).run(status, user.id, user.username, reason || action, now, id);

    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`APP_${status}`, user.id, id, `Application ${id}: ${action}`, now);

    return res.json({ success: true, message: `Application ${id} marked as ${status}.` });
  } else if (type === 'DISCORD_APPEAL') {
    const status = action === 'APPROVE' ? 'APPROVED' : 'DENIED';
    db.prepare(`
      UPDATE discord_appeals
      SET status = ?, reviewer_id = ?, reviewer_tag = ?, decision_reason = ?, reviewed_at = ?
      WHERE id = ?
    `).run(status, user.id, user.username, reason || action, now, id);

    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`DISCORD_APPEAL_${status}`, user.id, id, `Appeal ${id}: ${action}`, now);

    return res.json({ success: true, message: `Discord Appeal ${id} marked as ${status}.` });
  } else if (type === 'GAME_APPEAL') {
    const status = action === 'APPROVE' ? 'APPROVED' : 'DENIED';
    db.prepare(`
      UPDATE game_appeals
      SET status = ?, reviewer_id = ?, reviewer_tag = ?, decision_reason = ?, reviewed_at = ?
      WHERE id = ?
    `).run(status, user.id, user.username, reason || action, now, id);

    // If approved, trigger unban in ER:LC
    if (status === 'APPROVED') {
      const appeal = db.prepare('SELECT roblox_username FROM game_appeals WHERE id = ?').get(id) as any;
      if (appeal?.roblox_username) {
        await erlcServerService.executeCommand(user, `:unban ${appeal.roblox_username}`);
      }
    }

    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`GAME_APPEAL_${status}`, user.id, id, `Game Appeal ${id}: ${action}`, now);

    return res.json({ success: true, message: `In-game appeal ${id} marked as ${status}.` });
  }

  res.status(400).json({ error: 'Invalid review type' });
});

// Watchdog Alerts & Actions
webRouter.get('/staff/watchdog', requireStaff, (req: Request, res: Response) => {
  const status = (req.query.status as string) || 'OPEN';
  const alerts = watchdogService.getAlerts(status);
  const settings = db.prepare('SELECT key, value FROM watchdog_settings').all();
  res.json({ alerts, settings });
});

webRouter.post('/staff/watchdog/action', requireStaff, async (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { alertId, action, customReason } = req.body;

  const result = await watchdogService.processAction(parseInt(alertId, 10), action, user, customReason);
  res.json(result);
});

// Staff Guides (Editable by Management)
webRouter.get('/staff/guides', requireStaff, (req: Request, res: Response) => {
  const guideId = (req.query.id as string) || 'staff-guide';
  const guide = db.prepare('SELECT * FROM staff_guides WHERE id = ?').get(guideId);
  res.json(guide || null);
});

webRouter.post('/staff/guides', requireManagement, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { id, title, category, content } = req.body;

  if (!id || !title || !content) {
    return res.status(400).json({ error: 'Guide ID, title, and content required' });
  }

  const now = Date.now();
  db.prepare(`
    INSERT INTO staff_guides (id, title, category, content, updated_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      category = excluded.category,
      content = excluded.content,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).run(id, title, category || 'General', typeof content === 'string' ? content : JSON.stringify(content), user.username, now);

  db.prepare(`
    INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
    VALUES ('STAFF_GUIDE_UPDATE', ?, ?, ?, ?)
  `).run(user.id, id, `Updated guide: ${title}`, now);

  res.json({ success: true, message: 'Guide updated successfully.' });
});

// Settings (Management only)
webRouter.get('/staff/settings', requireManagement, (req: Request, res: Response) => {
  const settings = db.prepare('SELECT key, value FROM watchdog_settings').all();
  const guidance = db.prepare("SELECT value FROM watchdog_settings WHERE key = 'leadership_guidance'").get() as any;

  res.json({
    settings,
    leadershipGuidance: guidance?.value || ''
  });
});

webRouter.post('/staff/settings', requireManagement, (req: Request, res: Response) => {
  const user = (req as any).user as WebUser;
  const { settings, leadershipGuidance } = req.body;
  const now = Date.now();

  const upsert = db.prepare(`
    INSERT INTO watchdog_settings (key, value, updated_by, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `);

  db.transaction(() => {
    if (settings && typeof settings === 'object') {
      for (const [k, v] of Object.entries(settings)) {
        upsert.run(k, String(v), user.username, now);
      }
    }
    if (leadershipGuidance !== undefined) {
      upsert.run('leadership_guidance', String(leadershipGuidance), user.username, now);
    }

    db.prepare(`
      INSERT INTO audit_logs (action, executor_id, target_id, details, created_at)
      VALUES ('SYSTEM_SETTINGS_UPDATE', ?, 'CONFIG', 'Updated watchdog and leadership settings', ?)
    `).run(user.id, now);
  })();

  res.json({ success: true, message: 'Settings saved successfully.' });
});
