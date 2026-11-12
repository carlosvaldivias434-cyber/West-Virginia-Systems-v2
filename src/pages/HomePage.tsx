import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DevLoginModal } from '../components/DevLoginModal';
import { LiveStats } from '../types';
import {
  Shield,
  Users,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  FileText,
  AlertTriangle,
  Scale,
  MapPin,
  Flame,
  CheckCircle2,
  Activity,
  ArrowRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    document.title = 'Home · WVSP';

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/public/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.warn('Failed loading stats:', e);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-900">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#00A8FF]/10 via-[#00A8FF]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A8FF]/10 border border-[#00A8FF]/30 text-[#00A8FF] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00A8FF] animate-ping" />
                <span>OFFICIAL ER:LC COMMUNITY · WEST VIRGINIA</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.08]">
                West Virginia <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-[#00A8FF]">
                  State Roleplay
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-normal max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A professional ER:LC roleplay community built on realistic experiences, professional departments and an active community.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href={stats?.community.discordInviteUrl || 'https://discord.gg/wvrp'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-sm transition-all shadow-lg shadow-[#5865F2]/25 group"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Join Our Discord</span>
                  <ExternalLink className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a
                  href={stats?.community.quickJoinUrl || 'https://policeroleplay.community/join/wvrp'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00A8FF] hover:bg-[#0092dd] text-slate-950 font-bold text-sm transition-all shadow-lg shadow-[#00A8FF]/20 group"
                >
                  <Radio className="w-4 h-4" />
                  <span>Quick Join ER:LC</span>
                  <ExternalLink className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right Hero Image (Using the exact uploaded/configured hero image) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-[#00A8FF]/30 shadow-2xl shadow-[#00A8FF]/10 group">
                <img
                  src="/banners/wvrp-banner-top.svg"
                  alt="West Virginia State Roleplay Banner"
                  className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">Whitelisted Server Active</span>
                  </div>
                  <span className="text-[#00A8FF] font-mono font-medium">WVSP-SERVER-1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUR LIVE STAT CARDS */}
      <section className="py-10 border-b border-slate-900 bg-[#040c1a]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stat 1: Players In-Game */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 hover:border-[#00A8FF]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Players In-Game</span>
                <Users className="w-4 h-4 text-[#00A8FF]" />
              </div>
              {loadingStats ? (
                <div className="h-8 w-24 bg-slate-800 animate-pulse rounded my-1" />
              ) : stats?.erlc.status === 'UNAVAILABLE' ? (
                <p className="text-base font-bold text-slate-400">Unavailable</p>
              ) : (
                <p className="text-2xl font-black text-white">
                  {stats?.erlc.players ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.erlc.maxPlayers ?? 50}</span>
                </p>
              )}
              <div className="text-[11px] text-slate-500 mt-1">Live from ER:LC v1</div>
            </div>

            {/* Stat 2: In Queue */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 hover:border-[#00A8FF]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">In Queue</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              {loadingStats ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded my-1" />
              ) : stats?.erlc.status === 'UNAVAILABLE' ? (
                <p className="text-base font-bold text-slate-400">Unavailable</p>
              ) : (
                <p className="text-2xl font-black text-amber-400">
                  {stats?.erlc.queue ?? 0} <span className="text-xs font-normal text-slate-400">waiting</span>
                </p>
              )}
              <div className="text-[11px] text-slate-500 mt-1">Priority queue available</div>
            </div>

            {/* Stat 3: Discord Members */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 hover:border-[#00A8FF]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Discord Members</span>
                <Activity className="w-4 h-4 text-[#5865F2]" />
              </div>
              {loadingStats ? (
                <div className="h-8 w-20 bg-slate-800 animate-pulse rounded my-1" />
              ) : (
                <p className="text-2xl font-black text-white">
                  {stats?.discord.memberCount.toLocaleString() ?? '20,028'}
                </p>
              )}
              <div className="text-[11px] text-slate-500 mt-1">
                {stats?.discord.onlineCount.toLocaleString() ?? '4,406'} online right now
              </div>
            </div>

            {/* Stat 4: Staff On Duty */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 hover:border-[#00A8FF]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Staff On Duty</span>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              {loadingStats ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded my-1" />
              ) : (
                <p className="text-2xl font-black text-emerald-400">
                  {stats?.staff.onDutyCount ?? 0} <span className="text-xs font-normal text-slate-400">troopers</span>
                </p>
              )}
              <div className="text-[11px] text-slate-500 mt-1">Active moderation active</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STAFF PANEL SHOWCASE (REAL CSS/HTML MOCKUP) */}
      <section className="py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <p className="text-xs uppercase font-bold text-[#00A8FF] tracking-wider">Unified Command Operations</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              State-of-the-Art Staff Operations Panel
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Equipped with real-time shift quota tracking, live GPS map positioning, automated watchdog detection, and in-game emergency management.
            </p>
          </div>

          {/* Interactive CSS/HTML Mockup of Staff Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-4 sm:p-8 overflow-hidden relative">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">wvsp.portal/staff/overview</span>
              </div>
              <span className="text-xs text-[#00A8FF] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00A8FF] animate-pulse" />
                <span>Console Live</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mockup Box 1: Shift Quota Gauge */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Weekly Quota Progress</span>
                  <span className="text-xs text-[#00A8FF] font-bold">75%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#00A8FF] h-full rounded-full w-3/4 shadow-sm shadow-[#00A8FF]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>2h 30m logged</span>
                  <span>Target: 3h 20m</span>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Duty Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> On Duty
                  </span>
                </div>
              </div>

              {/* Mockup Box 2: Live Radar Map Coordinates */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Appalachian Sector GPS</span>
                  <MapPin className="w-4 h-4 text-[#00A8FF]" />
                </div>
                <div className="h-24 rounded-lg bg-slate-950 border border-slate-800/80 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#00A8FF_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400 absolute top-4 left-10 shadow-lg shadow-sky-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute bottom-6 right-12" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400 absolute top-8 right-16 animate-ping opacity-75" />
                  <span className="text-[10px] font-mono text-slate-400 z-10 bg-slate-900/80 px-2 py-0.5 rounded">
                    38 Blips Tracking
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>WVSP Patrol Units: 4</span>
                  <span>KCSO Units: 3</span>
                </div>
              </div>

              {/* Mockup Box 3: Automated Watchdog */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Watchdog Protection</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">RDM Velocity Check</span>
                    <span className="text-emerald-400 text-[11px]">Normal</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">NLR Distance Tracker</span>
                    <span className="text-emerald-400 text-[11px]">Active</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  Learns from leadership reviews automatically.
                </div>
              </div>
            </div>

            {/* Showcase CTA Button */}
            <div className="mt-8 text-center">
              <Link
                to="/staff"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00A8FF] to-sky-500 hover:from-[#0092dd] hover:to-sky-600 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-[#00A8FF]/20"
              >
                <span>Open Staff Panel</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GET INVOLVED SECTION (3 REAL CARDS) */}
      <section className="py-20 border-b border-slate-900 bg-[#030a17]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-2">
            <p className="text-xs uppercase font-bold text-[#00A8FF] tracking-wider">Recruitment & Oversight</p>
            <h2 className="text-3xl font-extrabold text-white">Get Involved in WVSP</h2>
            <p className="text-sm text-slate-400">
              Explore open departments or submit formal inquiries directly to server management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Staff Application */}
            <Link
              to="/apply"
              className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-[#00A8FF]/50 p-6 flex flex-col justify-between group transition-all hover:bg-slate-900 hover:shadow-xl hover:shadow-[#00A8FF]/5"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#00A8FF]/10 border border-[#00A8FF]/30 flex items-center justify-center text-[#00A8FF]">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#00A8FF] transition-colors">
                  Staff Application
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Join our certified law enforcement, dispatch, or emergency divisions. Complete our thorough 15-question questionnaire evaluated by High Command.
                </p>
              </div>
              <div className="pt-6 flex items-center gap-1.5 text-xs text-[#00A8FF] font-semibold">
                <span>Start Application</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Discord Appeal */}
            <Link
              to="/appeal"
              className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 p-6 flex flex-col justify-between group transition-all hover:bg-slate-900 hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  Discord Appeal
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Submit a formal appeal for Discord warnings, timeouts, or kicks. Each appeal is independently reviewed by Server Management with evidence review.
                </p>
              </div>
              <div className="pt-6 flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <span>Submit Discord Appeal</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: In-Game Ban Appeal */}
            <Link
              to="/ban-appeal"
              className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-red-500/50 p-6 flex flex-col justify-between group transition-all hover:bg-slate-900 hover:shadow-xl hover:shadow-red-500/5"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                  In-Game Ban Appeal
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Appeal an ER:LC server ban. Approved appeals trigger automated in-game unban execution through our administrative gateway.
                </p>
              </div>
              <div className="pt-6 flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                <span>Appeal In-Game Ban</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. YOUR STATS PREVIEW SECTION */}
      <section className="py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Personalized Player Stats & Records
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connect your Discord account to view your linked Roblox persona, combat history, moderation case records, and saved ticket transcripts.
              </p>
            </div>

            <div>
              {user ? (
                <Link
                  to="/my-profile"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00A8FF] hover:bg-[#0092dd] text-slate-950 font-bold text-sm transition-all shadow-lg shadow-[#00A8FF]/20"
                >
                  <span>View Your Profile ({user.username})</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-sm transition-all shadow-lg shadow-[#5865F2]/25"
                >
                  <Shield className="w-4 h-4" />
                  <span>Sign In with Discord</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <DevLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};
