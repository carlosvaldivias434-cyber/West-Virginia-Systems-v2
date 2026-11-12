import React, { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  Key,
  BookOpen,
  Radio,
  Trophy,
  MapPin,
  Terminal,
  Gavel,
  UserCheck,
  CheckSquare,
  ShieldAlert,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function StaffLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [guidesOpen, setGuidesOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Watchdog Alert #3303', desc: 'OcelotGamerRizz flagged for high severity LTAP', time: '4m ago', unread: true },
    { id: 2, title: 'New Application APP-0130', desc: 'woy543 submitted Staff Application (Integrity 40%)', time: '18m ago', unread: true },
    { id: 3, title: 'Shift Quota Reminder', desc: 'Weekly quota resets in 5 days (Current: 49m / 3h 20m)', time: '1h ago', unread: false }
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060d13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00a8ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !user.isStaff) {
    return (
      <div className="min-h-screen bg-[#060d13] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d1720] border border-[#182735] rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white">Staff Clearance Required</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The New York City Roleplay Staff Panel is restricted to verified staff members, field troopers, and command staff.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {!user ? (
              <a
                href="/api/auth/login"
                className="w-full py-2.5 rounded-xl bg-[#00a8ff] text-slate-950 font-bold text-sm hover:bg-[#0092dd] transition-colors"
              >
                Sign In with Discord
              </a>
            ) : (
              <Link
                to="/"
                className="w-full py-2.5 rounded-xl bg-[#142332] text-slate-200 font-semibold text-sm hover:bg-[#1a2d40] transition-colors"
              >
                Return to Community Home
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active link styling matching screenshot (pure dark teal with subtle light text or active pill)
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
      isActive
        ? 'bg-[#142433] text-white font-semibold'
        : 'text-[#8799a9] hover:text-white hover:bg-[#0e1924]'
    }`;

  const currentSectionName = () => {
    const p = location.pathname;
    if (p === '/staff' || p === '/staff/overview') return 'Overview';
    if (p === '/staff/record') return 'My Record';
    if (p === '/staff/get-commands') return 'Commands & Group';
    if (p.includes('/guides') || p.includes('/guide')) return 'Guides';
    if (p === '/staff/shifts') return 'Active Shifts';
    if (p === '/staff/leaderboard') return 'Leaderboard';
    if (p === '/staff/map') return 'Live Map';
    if (p === '/staff/commands') return 'Commands';
    if (p === '/staff/punishments') return 'Punishments';
    if (p === '/staff/lookup') return 'Player Lookup';
    if (p === '/staff/reviews') return 'Reviews';
    if (p === '/staff/watchdog') return 'Watchdog AI';
    if (p === '/staff/logs') return 'ER:LC Logs';
    if (p === '/staff/transcripts') return 'Transcripts';
    return 'Panel';
  };

  const getBreadcrumbParent = () => {
    const p = location.pathname;
    if (p === '/staff' || p.includes('/record') || p.includes('/get-commands') || p.includes('/guide')) {
      return 'You';
    }
    if (p.includes('/shifts') || p.includes('/leaderboard')) {
      return 'Team';
    }
    return 'Server';
  };

  return (
    <div className="min-h-screen bg-[#060d13] text-[#cfd9e3] flex flex-col md:flex-row antialiased selection:bg-[#00a8ff]/30 selection:text-white">
      {/* Sidebar matching image_f15e6f9b.png */}
      <aside className="w-full md:w-64 bg-[#081018] border-r border-[#132230] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo & Header */}
          <Link to="/" className="flex items-center gap-3 px-2 pt-1 pb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#112d44] to-[#0c1a27] border border-[#1d4365] p-1.5 shadow-md flex items-center justify-center shrink-0">
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-[#00a8ff]">
                <path
                  d="M24 4L7 11V22C7 32.5 14.3 42.1 24 44C33.7 42.1 41 32.5 41 22V11L24 4Z"
                  stroke="#00a8ff"
                  strokeWidth="2.5"
                  fill="#0c2235"
                />
                <path
                  d="M24 12V36M16 20L24 12L32 20M15 32H33"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-[14px] font-bold text-white tracking-tight leading-tight">
                New York City Roleplay
              </div>
              <div className="text-[12px] text-slate-400 font-medium">
                Staff Panel
              </div>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-5">
            {/* YOU */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 px-3 py-1">
                You
              </div>
              <NavLink to="/staff" end className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Overview</span>
              </NavLink>
              <NavLink to="/staff/record" className={navLinkClass}>
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>My Record</span>
              </NavLink>
              <NavLink to="/staff/get-commands" className={navLinkClass}>
                <Key className="w-4 h-4 text-slate-400" />
                <span>Commands & Group</span>
              </NavLink>

              {/* Collapsible Guides */}
              <div>
                <button
                  onClick={() => setGuidesOpen(!guidesOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-[#8799a9] hover:text-white hover:bg-[#0e1924] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Guides</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      guidesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {guidesOpen && (
                  <div className="ml-7 pl-2 border-l border-[#142332] space-y-1 mt-1">
                    <NavLink
                      to="/staff/guides"
                      className={({ isActive }) =>
                        `block py-1.5 px-2 rounded-lg text-xs transition-colors ${
                          isActive
                            ? 'text-[#00a8ff] font-semibold bg-[#0c1f2e]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`
                      }
                    >
                      Staff Guide
                    </NavLink>
                    <NavLink
                      to="/staff/punishment-guide"
                      className={({ isActive }) =>
                        `block py-1.5 px-2 rounded-lg text-xs transition-colors ${
                          isActive
                            ? 'text-[#00a8ff] font-semibold bg-[#0c1f2e]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`
                      }
                    >
                      Punishment Guide
                    </NavLink>
                    <NavLink
                      to="/staff/instructor-guide"
                      className={({ isActive }) =>
                        `block py-1.5 px-2 rounded-lg text-xs transition-colors ${
                          isActive
                            ? 'text-[#00a8ff] font-semibold bg-[#0c1f2e]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`
                      }
                    >
                      Instructor Guide
                    </NavLink>
                  </div>
                )}
              </div>
            </div>

            {/* TEAM */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 px-3 py-1">
                Team
              </div>
              <NavLink to="/staff/shifts" className={navLinkClass}>
                <Radio className="w-4 h-4 text-slate-400" />
                <span>Active Shifts</span>
              </NavLink>
              <NavLink to="/staff/leaderboard" className={navLinkClass}>
                <Trophy className="w-4 h-4 text-slate-400" />
                <span>Leaderboard</span>
              </NavLink>
            </div>

            {/* SERVER */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 px-3 py-1">
                Server
              </div>
              <NavLink to="/staff/map" className={navLinkClass}>
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Live Map</span>
              </NavLink>
              <NavLink to="/staff/commands" className={navLinkClass}>
                <Terminal className="w-4 h-4 text-slate-400" />
                <span>Commands</span>
              </NavLink>
              <NavLink to="/staff/punishments" className={navLinkClass}>
                <Gavel className="w-4 h-4 text-slate-400" />
                <span>Punishments</span>
              </NavLink>
              <NavLink to="/staff/lookup" className={navLinkClass}>
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>Player Lookup</span>
              </NavLink>
              <NavLink to="/staff/reviews" className={navLinkClass}>
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span>Reviews</span>
              </NavLink>
              <NavLink to="/staff/watchdog" className={navLinkClass}>
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <span>Watchdog AI</span>
              </NavLink>
              <NavLink to="/staff/logs" className={navLinkClass}>
                <FileText className="w-4 h-4 text-slate-400" />
                <span>ER:LC Logs</span>
              </NavLink>
              <NavLink to="/staff/transcripts" className={navLinkClass}>
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span>Transcripts</span>
              </NavLink>
            </div>
          </nav>
        </div>

        {/* Bottom Profile Anchor */}
        <div className="pt-4 border-t border-[#132230] mt-6">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full border border-[#1f374e] object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.robloxUser?.username || user.username}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {user.isManagement ? 'Management' : user.isHighRank ? 'High Rank' : 'Staff Member'}
                </p>
              </div>
            </div>
            <Link
              to="/"
              title="Return to Site"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#142332] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header matching image_f15e6f9b.png */}
        <header className="h-16 bg-[#081018]/90 backdrop-blur-md border-b border-[#132230] px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          {/* Breadcrumb + Beta Notice */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>{getBreadcrumbParent()}</span>
              <span>&rsaquo;</span>
              <span className="text-white font-medium">{currentSectionName()}</span>
            </div>

            {/* Beta Banner */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0e1822] border border-[#1a2d40] text-xs">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px] uppercase">
                Beta
              </span>
              <span className="text-slate-400 text-[11px] truncate">
                The staff panel is in beta. For any bugs or suggestions, DM silex.
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Bell Notification with red count 21 */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl bg-[#0e1822] hover:bg-[#152535] border border-[#1a2d40] text-slate-300 hover:text-white transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#ef4444] text-white text-[10px] font-bold rounded-full min-w-4 text-center shadow">
                  21
                </span>
              </button>

              {notificationsOpen && (
                <div
                  onMouseLeave={() => setNotificationsOpen(false)}
                  className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0e1822] border border-[#1e3448] shadow-2xl p-3 z-50 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#192d3f] px-1">
                    <span className="font-bold text-white">Notifications</span>
                    <span className="text-[10px] text-[#00a8ff] cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="divide-y divide-[#152737] mt-1">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2.5 px-1 hover:bg-[#132332] rounded-lg transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* In-game count pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e1822] border border-[#1a2d40] text-xs text-slate-300">
              <span className="text-slate-400">👥</span>
              <span className="font-medium">47 of 50 in-game</span>
            </div>

            {/* On-duty count pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e1822] border border-[#1a2d40] text-xs text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-medium">8 on duty</span>
            </div>

            {/* Shift status pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1822] border border-[#1a2d40] text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Off duty</span>
            </div>

            {/* User Dropdown matching image_3e74cc7c.png */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-[#0e1822] hover:bg-[#142433] border border-[#1a2d40] transition-colors"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-[#00a8ff]/40"
                />
                <span className="text-xs font-semibold text-white hidden md:inline">
                  {user.robloxUser?.username || user.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0d1720] border border-[#1c3247] shadow-2xl py-2 z-50 text-[13px]"
                >
                  <Link
                    to="/staff"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-[#142433] hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Staff Panel</span>
                  </Link>

                  <Link
                    to="/my-profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-[#142433] hover:text-white transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-slate-400" />
                    <span>My Stats</span>
                  </Link>

                  <a
                    href="https://discord.gg"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-slate-200 hover:bg-[#142433] hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>Join Discord</span>
                  </a>

                  <div className="border-t border-[#172b3c] my-1.5" />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-2 text-[#ef4444] hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-[#ef4444]" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
