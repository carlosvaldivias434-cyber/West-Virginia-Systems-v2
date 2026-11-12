import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || process.env.DATABASE_PATH || './database/wvrp.sqlite';
const resolvedDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(resolvedDir)) {
  fs.mkdirSync(resolvedDir, { recursive: true });
}

export const db = new Database(path.resolve(dbPath));

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    channel_id TEXT,
    user_id TEXT,
    user_tag TEXT,
    roblox_username TEXT,
    roblox_id TEXT,
    category TEXT,
    inquiry TEXT,
    claimed_by TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at INTEGER,
    closed_at INTEGER,
    closed_by TEXT,
    transcript_url TEXT,
    ai_status TEXT DEFAULT 'ENABLED',
    ai_summary TEXT
  );

  CREATE TABLE IF NOT EXISTS ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT,
    author_id TEXT,
    author_name TEXT,
    content TEXT,
    attachments TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS infractions (
    id TEXT PRIMARY KEY,
    staff_id TEXT,
    staff_tag TEXT,
    punishment TEXT,
    reason TEXT,
    issuer_id TEXT,
    issuer_tag TEXT,
    appealable INTEGER DEFAULT 1,
    status TEXT DEFAULT 'ACTIVE',
    evidence_thread_id TEXT,
    revoked_by TEXT,
    revoke_reason TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS infraction_appeals (
    id TEXT PRIMARY KEY,
    infraction_id TEXT,
    appellant_id TEXT,
    answers_json TEXT,
    status TEXT DEFAULT 'PENDING',
    reviewer_id TEXT,
    review_reason TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    staff_id TEXT,
    staff_tag TEXT,
    new_rank TEXT,
    old_rank TEXT,
    reason TEXT,
    issuer_id TEXT,
    issuer_tag TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS staff_feedback (
    id TEXT PRIMARY KEY,
    staff_id TEXT,
    staff_tag TEXT,
    reviewer_id TEXT,
    reviewer_tag TEXT,
    rating INTEGER,
    comment TEXT,
    is_anonymous INTEGER DEFAULT 0,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS staff_shifts (
    id TEXT PRIMARY KEY,
    staff_id TEXT,
    staff_tag TEXT,
    roblox_id TEXT,
    shift_type TEXT DEFAULT 'NORMAL',
    started_at INTEGER,
    ended_at INTEGER,
    total_duration_seconds INTEGER DEFAULT 0,
    break_duration_seconds INTEGER DEFAULT 0,
    break_count INTEGER DEFAULT 0,
    moderation_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE'
  );

  CREATE TABLE IF NOT EXISTS staff_active_status (
    staff_id TEXT PRIMARY KEY,
    staff_tag TEXT,
    current_shift_id TEXT,
    status TEXT DEFAULT 'ON_SHIFT',
    shift_type TEXT DEFAULT 'NORMAL',
    break_started_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS staff_quotas (
    staff_id TEXT PRIMARY KEY,
    exempt INTEGER DEFAULT 0,
    on_leave INTEGER DEFAULT 0,
    no_quota INTEGER DEFAULT 0,
    custom_quota_seconds INTEGER DEFAULT 12000
  );

  CREATE TABLE IF NOT EXISTS training_sessions (
    id TEXT PRIMARY KEY,
    trainer_id TEXT,
    trainer_tag TEXT,
    starts_in TEXT,
    notes TEXT,
    status TEXT DEFAULT 'SCHEDULED',
    started_at INTEGER,
    ended_at INTEGER,
    attending_json TEXT DEFAULT '[]',
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS training_logs (
    id TEXT PRIMARY KEY,
    trainee_id TEXT,
    trainee_tag TEXT,
    trainer_id TEXT,
    trainer_tag TEXT,
    result TEXT,
    notes TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_tag TEXT,
    roblox_username TEXT,
    status TEXT DEFAULT 'PENDING',
    sapling_score REAL DEFAULT 0,
    sapling_ai_detected INTEGER DEFAULT 0,
    answers_json TEXT,
    reviewer_id TEXT,
    reviewer_tag TEXT,
    review_notes TEXT,
    created_at INTEGER,
    reviewed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS application_questions (
    id INTEGER PRIMARY KEY,
    question_number INTEGER,
    prompt TEXT,
    placeholder TEXT,
    required INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'OFFLINE',
    server_name TEXT,
    join_code TEXT,
    owner_name TEXT,
    player_count INTEGER DEFAULT 0,
    queue_count INTEGER DEFAULT 0,
    staff_count INTEGER DEFAULT 0,
    votes_json TEXT DEFAULT '[]',
    host_id TEXT,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS marketplace_listings (
    id TEXT PRIMARY KEY,
    category TEXT,
    title TEXT,
    description TEXT,
    price_robux INTEGER,
    perks_json TEXT,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS marketplace_orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_tag TEXT,
    listing_id TEXT,
    item_title TEXT,
    status TEXT DEFAULT 'PENDING',
    details TEXT,
    assigned_staff TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS economy (
    user_id TEXT PRIMARY KEY,
    wallet INTEGER DEFAULT 1000,
    bank INTEGER DEFAULT 5000,
    daily_streak INTEGER DEFAULT 0,
    last_daily INTEGER DEFAULT 0,
    last_work INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS crypto_portfolio (
    user_id TEXT,
    symbol TEXT,
    amount REAL DEFAULT 0,
    average_cost REAL DEFAULT 0,
    PRIMARY KEY (user_id, symbol)
  );

  CREATE TABLE IF NOT EXISTS blacklists (
    user_id TEXT,
    type TEXT,
    reason TEXT,
    issuer_id TEXT,
    created_at INTEGER,
    PRIMARY KEY (user_id, type)
  );

  CREATE TABLE IF NOT EXISTS economy_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    type TEXT,
    amount INTEGER,
    details TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS user_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    item_id TEXT,
    item_name TEXT,
    quantity INTEGER DEFAULT 1,
    purchased_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS application_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_by TEXT,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS comms_whitelist (
    user_id TEXT PRIMARY KEY,
    user_tag TEXT,
    added_by TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS livery_whitelist (
    user_id TEXT PRIMARY KEY,
    user_tag TEXT,
    added_by TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS infraction_appeals (
    id TEXT PRIMARY KEY,
    infraction_id TEXT,
    user_id TEXT,
    user_tag TEXT,
    channel_id TEXT,
    statement TEXT,
    sapling_score REAL DEFAULT 0,
    sapling_ai_detected INTEGER DEFAULT 0,
    sapling_summary TEXT,
    status TEXT DEFAULT 'PENDING',
    reviewer_id TEXT,
    reviewer_tag TEXT,
    created_at INTEGER,
    reviewed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS afk_status (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT,
    user_tag TEXT,
    reason TEXT,
    original_nickname TEXT,
    nickname_changed INTEGER DEFAULT 0,
    is_afk INTEGER DEFAULT 1,
    timestamp INTEGER,
    mentions_json TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS afk_pings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    afk_user_id TEXT,
    pinger_id TEXT,
    pinger_tag TEXT,
    channel_id TEXT,
    channel_name TEXT,
    message_id TEXT,
    message_content TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS anti_ping_strikes (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT,
    user_tag TEXT,
    strike_count INTEGER DEFAULT 0,
    tier INTEGER DEFAULT 1,
    last_strike_at INTEGER,
    last_punishment TEXT,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS anti_ping_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_tag TEXT,
    target_role_id TEXT,
    target_team_name TEXT,
    strike_number INTEGER,
    tier INTEGER,
    punishment TEXT,
    duration_minutes INTEGER DEFAULT 0,
    channel_id TEXT,
    message_id TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS giveaways (
    id TEXT PRIMARY KEY,
    channel_id TEXT,
    prize TEXT,
    winners_count INTEGER DEFAULT 1,
    ends_at INTEGER,
    ended INTEGER DEFAULT 0,
    entries_json TEXT DEFAULT '[]',
    winners_json TEXT DEFAULT '[]',
    created_by TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS erlc_logs_cache (
    id TEXT PRIMARY KEY,
    type TEXT,
    data_json TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    executor_id TEXT,
    target_id TEXT,
    details TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS welcome_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_tag TEXT,
    member_count INTEGER,
    channel_id TEXT,
    message_id TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS boost_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_tag TEXT,
    boost_level INTEGER,
    total_boosts INTEGER,
    channel_id TEXT,
    message_id TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS server_tag_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_tag TEXT,
    tag_detected TEXT,
    channel_id TEXT,
    message_id TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS verifications (
    discord_id TEXT PRIMARY KEY,
    discord_tag TEXT,
    roblox_id TEXT,
    roblox_username TEXT,
    roblox_display_name TEXT,
    roblox_avatar_url TEXT,
    bloxlink_status TEXT DEFAULT 'UNVERIFIED',
    verified INTEGER DEFAULT 0,
    staff_reviewer_id TEXT,
    staff_reviewer_tag TEXT,
    verified_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS ticket_automation_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT,
    channel_id TEXT,
    user_id TEXT,
    workflow_type TEXT,
    trigger_source TEXT,
    matched_phrase TEXT,
    status TEXT DEFAULT 'ACTIVE',
    data_json TEXT DEFAULT '{}',
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS ticket_auto_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT,
    workflow_type TEXT,
    message_id TEXT,
    trigger_phrase TEXT,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    role_id TEXT,
    reviewer_role_id TEXT,
    leader_id TEXT,
    leader_tag TEXT,
    co_leader_id TEXT,
    category_channel_id TEXT,
    results_channel_id TEXT,
    questions_json TEXT,
    active INTEGER DEFAULT 1,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS department_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id TEXT,
    user_id TEXT,
    user_tag TEXT,
    rank TEXT,
    callsign TEXT,
    status TEXT DEFAULT 'ACTIVE',
    joined_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS chain_of_command (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id TEXT,
    rank_name TEXT,
    rank_order INTEGER,
    user_id TEXT,
    user_tag TEXT,
    position_title TEXT,
    is_leadership INTEGER DEFAULT 0,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS application_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id TEXT,
    question_index INTEGER,
    question_prompt TEXT,
    answer_text TEXT,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS moderation_cases (
    id TEXT PRIMARY KEY,
    case_number INTEGER UNIQUE,
    action_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_username TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    moderator_username TEXT NOT NULL,
    reason TEXT NOT NULL,
    duration TEXT,
    duration_seconds INTEGER DEFAULT 0,
    timestamp INTEGER NOT NULL,
    expiration_timestamp INTEGER,
    status TEXT DEFAULT 'COMPLETED',
    dm_status TEXT DEFAULT 'SENT',
    related_case_id TEXT,
    delete_message_days INTEGER DEFAULT 0,
    evidence_notes TEXT
  );

  CREATE TABLE IF NOT EXISTS moderation_counters (
    name TEXT PRIMARY KEY,
    current_val INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS leave_of_absence (
    id TEXT PRIMARY KEY,
    request_number INTEGER UNIQUE,
    user_id TEXT NOT NULL,
    user_tag TEXT NOT NULL,
    roblox_username TEXT,
    role_display TEXT DEFAULT '@Staff Team',
    from_date TEXT NOT NULL,
    until_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    requested_from TEXT DEFAULT 'Discord',
    status TEXT DEFAULT 'PENDING',
    reviewer_id TEXT,
    reviewer_tag TEXT,
    review_reason TEXT,
    created_at INTEGER NOT NULL,
    reviewed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS loa_counters (
    name TEXT PRIMARY KEY,
    current_val INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS security_cases (
    id TEXT PRIMARY KEY,
    case_number INTEGER UNIQUE,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    roblox_id TEXT,
    roles_held TEXT,
    how_left TEXT DEFAULT 'Left on their own',
    actions_taken TEXT,
    resolved INTEGER DEFAULT 0,
    resolved_by_id TEXT,
    resolved_by_tag TEXT,
    resolved_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS security_counters (
    name TEXT PRIMARY KEY,
    current_val INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS erlc_event_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    channel_id TEXT,
    message_id TEXT,
    data_json TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_mod_target ON moderation_cases (target_id);
  CREATE INDEX IF NOT EXISTS idx_mod_moderator ON moderation_cases (moderator_id);
  CREATE INDEX IF NOT EXISTS idx_mod_action ON moderation_cases (action_type);
  CREATE INDEX IF NOT EXISTS idx_mod_status ON moderation_cases (status);
  CREATE INDEX IF NOT EXISTS idx_loa_user ON leave_of_absence (user_id);
  CREATE INDEX IF NOT EXISTS idx_loa_status ON leave_of_absence (status);
  CREATE INDEX IF NOT EXISTS idx_sec_user ON security_cases (user_id);
  CREATE INDEX IF NOT EXISTS idx_sec_resolved ON security_cases (resolved);
`);

// Safe column migrations for existing SQLite database instances
try {
  const afkCols = db.prepare("PRAGMA table_info(afk_status)").all().map(c => c.name);
  if (!afkCols.includes('original_nickname')) db.exec("ALTER TABLE afk_status ADD COLUMN original_nickname TEXT");
  if (!afkCols.includes('guild_id')) db.exec("ALTER TABLE afk_status ADD COLUMN guild_id TEXT");
  if (!afkCols.includes('user_tag')) db.exec("ALTER TABLE afk_status ADD COLUMN user_tag TEXT");
  if (!afkCols.includes('nickname_changed')) db.exec("ALTER TABLE afk_status ADD COLUMN nickname_changed INTEGER DEFAULT 0");
  if (!afkCols.includes('is_afk')) db.exec("ALTER TABLE afk_status ADD COLUMN is_afk INTEGER DEFAULT 1");

  const appCols = db.prepare("PRAGMA table_info(applications)").all().map(c => c.name);
  if (!appCols.includes('department_id')) db.exec("ALTER TABLE applications ADD COLUMN department_id TEXT DEFAULT 'staff'");
  if (!appCols.includes('department_name')) db.exec("ALTER TABLE applications ADD COLUMN department_name TEXT DEFAULT 'Staff Applications'");
  if (!appCols.includes('channel_id')) db.exec("ALTER TABLE applications ADD COLUMN channel_id TEXT");
  if (!appCols.includes('current_question_index')) db.exec("ALTER TABLE applications ADD COLUMN current_question_index INTEGER DEFAULT 0");
  if (!appCols.includes('groq_summary')) db.exec("ALTER TABLE applications ADD COLUMN groq_summary TEXT");
  if (!appCols.includes('interview_notes')) db.exec("ALTER TABLE applications ADD COLUMN interview_notes TEXT");
  if (!appCols.includes('denial_reason')) db.exec("ALTER TABLE applications ADD COLUMN denial_reason TEXT");
  if (!appCols.includes('change_request_notes')) db.exec("ALTER TABLE applications ADD COLUMN change_request_notes TEXT");
  const appealCols = db.prepare("PRAGMA table_info(infraction_appeals)").all().map(c => c.name);
  if (!appealCols.includes('user_id')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN user_id TEXT");
  if (!appealCols.includes('user_tag')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN user_tag TEXT");
  if (!appealCols.includes('channel_id')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN channel_id TEXT");
  if (!appealCols.includes('statement')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN statement TEXT");
  if (!appealCols.includes('sapling_score')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN sapling_score REAL DEFAULT 0");
  if (!appealCols.includes('sapling_ai_detected')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN sapling_ai_detected INTEGER DEFAULT 0");
  if (!appealCols.includes('sapling_summary')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN sapling_summary TEXT");
  if (!appealCols.includes('reviewer_tag')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN reviewer_tag TEXT");
  if (!appealCols.includes('reviewed_at')) db.exec("ALTER TABLE infraction_appeals ADD COLUMN reviewed_at INTEGER");
} catch (e) {
  // Ignore migration errors if already existing
}

// Seed default 15 application questions if empty
const countQuestions = db.prepare('SELECT COUNT(*) as count FROM application_questions').get().count;
if (countQuestions === 0) {
  const defaultQuestions = [
    { q: 1, p: 'What is your full Roblox username?', ph: 'e.g. carlos473' },
    { q: 2, p: 'What device do you play on?', ph: 'PC / Mobile / Console' },
    { q: 3, p: 'What is your time zone?', ph: 'e.g. EST / CST / PST / GMT' },
    { q: 4, p: 'How many hours can you moderate per week?', ph: 'e.g. 10-15 hours' },
    { q: 5, p: 'Do you have any prior staff or moderation experience? If so, where?', ph: 'Write in detail and full sentences' },
    { q: 6, p: 'Why do you want to join the WVRP staff team?', ph: 'Write in detail and full sentences' },
    { q: 7, p: 'What is RDM, and how would you handle it if someone broke this rule?', ph: 'Random Deathmatch explanation & protocol' },
    { q: 8, p: 'What is VDM, and how would you handle it if someone broke this rule?', ph: 'Vehicle Deathmatch explanation & protocol' },
    { q: 9, p: 'What is LTAP, and how would you handle it if someone broke this rule?', ph: 'Leaving To Avoid Punishment explanation & protocol' },
    { q: 10, p: 'What is FRP, and how would you handle it if someone broke this rule?', ph: 'Fear Roleplay explanation & protocol' },
    { q: 11, p: 'What is NLR, and how would you handle it if someone broke this rule?', ph: 'New Life Rule explanation & protocol' },
    { q: 12, p: 'What is the punishment if someone rejoins right after being kicked?', ph: 'Server protocol regarding rejoin evasion' },
    { q: 13, p: 'A player is spamming the in-game chat with inappropriate language after multiple warnings. Walk through exactly what you would do, step by step.', ph: 'Step-by-step moderation response' },
    { q: 14, p: 'Do you understand that you must remain professional at all times, both in-game and in Discord? Also confirm you understand asking staff to read your application results in denial.', ph: 'Yes / No with acknowledgment' },
    { q: 15, p: 'Is there anything else you would like the application team to know? (If not, put N/A)', ph: 'Additional notes or N/A' }
  ];

  const insertQ = db.prepare('INSERT INTO application_questions (question_number, prompt, placeholder, required) VALUES (?, ?, ?, 1)');
  for (const q of defaultQuestions) {
    insertQ.run(q.q, q.p, q.ph);
  }
}

// Seed default marketplace items if empty
const countMarketplace = db.prepare('SELECT COUNT(*) as count FROM marketplace_listings').get().count;
if (countMarketplace === 0) {
  const defaultListings = [
    { id: 'ad-everyone', cat: 'Paid Advertisements', title: '@Everyone Ping Paid Advertisement', desc: 'Send your ad in #paid-ads with an @everyone ping which reaches the entire server, offering maximum visibility.', price: 1500, perks: '["@everyone ping in #paid-ads", "Maximum reach", "Link allowed"]' },
    { id: 'ad-here', cat: 'Paid Advertisements', title: '@Here Ping Paid Advertisement', desc: 'Send your ad in #paid-ads with an @here ping which reaches all active online members.', price: 1000, perks: '["@here ping in #paid-ads", "Active online engagement"]' },
    { id: 'ad-reg', cat: 'Paid Advertisements', title: 'Regular Paid Advertisement', desc: 'Send your ad in #paid-ads with no ping, great value for engagement.', price: 500, perks: '["No-ping listing in #paid-ads"]' },
    { id: 'giveaway-everyone', cat: 'Sponsored Giveaways', title: '@Everyone Ping Sponsored Giveaway', desc: 'Host a giveaway in #giveaways with minimum 500 Robux prize. Participants must join your server.', price: 1200, perks: '["@everyone ping", "Mandatory server join requirement", "Min 500 Robux prize"]' },
    { id: 'giveaway-here', cat: 'Sponsored Giveaways', title: '@Here Ping Sponsored Giveaway', desc: 'Host a giveaway in #giveaways with @here ping and min 500 Robux prize.', price: 800, perks: '["@here ping", "Server join requirement"]' },
    { id: 'pkg-office-vc', cat: 'Packages', title: 'Custom Discord Office (Voice Channel)', desc: 'Receive a custom voice channel with your chosen name and emoji. Toggle who can join.', price: 750, perks: '["Custom VC name & emoji", "Manage permissions", "Permanent VC"]' },
    { id: 'pkg-vip', cat: 'Packages', title: 'VIP Package', desc: 'Receive the exclusive @VIP role, VIP channels, sneak peeks of early updates, and enter VIP giveaways.', price: 1000, perks: '["@VIP role", "VIP channels", "Sneak peeks", "VIP giveaways"]' },
    { id: 'pkg-wvrp-plus', cat: 'Packages', title: 'West Virginia+ Membership', desc: 'Exclusive @WVRP+ role, category access, early updates, and community prestige.', price: 1200, perks: '["@WVRP+ role", "Exclusive category", "Early updates"]' },
    { id: 'don-500', cat: 'Donations', title: '500 Robux Donation', desc: 'Support WVRP growth and receive the @Donator I role and donator lounge access.', price: 500, perks: '["@Donator I role", "Donator lounge", "Special recognition"]' },
    { id: 'don-1000', cat: 'Donations', title: '1,000 Robux Donation', desc: 'Receive the exclusive @Donator II role and early server updates.', price: 1000, perks: '["@Donator II role", "Early updates access"]' },
    { id: 'don-1500', cat: 'Donations', title: '1,500 Robux Donation', desc: 'Receive the prestigious @Donator III role and top supporter recognition.', price: 1500, perks: '["@Donator III role", "VIP benefits", "Top recognition"]' }
  ];

  const insertListing = db.prepare('INSERT INTO marketplace_listings (id, category, title, description, price_robux, perks_json, active) VALUES (?, ?, ?, ?, ?, ?, 1)');
  for (const item of defaultListings) {
    insertListing.run(item.id, item.cat, item.title, item.desc, item.price, item.perks);
  }
}
// Seed default departments if empty
const countDepartments = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
if (countDepartments === 0) {
  const defaultDepts = [
    {
      id: 'wvsp',
      name: 'West Virginia State Police (WVSP)',
      description: 'Primary state law enforcement division responsible for highway patrol, investigations, and high-risk tactical responses.',
      role_id: 'role_wvsp',
      reviewer_role_id: 'role_wvsp_leadership',
      leader_id: '2056966914',
      leader_tag: 'Colonel Carlos',
      questions: JSON.stringify([
        'What is your full Roblox username and current age?',
        'Why do you want to join the West Virginia State Police?',
        'What prior law enforcement or ER:LC police experience do you have?',
        'What is your understanding of the Chain of Command within WVSP?',
        'Explain what a 10-80 (vehicle pursuit) is and when it is appropriate to terminate pursuit.',
        'Explain the difference between lethal force and non-lethal (taser/baton) deployment.',
        'What is a felony stop (high-risk traffic stop) and what steps must you follow?',
        'How would you handle a fellow trooper engaging in corrupt or rule-breaking behavior?',
        'Explain the difference between RDM, VDM, and legitimate law enforcement action.',
        'What is Fear RP (FRP) and how should a civilian or suspect react when firearms are drawn on them?',
        'Describe how to properly write an in-game citation or arrest report in the CAD/MDT system.',
        'How do you maintain professional radio etiquette on the main dispatch channel?',
        'A civilian is verbally insulting you during a routine traffic stop. How do you respond?',
        'How many hours per week can you actively patrol on the WVSP team?',
        'Confirm you understand that asking staff or High Command to review your application results in automatic denial.'
      ])
    },
    {
      id: 'fire_ems',
      name: 'Kanawha Valley Fire & EMS',
      description: 'First responders providing rapid fire suppression, medical triage, hazardous material control, and rescue operations.',
      role_id: 'role_fire',
      reviewer_role_id: 'role_fire_leadership',
      leader_id: '1025813762684502168',
      leader_tag: 'Fire Chief Dave',
      questions: JSON.stringify([
        'What is your full Roblox username and current age?',
        'Why are you interested in serving with Kanawha Valley Fire & EMS?',
        'What prior medical roleplay or fire apparatus experience do you have in ER:LC?',
        'Explain the difference between Basic Life Support (BLS) and Advanced Life Support (ALS).',
        'A multi-vehicle collision has occurred on the highway with trapped victims. Walk through your initial scene size-up.',
        'What is the START triage method (Simple Triage and Rapid Treatment)?',
        'How do you safely operate heavy fire rescue apparatus during emergency code 3 responses?',
        'How would you handle a hazardous material (HAZMAT) leak or chemical spill scene?',
        'A bystander is attempting to interfere with active patient CPR. How do you de-escalate the situation?',
        'What is your procedure for structural firefighting and primary search & rescue in a building fire?',
        'How do you coordinate with law enforcement (WVSP) on joint emergency scenes?',
        'What equipment is required for firefighter interior structure safety (PPE/SCBA)?',
        'How many hours per week can you dedicate to fire and EMS operations?',
        'Do you understand you must maintain realistic medical roleplay at all times?',
        'Is there anything else you would like Kanawha Valley Fire & EMS leadership to know?'
      ])
    },
    {
      id: 'comms',
      name: 'Kanawha Emergency Communications',
      description: 'Central dispatch center coordinating radio frequencies, 911 calls, officer status checks, and multi-agency response.',
      role_id: 'role_comms',
      reviewer_role_id: 'role_comms_leadership',
      leader_id: '987654321',
      leader_tag: 'Dispatch Director Sarah',
      questions: JSON.stringify([
        'What is your Roblox username and time zone?',
        'Why do you want to become a certified Emergency Communications Operator?',
        'Rate your typing speed, multi-tasking skills, and radio code knowledge (1-10).',
        'An officer calls a 10-00 (Officer Down / Emergency Distress). Walk through your immediate radio broadcast.',
        'How do you prioritize simultaneous incoming 911 calls (e.g., active armed robbery vs noise complaint)?',
        'Walk through how you track unit availability (10-8, 10-7, 10-6, 10-97) in the CAD system.',
        'How do you maintain calm, clear, and steady voice/text communication during high-stress pursuits?',
        'A caller is panicking and unable to give their location. How do you assist them in pinpointing where they are?',
        'How do you coordinate mutual aid between State Police and Fire/EMS?',
        'What key information must be gathered from every 911 emergency call before dispatching units?',
        'Explain what BOLO (Be On the Lookout) means and what information should be broadcast.',
        'How do you handle accidental 911 calls or non-emergency administrative inquiries?',
        'What is your weekly availability for dispatch shifts?',
        'Do you agree to keep radio channels strictly professional and clear of non-essential chatter?',
        'Confirm you understand asking leadership to review your application will result in immediate disqualification.'
      ])
    },
    {
      id: 'dot',
      name: 'WV Division of Highways & Transportation (WVDOT)',
      description: 'Highway maintenance, incident management, road closures, heavy towing, and infrastructure safety.',
      role_id: 'role_dot',
      reviewer_role_id: 'role_dot_leadership',
      leader_id: '1122334455',
      leader_tag: 'Supervisor Miller',
      questions: JSON.stringify([
        'What is your full Roblox username and current age?',
        'Why do you want to join WVDOT rather than standard law enforcement?',
        'Describe your experience with traffic safety, scene management, and incident response.',
        'How do you properly secure a major highway accident scene to protect civilian drivers and emergency personnel?',
        'Explain how you deploy traffic cones, safety flares, and variable message signs (VMS).',
        'How would you handle an impatient driver attempting to bypass an active road closure barrier?',
        'Describe the procedure for clearing disabled or wrecked vehicles off the main travel lanes.',
        'How do you coordinate with State Police troopers when assisting on high-speed pursuit crashes?',
        'What steps do you take when responding to severe winter weather or hazardous road conditions?',
        'Explain the proper use of emergency amber lights versus red/blue emergency lights.',
        'How do you inspect and document damaged roadway infrastructure or guardrails?',
        'A commercial semi-truck has lost cargo blocking two highway lanes. What is your action plan?',
        'How many hours per week can you actively patrol as a WVDOT incident technician?',
        'Do you understand you must follow all traffic laws and safety procedures while in service?',
        'Confirm you understand that asking staff to review this application leads to immediate denial.'
      ])
    },
    {
      id: 'media',
      name: 'WVRP Media Team',
      description: 'Creative department capturing cinematic roleplay footage, photography, community trailers, and social outreach.',
      role_id: 'role_media',
      reviewer_role_id: 'role_media_leadership',
      leader_id: '2056966914',
      leader_tag: 'Media Lead Alex',
      questions: JSON.stringify([
        'What is your Roblox username and Discord tag?',
        'Why do you want to join the WVRP Media & Cinematic Team?',
        'What video editing software or graphic design tools do you actively use?',
        'Provide links to 1-3 examples of your previous roleplay cinematography, photography, or graphic designs.',
        'How would you capture high-intensity emergency scenes without interfering with active roleplay?',
        'What camera angles and recording settings (Freecam/cinematic) do you use in ER:LC?',
        'How do you ensure all media content adheres to WVRP community guidelines and branding?',
        'If a staff member or officer asks you to step back from an active crime scene, how do you respond?',
        'Describe your experience creating short-form content (TikTok, YouTube Shorts) versus long-form cinematic trailers.',
        'How do you handle constructive criticism and revision requests from Media Leadership?',
        'What ideas do you have for upcoming WVRP community showcase videos or events?',
        'How often can you produce edited media assets or event photography for the server?',
        'Are you capable of working under tight deadlines for major server update announcements?',
        'Do you agree that all media produced for WVRP remains the property of West Virginia State Roleplay?',
        'Confirm you understand asking leadership to evaluate your application results in automatic denial.'
      ])
    },
    {
      id: 'staff',
      name: 'WVRP Staff Team (Trainee Moderator)',
      description: 'Community regulation, server moderation, support ticket resolution, and rule enforcement.',
      role_id: 'role_staff_trainee',
      reviewer_role_id: 'role_high_rank',
      leader_id: '2056966914',
      leader_tag: 'Head of Staff Carlos',
      questions: JSON.stringify([
        'What is your full Roblox username?',
        'What device do you play on?',
        'What is your time zone?',
        'How many hours can you moderate per week?',
        'Do you have any prior staff or moderation experience? If so, where?',
        'Why do you want to join the WVRP staff team?',
        'What is RDM, and how would you handle it if someone broke this rule?',
        'What is VDM, and how would you handle it if someone broke this rule?',
        'What is LTAP, and how would you handle it if someone broke this rule?',
        'What is FRP, and how would you handle it if someone broke this rule?',
        'What is NLR, and how would you handle it if someone broke this rule?',
        'What is the punishment if someone rejoins right after being kicked?',
        'A player is spamming the in-game chat with inappropriate language after multiple warnings. Walk through exactly what you would do, step by step.',
        'Do you understand that you must remain professional at all times, both in-game and in Discord? Also confirm you understand asking staff to read your application results in denial.',
        'Is there anything else you would like the application team to know? (If not, put N/A)'
      ])
    }
  ];

  const insertDept = db.prepare(`
    INSERT INTO departments (id, name, description, role_id, reviewer_role_id, leader_id, leader_tag, questions_json, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  for (const dept of defaultDepts) {
    insertDept.run(dept.id, dept.name, dept.description, dept.role_id, dept.reviewer_role_id, dept.leader_id, dept.leader_tag, dept.questions, Date.now());
  }
} else {
  // Migration: Ensure all existing departments have exactly 15 questions
  const updateDeptQ = db.prepare('UPDATE departments SET questions_json = ? WHERE id = ?');
  const existingDepts = db.prepare('SELECT id, questions_json FROM departments').all();
  for (const ed of existingDepts) {
    try {
      const parsed = JSON.parse(ed.questions_json || '[]');
      if (parsed.length < 15) {
        if (ed.id === 'wvsp') {
          updateDeptQ.run(JSON.stringify([
            'What is your full Roblox username and current age?',
            'Why do you want to join the West Virginia State Police?',
            'What prior law enforcement or ER:LC police experience do you have?',
            'What is your understanding of the Chain of Command within WVSP?',
            'Explain what a 10-80 (vehicle pursuit) is and when it is appropriate to terminate pursuit.',
            'Explain the difference between lethal force and non-lethal (taser/baton) deployment.',
            'What is a felony stop (high-risk traffic stop) and what steps must you follow?',
            'How would you handle a fellow trooper engaging in corrupt or rule-breaking behavior?',
            'Explain the difference between RDM, VDM, and legitimate law enforcement action.',
            'What is Fear RP (FRP) and how should a civilian or suspect react when firearms are drawn on them?',
            'Describe how to properly write an in-game citation or arrest report in the CAD/MDT system.',
            'How do you maintain professional radio etiquette on the main dispatch channel?',
            'A civilian is verbally insulting you during a routine traffic stop. How do you respond?',
            'How many hours per week can you actively patrol on the WVSP team?',
            'Confirm you understand that asking staff or High Command to review your application results in automatic denial.'
          ]), 'wvsp');
        } else if (ed.id === 'fire_ems') {
          updateDeptQ.run(JSON.stringify([
            'What is your full Roblox username and current age?',
            'Why are you interested in serving with Kanawha Valley Fire & EMS?',
            'What prior medical roleplay or fire apparatus experience do you have in ER:LC?',
            'Explain the difference between Basic Life Support (BLS) and Advanced Life Support (ALS).',
            'A multi-vehicle collision has occurred on the highway with trapped victims. Walk through your initial scene size-up.',
            'What is the START triage method (Simple Triage and Rapid Treatment)?',
            'How do you safely operate heavy fire rescue apparatus during emergency code 3 responses?',
            'How would you handle a hazardous material (HAZMAT) leak or chemical spill scene?',
            'A bystander is attempting to interfere with active patient CPR. How do you de-escalate the situation?',
            'What is your procedure for structural firefighting and primary search & rescue in a building fire?',
            'How do you coordinate with law enforcement (WVSP) on joint emergency scenes?',
            'What equipment is required for firefighter interior structure safety (PPE/SCBA)?',
            'How many hours per week can you dedicate to fire and EMS operations?',
            'Do you understand you must maintain realistic medical roleplay at all times?',
            'Is there anything else you would like Kanawha Valley Fire & EMS leadership to know?'
          ]), 'fire_ems');
        } else if (ed.id === 'comms') {
          updateDeptQ.run(JSON.stringify([
            'What is your Roblox username and time zone?',
            'Why do you want to become a certified Emergency Communications Operator?',
            'Rate your typing speed, multi-tasking skills, and radio code knowledge (1-10).',
            'An officer calls a 10-00 (Officer Down / Emergency Distress). Walk through your immediate radio broadcast.',
            'How do you prioritize simultaneous incoming 911 calls (e.g., active armed robbery vs noise complaint)?',
            'Walk through how you track unit availability (10-8, 10-7, 10-6, 10-97) in the CAD system.',
            'How do you maintain calm, clear, and steady voice/text communication during high-stress pursuits?',
            'A caller is panicking and unable to give their location. How do you assist them in pinpointing where they are?',
            'How do you coordinate mutual aid between State Police and Fire/EMS?',
            'What key information must be gathered from every 911 emergency call before dispatching units?',
            'Explain what BOLO (Be On the Lookout) means and what information should be broadcast.',
            'How do you handle accidental 911 calls or non-emergency administrative inquiries?',
            'What is your weekly availability for dispatch shifts?',
            'Do you agree to keep radio channels strictly professional and clear of non-essential chatter?',
            'Confirm you understand asking leadership to review your application will result in immediate disqualification.'
          ]), 'comms');
        } else if (ed.id === 'dot') {
          updateDeptQ.run(JSON.stringify([
            'What is your full Roblox username and current age?',
            'Why do you want to join WVDOT rather than standard law enforcement?',
            'Describe your experience with traffic safety, scene management, and incident response.',
            'How do you properly secure a major highway accident scene to protect civilian drivers and emergency personnel?',
            'Explain how you deploy traffic cones, safety flares, and variable message signs (VMS).',
            'How would you handle an impatient driver attempting to bypass an active road closure barrier?',
            'Describe the procedure for clearing disabled or wrecked vehicles off the main travel lanes.',
            'How do you coordinate with State Police troopers when assisting on high-speed pursuit crashes?',
            'What steps do you take when responding to severe winter weather or hazardous road conditions?',
            'Explain the proper use of emergency amber lights versus red/blue emergency lights.',
            'How do you inspect and document damaged roadway infrastructure or guardrails?',
            'A commercial semi-truck has lost cargo blocking two highway lanes. What is your action plan?',
            'How many hours per week can you actively patrol as a WVDOT incident technician?',
            'Do you understand you must follow all traffic laws and safety procedures while in service?',
            'Confirm you understand that asking staff to review this application leads to immediate denial.'
          ]), 'dot');
        } else if (ed.id === 'media') {
          updateDeptQ.run(JSON.stringify([
            'What is your Roblox username and Discord tag?',
            'Why do you want to join the WVRP Media & Cinematic Team?',
            'What video editing software or graphic design tools do you actively use?',
            'Provide links to 1-3 examples of your previous roleplay cinematography, photography, or graphic designs.',
            'How would you capture high-intensity emergency scenes without interfering with active roleplay?',
            'What camera angles and recording settings (Freecam/cinematic) do you use in ER:LC?',
            'How do you ensure all media content adheres to WVRP community guidelines and branding?',
            'If a staff member or officer asks you to step back from an active crime scene, how do you respond?',
            'Describe your experience creating short-form content (TikTok, YouTube Shorts) versus long-form cinematic trailers.',
            'How do you handle constructive criticism and revision requests from Media Leadership?',
            'What ideas do you have for upcoming WVRP community showcase videos or events?',
            'How often can you produce edited media assets or event photography for the server?',
            'Are you capable of working under tight deadlines for major server update announcements?',
            'Do you agree that all media produced for WVRP remains the property of West Virginia State Roleplay?',
            'Confirm you understand asking leadership to evaluate your application results in automatic denial.'
          ]), 'media');
        }
      }
    } catch (e) {
      // Ignore migration errors
    }
  }
}

// Seed default Chain of Command hierarchy if empty
const countCoC = db.prepare('SELECT COUNT(*) as count FROM chain_of_command').get().count;
if (countCoC === 0) {
  const defaultCoC = [
    { dept: 'general', rank: 'Community Owner / Founder', order: 1, id: '2056966914', tag: 'CarlosValdivia', title: 'Community Executive', lead: 1 },
    { dept: 'general', rank: 'Directive Team / Board', order: 2, id: '987654321', tag: 'TaranBatman', title: 'Community Directive', lead: 1 },
    { dept: 'general', rank: 'Head of Staff / Management', order: 3, id: '1025813762684502168', tag: 'Puppylover130915', title: 'Senior High Rank', lead: 1 },
    { dept: 'general', rank: 'Senior Administrator', order: 4, id: '314159265', tag: 'DeputySmith', title: 'High Rank Operations', lead: 0 },
    { dept: 'general', rank: 'Server Moderator', order: 5, id: '1122334455', tag: 'OfficerDave', title: 'Staff Moderator', lead: 0 },
    { dept: 'general', rank: 'Trial Trainee', order: 6, id: '9988776655', tag: 'CadetJohn', title: 'Staff Trainee', lead: 0 },
    { dept: 'wvsp', rank: 'Colonel / Superintendent', order: 1, id: '2056966914', tag: 'Colonel Carlos', title: 'State Police Commander', lead: 1 },
    { dept: 'wvsp', rank: 'Lieutenant Colonel', order: 2, id: '987654321', tag: 'Lt. Colonel Wayne', title: 'Executive Officer', lead: 1 },
    { dept: 'wvsp', rank: 'Captain', order: 3, id: '314159265', tag: 'Capt. Smith', title: 'Troop Commander', lead: 0 },
    { dept: 'fire_ems', rank: 'Fire Chief', order: 1, id: '1025813762684502168', tag: 'Chief Dave', title: 'Department Head', lead: 1 },
    { dept: 'fire_ems', rank: 'Assistant Chief', order: 2, id: '1122334455', tag: 'Asst. Chief Miller', title: 'EMS Operations', lead: 1 }
  ];

  const insertCoC = db.prepare(`
    INSERT INTO chain_of_command (department_id, rank_name, rank_order, user_id, user_tag, position_title, is_leadership, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of defaultCoC) {
    insertCoC.run(item.dept, item.rank, item.order, item.id, item.tag, item.title, item.lead, Date.now());
  }
}

export default db;

