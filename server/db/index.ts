import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || process.env.DATABASE_PATH || './database/wvrp.sqlite';
const resolvedDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(resolvedDir)) {
  fs.mkdirSync(resolvedDir, { recursive: true });
}

export const db = new Database(path.resolve(dbPath));
db.pragma('journal_mode = WAL');

/**
 * Run safe migrations for web platform tables while strictly preserving existing bot tables.
 */
export function runWebMigrations() {
  db.exec(`
    -- Web User Sessions (Discord OAuth2 signed cookie storage)
    CREATE TABLE IF NOT EXISTS web_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    -- Discord Appeals Form Submissions
    CREATE TABLE IF NOT EXISTS discord_appeals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      action_type TEXT NOT NULL,
      case_id TEXT,
      explanation TEXT NOT NULL,
      evidence_urls TEXT,
      status TEXT DEFAULT 'PENDING',
      reviewer_id TEXT,
      reviewer_tag TEXT,
      decision_reason TEXT,
      created_at INTEGER NOT NULL,
      reviewed_at INTEGER
    );

    -- In-Game Ban Appeals Form Submissions
    CREATE TABLE IF NOT EXISTS game_appeals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_tag TEXT NOT NULL,
      roblox_username TEXT NOT NULL,
      ban_reason TEXT NOT NULL,
      explanation TEXT NOT NULL,
      evidence_urls TEXT,
      status TEXT DEFAULT 'PENDING',
      reviewer_id TEXT,
      reviewer_tag TEXT,
      decision_reason TEXT,
      created_at INTEGER NOT NULL,
      reviewed_at INTEGER
    );

    -- Staff Guides & Official Policies (Editable by Management)
    CREATE TABLE IF NOT EXISTS staff_guides (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Watchdog Automated Detection Alerts
    CREATE TABLE IF NOT EXISTS watchdog_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL,
      player_name TEXT NOT NULL,
      roblox_id TEXT,
      confidence INTEGER DEFAULT 80,
      details TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      status TEXT DEFAULT 'OPEN',
      created_at INTEGER NOT NULL,
      action_taken TEXT,
      action_by TEXT,
      resolved_at INTEGER
    );

    -- Watchdog Configuration Settings
    CREATE TABLE IF NOT EXISTS watchdog_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_by TEXT,
      updated_at INTEGER
    );

    -- Ensure ticket_messages exists for closed transcripts
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT,
      attachments TEXT,
      timestamp INTEGER NOT NULL
    );
  `);

  // Seed default 15 standard application questions if none exist
  try {
    const qCount = db.prepare('SELECT COUNT(*) as count FROM application_questions').get() as { count: number };
    if (!qCount || qCount.count === 0) {
      const defaultQuestions = [
        "What is your full Roblox username and current age?",
        "Why do you want to join West Virginia State Roleplay over other communities?",
        "Describe your prior ER:LC or law enforcement roleplay experience, including ranks held.",
        "What is your understanding of our community Chain of Command?",
        "Define Fail Roleplay (FRP) and provide a realistic in-game scenario.",
        "Define Random Deathmatch (RDM) and Vehicle Deathmatch (VDM). What are the consequences?",
        "What does New Life Rule (NLR) entail, and when does it strictly apply?",
        "What is Leaving to Avoid Punishment (LTAP) or Arrest (LTAA), and how should staff handle it?",
        "Explain Not Intending to Roleplay (NITRP) and how you identify it on patrol.",
        "How would you de-escalate a heated argument between two players during a traffic stop?",
        "A player accuses you of staff abuse during an active scenario. How do you respond?",
        "What steps do you take when you suspect a civilian is using external software or exploits?",
        "How do you maintain professional radio decorum and dispatch ten-codes on duty?",
        "How many hours per week can you actively dedicate to on-duty shifts for your weekly quota?",
        "Do you acknowledge that using AI to generate responses results in immediate disqualification?"
      ];

      const insertQ = db.prepare('INSERT INTO application_questions (id, question_number, prompt, placeholder, required) VALUES (?, ?, ?, ?, 1)');
      db.transaction(() => {
        defaultQuestions.forEach((prompt, idx) => {
          insertQ.run(idx + 1, idx + 1, prompt, 'Provide your detailed answer here...');
        });
      })();
    }
  } catch (err) {
    console.warn('Questions seed skipped or already present:', err);
  }

  // Seed initial staff guides if not present
  try {
    const guideCount = db.prepare('SELECT COUNT(*) as count FROM staff_guides').get() as { count: number };
    if (!guideCount || guideCount.count === 0) {
      const now = Date.now();
      const insertGuide = db.prepare('INSERT INTO staff_guides (id, title, category, content, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)');

      db.transaction(() => {
        insertGuide.run(
          'staff-guide',
          'Standard Staff Operations & Conduct Guide',
          'Operations',
          JSON.stringify({
            sections: [
              {
                heading: 'Core Staff Philosophy',
                body: 'Welcome to the West Virginia State Roleplay staff team. As a staff member, you represent the highest standard of fairness, maturity, and realism. Your primary responsibility is facilitating immersive, high-standard emergency response roleplay for all residents while enforcing server guidelines impartially.'
              },
              {
                heading: 'Shift Protocols & Quota Requirements',
                body: 'Every verified staff member is expected to log a minimum of 3 hours and 20 minutes (12,000 seconds) on-duty per calendar week. Shifts must be clocked using the staff panel or discord bot commands. 50/50 shifts (patrolling while moderating) count fully towards your quota provided active attention is maintained.'
              },
              {
                heading: 'In-Game Staff Discipline & Uniform Codes',
                body: 'While on duty as a moderator, you must wear authorized department attire or standard moderation uniform. Never spawn unapproved emergency vehicles, initiate high-speed pursuits without roleplay cause, or use administrative permissions to gain an in-game advantage.'
              },
              {
                heading: 'Chain of Command & Escalation',
                body: 'Always seek resolution at your tier first. Junior staff report to Senior Moderators. Operational disagreements must be escalated to High Rank staff. Direct concerns regarding server security or administrative misconduct to Management through private tickets.'
              }
            ]
          }),
          'WVSP Management',
          now
        );

        insertGuide.run(
          'punishment-guide',
          'Official Community Punishment & Enforcement Matrix',
          'Enforcement',
          JSON.stringify({
            description: 'This enforcement matrix establishes standard progressive discipline across all West Virginia State Roleplay platforms. Moderators must reference this guide before executing disciplinary actions.',
            matrix: [
              { offence: 'Fail Roleplay (FRP)', first: 'Warning', second: 'Kick', third: '3d Ban', notes: 'Unrealistic vehicle stunts, driving off mountains, ignoring injuries.' },
              { offence: 'Random Deathmatch (RDM)', first: 'Warning', second: 'Kick', third: '7d Ban', notes: 'Killing or attacking without valid roleplay initiation.' },
              { offence: 'Vehicle Deathmatch (VDM)', first: 'Warning', second: 'Kick', third: '7d Ban', notes: 'Using vehicles as weapons to ram players or pedestrians intentionally.' },
              { offence: 'New Life Rule (NLR)', first: 'Verbal Warning', second: 'Warning', third: 'Kick', notes: 'Returning to death scene within 10 minutes or remembering previous life.' },
              { offence: 'Leaving to Avoid Punishment (LTAP)', first: 'Kick', second: '3d Ban', third: '14d Ban', notes: 'Disconnecting while being questioned by staff.' },
              { offence: 'Leaving to Avoid Arrest (LTAA)', first: 'Warning', second: 'Kick', third: '3d Ban', notes: 'Disconnecting during a traffic stop, pursuit, or custodial arrest.' },
              { offence: 'Not Intending to Roleplay (NITRP)', first: 'Kick', second: '7d Ban', third: 'Permanent Ban', notes: 'Trolling, continuous disruption, spamming horns, soundboards.' },
              { offence: 'Tool / Gear Abuse', first: 'Warning + Team Removal', second: 'Kick', third: '3d Ban', notes: 'Spamming handcuffs, barriers, tasers, or spikes outside roleplay.' },
              { offence: 'Staff Evasion', first: 'Warning', second: 'Kick', third: '5d Ban', notes: 'Ignoring staff commands, running away from staff during a pause.' },
              { offence: 'Grand Theft Auto (GTA) Driving', first: 'Verbal Warning', second: 'Warning', third: 'Kick', notes: 'Reckless 120mph driving in town zones without pursuit clearance.' },
              { offence: 'Crime in Safezone', first: 'Warning', second: 'Kick', third: '3d Ban', notes: 'Committing robberies or shooting inside spawn, hospitals, or stations.' },
              { offence: 'Cop Baiting', first: 'Verbal Warning', second: 'Warning', third: 'Kick', notes: 'Intentionally provoking law enforcement with no roleplay backstory.' },
              { offence: 'Fear Roleplay Violation (No Fear RP)', first: 'Warning', second: 'Kick', third: '3d Ban', notes: 'Failing to value your character life when held at gunpoint.' },
              { offence: 'Breaking Peacetime', first: 'Warning', second: 'Kick', third: '5d Ban', notes: 'Engaging in violent crime or vehicle pursuits while peacetime is declared.' },
              { offence: 'Using Whitelisted Items Without Whitelist', first: 'Warning + Team Removal', second: 'Kick', third: '7d Ban', notes: 'Spawning specialized agency vehicles or tactical gear without clearance.' },
              { offence: 'Not Listening to Staff', first: 'Warning', second: 'Kick', third: '3d Ban', notes: 'Arguing over rule interpretation or refusing instructions in a sit.' },
              { offence: 'Staff Impersonation', first: '7d Ban', second: '14d Ban', third: 'Permanent Ban', notes: 'Claiming to be staff or wearing moderator badges without authorization.' },
              { offence: 'Ro-Banging / Inappropriate Emotes', first: 'Kick', second: '7d Ban', third: 'Permanent Ban', notes: 'Sexually suggestive animations or lewd character emotes.' },
              { offence: 'Rejoining Immediately After a Kick', first: '1d Ban', second: '3d Ban', third: '7d Ban', notes: 'Bypassing a kick punishment to continue disruptive behavior.' },
              { offence: 'Mass Random Deathmatch (Mass RDM)', first: '14d Ban', second: 'Permanent Ban', third: 'Community Blacklist', notes: 'Killing 3 or more players in rapid succession.' },
              { offence: 'Mass Vehicle Deathmatch (Mass VDM)', first: '14d Ban', second: 'Permanent Ban', third: 'Community Blacklist', notes: 'Ramming crowds or multiple vehicles in rapid succession.' },
              { offence: 'NSFW / Inappropriate Content', first: 'Permanent Ban', second: 'Community Blacklist', third: 'Community Blacklist', notes: 'Sharing or depicting sexually explicit material or references.' },
              { offence: 'Banned Roleplay (Terrorism / Slurs / Hate)', first: 'Permanent Ban', second: 'Community Blacklist', third: 'Community Blacklist', notes: 'Terrorism simulation, racial or hateful slurs, self-harm roleplay.' }
            ]
          }),
          'WVSP Management',
          now
        );

        insertGuide.run(
          'instructor-guide',
          'Staff Instructor Curriculum & Evaluation Guide',
          'Training',
          JSON.stringify({
            sections: [
              {
                heading: 'Instructor Mission',
                body: 'The Staff Instructor Corps is responsible for vetting, training, and mentoring probationary staff members through hands-on evaluation in West Virginia State Roleplay.'
              },
              {
                heading: 'Phase 1: Knowledge Verification',
                body: 'Instructors must verify trainee familiarity with ten-codes, the punishment matrix, server command syntax, and ticket transcript review protocols.'
              },
              {
                heading: 'Phase 2: Supervised Ride-Along Assessment',
                body: 'Trainees must complete at least two 45-minute supervised patrol sessions with an assigned Instructor before receiving full solo moderating privileges.'
              },
              {
                heading: 'Phase 3: Formal Recommendation',
                body: 'Instructors submit an evaluation rating (1-5) and written feedback through the Staff Panel. High Command reviews instructor endorsements weekly.'
              }
            ]
          }),
          'WVSP Management',
          now
        );
      })();
    }
  } catch (err) {
    console.warn('Guides seed skipped or already present:', err);
  }

  // Seed default watchdog settings
  try {
    const sCount = db.prepare('SELECT COUNT(*) as count FROM watchdog_settings').get() as { count: number };
    if (!sCount || sCount.count === 0) {
      const insertSetting = db.prepare('INSERT INTO watchdog_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)');
      const now = Date.now();
      db.transaction(() => {
        insertSetting.run('rdm_kill_threshold', '3', 'System', now);
        insertSetting.run('rdm_time_window_seconds', '180', 'System', now);
        insertSetting.run('max_avatar_robux', '25000', 'System', now);
        insertSetting.run('min_players_for_kick', '3', 'System', now);
        insertSetting.run('leadership_guidance', 'All staff are reminded to prioritize de-escalation. Watchdog alerts are advisory recommendations; verify context before executing bans.', 'WVSP Management', now);
      })();
    }
  } catch (err) {
    console.warn('Watchdog settings seed skipped:', err);
  }
}
