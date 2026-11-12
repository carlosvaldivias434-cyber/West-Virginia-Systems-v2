# West Virginia State Roleplay (WVSP) — Platform & Staff Command Panel

Production-grade web portal, Discord OAuth2 gateway, and Staff Command Panel for **West Virginia State Roleplay** (short name: **WVSP**), an Emergency Response: Liberty County (ER:LC) Roblox community.

Built with React, TypeScript, Tailwind CSS, Express, and a unified SQLite database shared synchronously with the WVRP Discord Bot.

---

## 🌟 Architecture & Highlights

### 1. Unified Database (`better-sqlite3` in WAL mode)
- Both the Discord bot and the Web Server read and write to the **exact same SQLite database file** via the path configured in `DB_PATH` or `DATABASE_PATH` (defaults to `./database/wvrp.sqlite`).
- Database migrations run on boot and guarantee safe additions without altering or dropping existing bot tables (`applications`, `tickets`, `infractions`, `moderation_cases`, `staff_active_status`, `audit_logs`, `blacklists`, `departments`).
- Atomic sequential ID generation inside transactions (`APP-XXXX`, `DAPL-XXXX`, `GAPL-XXXX`, `MOD-XXXX`) ensures zero race conditions.

### 2. Discord OAuth2 & Server-Enforced RBAC
- Real Authorization Code flow with cryptographic random `state` in httpOnly cookies.
- Signed httpOnly, Secure, SameSite=Lax 12-hour session cookies.
- **Server-Side Authorization**: Every staff route (`/api/staff/*`) is verified on the server on every request via role IDs:
  - `STAFF_ROLE_IDS`: Trooper Overview, My Record, Punishments, Player Lookup, Active Shifts, Leaderboard, Reviews, Live Map, ER:LC Logs, Get Commands, Group Roster, Watchdog.
  - `HIGH_RANK_ROLE_IDS`: In-game commands runner (`:pm`, `:m`, `:h`, `:kick`, `:bring`, `:to`, `:unban`).
  - `MANAGEMENT_ROLE_IDS`: Handbook editor, 23-offense Punishment Matrix editor, Instructor Guide editor, and Watchdog AI sensitivity settings.
- Developer simulation modal (`DevLoginModal`) allows instant 1-click test logins across all clearance tiers when running in development environments.

### 3. Public Web Portal
- **Home**: Live server stats cards (Players, Queue, Discord Members, Active Troopers), interactive staff panel preview, and direct pathways to apply and appeal.
- **Applications (`/apply`)**: Department picker and interactive 15-question application system with live step progression, server validation, and instant reference ID (`APP-XXXX`).
- **Discord Appeals (`/appeal`)**: Formal infraction appeal portal with instant reference tracking (`DAPL-XXXX`).
- **Game Ban Appeals (`/ban-appeal`)**: ER:LC server ban appeal portal with automatic unban integration on approval (`GAPL-XXXX`).
- **Member Portal (`/my-profile`)**: Discord account overview, linked Roblox verification status, combat stats, past sanctions, and archived ticket transcripts.
- **Transcripts Directory (`/transcripts`)**: Searchable index of closed support tickets with chat history viewer (`/transcripts/:id`).
- **Legal**: Official Privacy Policy (`/privacy`) and Terms of Service (`/terms`).

### 4. Staff Command Panel (`/staff`)
- **Trooper Overview**: Live shift clock in (Normal & 50/50 Dual Shift), break management, clock out with duration credit, weekly quota tracker (3h 20m goal), and live duty roster.
- **My Record**: Personal service dossier detailing active/revoked infractions, rank advancements, and historical shift logs.
- **Punishments Registry**: Filterable sanction logs (BAN, KICK, MUTE, UNMUTE) with search and "Log Punishment" modal.
- **Player Lookup**: Instant Roblox user dossier with verification check, previous moderation cases, and combat records.
- **Active Shifts**: Real-time ticking roster of on-duty troopers.
- **Shift Leaderboard**: Duty ranking table with Quota Met, Below Quota, and Exempt badges.
- **Live Tactical Map**: HTML5 Canvas radar displaying live in-game player coordinates color-coded by department (State Police, Sheriff, Fire/EMS, DOT, Civilian) with blip inspection modal.
- **ER:LC Telemetry Logs**: Live in-game logs feed with auto-refresh and filters (Joins, Kills, Commands).
- **Commands Console**: Safe high-rank in-game command executor with confirmation dialogs and mass-target protection.
- **Get Commands**: Synchronized in-game privilege status checker.
- **Roblox Group**: Pending recruitment requests reviewer with instant acceptance actions.
- **Reviews Queue**: Unified adjudication center for candidate applications, Discord appeals, and in-game ban appeals with automatic ER:LC unban trigger.
- **Watchdog AI**: Autonomous anti-abuse sentinel with confidence scoring and quick intervention buttons (PM Warning, Teleport, Kick, Ban, Dismiss).
- **Official Handbooks**: Staff Handbook, 23-Offence Punishment Matrix, and Instructor Academy Guide with Management editor.
- **Leadership Configuration**: Watchdog thresholds and executive directive prompts.

---

## 🛠️ Configuration & Environment (`.env`)

```env
# Discord Bot & OAuth2
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/callback
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_guild_id
SESSION_SECRET=a_very_secure_random_session_secret_key

# Database
DB_PATH=./database/wvrp.sqlite

# Role Permissions (Discord Role IDs, comma-separated)
STAFF_ROLE_IDS=123456789012345678,234567890123456789
HIGH_RANK_ROLE_IDS=345678901234567890
MANAGEMENT_ROLE_IDS=456789012345678901

# ER:LC API Integration
ERLC_SERVER_KEY=your_erlc_server_key
ERLC_API_BASE=https://api.erlc.gg/v2

# Community Links
PUBLIC_URL=http://localhost:3000
DISCORD_INVITE_URL=https://discord.gg/wvrp
ROBLOX_GROUP_URL=https://www.roblox.com/groups/34567890/West-Virginia-State-Roleplay
ROBLOX_GROUP_ID=34567890
ERLC_QUICK_JOIN_URL=https://policeroleplay.community/join/wvrp
```

---

## 🚀 Running the Server

```bash
# Install dependencies
npm install

# Start full-stack application (Dev server with Vite middleware on port 3000)
npm run dev

# Or start in production
npm run build
npm start
```

---

## ⚖️ Legal Disclaimer
© West Virginia State Roleplay. Not affiliated with or endorsed by Roblox, Discord or Police Roleplay Community.
