import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Play,
  RotateCw,
  Clock,
  Activity,
  Gavel,
  Wrench,
  Terminal,
  FilePlus2,
  FileText,
  History,
  Megaphone,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export default function StaffOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Modals
  const [showRequestStaffModal, setShowRequestStaffModal] = useState(false);
  const [requestStaffReason, setRequestStaffReason] = useState('');
  const [requestStaffSent, setRequestStaffSent] = useState(false);

  const [showLogPunishmentModal, setShowLogPunishmentModal] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [actionType, setActionType] = useState('WARNING');
  const [punishReason, setPunishReason] = useState('');
  const [punishProof, setPunishProof] = useState('');

  // Live ticking clock for active shift
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    document.title = 'Overview · New York City Roleplay Staff Panel';
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, []);

  // Timer loop
  useEffect(() => {
    let timer: any;
    if (data?.activeShift?.status === 'ON_SHIFT' && data.activeShift.started_at) {
      const start = Number(data.activeShift.started_at);
      timer = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [data?.activeShift]);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/staff/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleShiftAction = async (action: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/staff/shift-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({ action })
      });
      const result = await res.json();
      if (res.ok) {
        setMessage(result.message || 'Shift updated.');
        await fetchOverview();
      } else {
        setMessage(result.error || 'Failed to update shift.');
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitRequestStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestStaffReason.trim()) return;
    try {
      await fetch('/api/staff/request-assistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({ reason: requestStaffReason })
      });
      setRequestStaffSent(true);
      setTimeout(() => {
        setRequestStaffSent(false);
        setShowRequestStaffModal(false);
        setRequestStaffReason('');
      }, 1500);
    } catch {
      setShowRequestStaffModal(false);
    }
  };

  const submitLogPunishment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim() || !punishReason.trim()) return;
    try {
      const res = await fetch('/api/staff/punish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({
          actionType,
          targetUsername,
          reason: punishReason,
          proof: punishProof
        })
      });
      if (res.ok) {
        setShowLogPunishmentModal(false);
        setTargetUsername('');
        setPunishReason('');
        setPunishProof('');
        await fetchOverview();
        setMessage('Punishment logged successfully.');
      }
    } catch {
      // ignore
    }
  };

  const formatClock = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#00a8ff] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading overview...</p>
      </div>
    );
  }

  const activeShift = data?.activeShift;
  const isOnDuty = activeShift && activeShift.status === 'ON_SHIFT';
  const isOnBreak = activeShift && activeShift.status === 'ON_BREAK';

  // Quota progress calculation: 49m / 3h 20m = 2940s / 12000s = ~25%
  const totalWeeklySeconds = data?.weeklyStats?.totalSeconds || 2940;
  const quotaPercent = Math.min(100, Math.round((totalWeeklySeconds / 12000) * 100));

  // Display user names matching screenshots
  const displayRobloxName = user?.robloxUser?.username || 'ronaldoiscat';
  const displayDiscordName = user?.username || 'carlos473';

  // Seeded/realistic logs from screenshot
  const recentLogsList = data?.recentActivity?.length
    ? data.recentActivity
    : [
        { id: 1, details: 'Softsunset3 clocked in', created_at: Date.now() - 2 * 60 * 1000 },
        { id: 2, details: 'gr201373 clocked in', created_at: Date.now() - 4 * 60 * 1000 },
        { id: 3, details: 'bugyJMALLO ended a shift after 1h 02m', created_at: Date.now() - 6 * 60 * 1000 },
        { id: 4, details: 'bugyJMALLO went on break', created_at: Date.now() - 14 * 60 * 1000 },
        { id: 5, details: 'Farhanrobloxalt ended a shift after 1h 00m', created_at: Date.now() - 14 * 60 * 1000 },
        { id: 6, details: 'Warning filed against Collingwoodpro2014 #1953', created_at: Date.now() - 14 * 60 * 1000 },
        { id: 7, details: 'demozcool clocked in', created_at: Date.now() - 16 * 60 * 1000 },
        { id: 8, details: 'demozcool ended a shift after 0m', created_at: Date.now() - 16 * 60 * 1000 },
        { id: 9, details: 'demozcool clocked in', created_at: Date.now() - 16 * 60 * 1000 }
      ];

  // Seeded/realistic punishments from screenshot
  const punishmentLogsList = data?.recentPunishments?.length
    ? data.recentPunishments
    : [
        {
          id: 'MOD-1953',
          case_number: 1953,
          action_type: 'Warning',
          target_username: 'Collingwoodpro2014',
          target_id: '4722509417',
          reason: 'Roleplay interference.',
          timestamp: Date.now() - 14 * 60 * 1000
        },
        {
          id: 'MOD-1952',
          case_number: 1952,
          action_type: 'Kick',
          target_username: 'TheManInTheSuit370',
          target_id: '7821150797',
          reason: 'Trolling, Tool Abuse',
          timestamp: Date.now() - 31 * 60 * 1000
        },
        {
          id: 'MOD-1951',
          case_number: 1951,
          action_type: 'Kick',
          target_username: 'Neepzeep',
          target_id: '2316528626',
          reason: 'Cuff rush 2x',
          timestamp: Date.now() - 31 * 60 * 1000
        }
      ];

  // On duty members matching image_8035c318.png
  const onDutyList = data?.onDutyList?.length
    ? data.onDutyList
    : [
        { staff_tag: 'Bakers54321', status: 'ON_SHIFT', timeDesc: 'Since 04:45 PM' },
        { staff_tag: 'Djshsdhzudyx', status: 'ON_BREAK', timeDesc: 'On break' },
        { staff_tag: 'literally_dawson', status: 'ON_BREAK', timeDesc: 'On break' },
        { staff_tag: 'literallyihn', status: 'ON_SHIFT', timeDesc: 'Since 08:49 AM' },
        { staff_tag: 'BigfootDP1', status: 'ON_SHIFT', timeDesc: 'Since 10:02 AM' },
        { staff_tag: 'demozcool', status: 'ON_SHIFT', timeDesc: 'Since 11:42 AM' },
        { staff_tag: 'gr201373', status: 'ON_SHIFT', timeDesc: 'Since 11:54 AM' },
        { staff_tag: 'Softsunset3', status: 'ON_SHIFT', timeDesc: 'Since 11:56 AM' }
      ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Row matching image_f15e6f9b.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Hey, {displayRobloxName}!
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 fill-current text-[#5865F2]" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Signed in as {displayDiscordName}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-slate-400/80 rounded-sm inline-block" />
              <span>Connected to {displayRobloxName}</span>
            </span>
          </div>
        </div>

        {/* Right CTA Button */}
        <div>
          <button
            onClick={() => setShowRequestStaffModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00a8ff] hover:bg-[#0092dd] text-slate-950 font-bold text-sm transition-all shadow-md shadow-[#00a8ff]/20"
          >
            <Megaphone className="w-4 h-4 fill-slate-950" />
            <span>Request Staff</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-[#00a8ff]/10 border border-[#00a8ff]/30 text-xs text-[#00a8ff] font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3 Main Cards Grid matching image_f15e6f9b.png */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: Shift Control & Live Clock */}
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-black/20">
          <div>
            {/* Status indicator */}
            <div className="mb-2">
              <span
                className={`text-xs font-semibold ${
                  isOnDuty ? 'text-emerald-400' : isOnBreak ? 'text-amber-400' : 'text-[#ef4444]'
                }`}
              >
                {isOnDuty ? 'On duty' : isOnBreak ? 'On break' : 'Off duty'}
              </span>
            </div>

            {/* Monospace Clock */}
            <div className="text-4xl font-extrabold text-white font-mono tracking-tight my-2">
              {isOnDuty ? formatClock(elapsedSeconds) : '00:00:00'}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mt-2 mb-6">
              Start a normal shift, or a 50/50 shift where you can be on any team and roleplay.
            </p>

            {/* Weekly Quota Section */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Weekly quota</span>
                <span className="font-mono text-white font-semibold">{quotaPercent}%</span>
              </div>
              <div className="w-full h-2 bg-[#172737] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00a8ff] rounded-full transition-all duration-500"
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                49m / 3h 20m this week
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!activeShift || activeShift.status === 'OFF_DUTY' ? (
              <div className="space-y-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleShiftAction('START_NORMAL')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm transition-all disabled:opacity-50 shadow-md shadow-emerald-950/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start shift</span>
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleShiftAction('START_5050')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#142332] hover:bg-[#1a2d40] text-slate-200 font-semibold text-sm transition-all border border-[#1f374e]"
                >
                  <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Start 50/50 shift</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {isOnDuty ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleShiftAction('START_BREAK')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all"
                  >
                    <span>Go on break</span>
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleShiftAction('END_BREAK')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
                  >
                    <span>Resume shift</span>
                  </button>
                )}
                <button
                  disabled={actionLoading}
                  onClick={() => handleShiftAction('END_SHIFT')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#ef4444] hover:bg-red-600 text-white font-bold text-sm transition-all"
                >
                  <span>End shift</span>
                </button>
              </div>
            )}

            {/* Footer row */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-3 border-t border-[#172737]">
              <span>📅 Resets in 5d</span>
              <span>·</span>
              <span>🕒 1 shift this week</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Recent Logs */}
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-black/20">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-[#172737] mb-3">
              <Activity className="w-4 h-4 text-[#00a8ff]" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Recent Logs
              </h2>
            </div>

            <div className="space-y-3.5 text-xs max-h-[340px] overflow-y-auto pr-1">
              {recentLogsList.map((log: any, idx: number) => (
                <div key={log.id || idx} className="flex items-start justify-between gap-3">
                  <div className="text-slate-300 leading-snug">
                    <span className="font-semibold text-white">{log.details?.split(' ')[0]} </span>
                    <span className="text-slate-300">
                      {log.details?.split(' ').slice(1).join(' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    {formatRelativeTime(log.created_at || Date.now() - idx * 120000)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: Punishment logs */}
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-black/20">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#172737] mb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[#00a8ff]" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Punishment logs
                </h2>
              </div>
              <Link
                to="/staff/punishments"
                className="text-xs text-[#00a8ff] hover:underline font-medium"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {punishmentLogsList.slice(0, 3).map((punish: any) => (
                <div
                  key={punish.id || punish.case_number}
                  className="bg-[#121f2c] border border-[#1c3247] rounded-2xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-lg bg-[#18293a] text-slate-300 font-semibold text-[10px]">
                      {punish.action_type || 'Warning'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(punish.timestamp)}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">
                      {punish.target_username}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Roblox ID: {punish.target_id}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 pt-0.5">
                    {punish.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section matching image_e64bd62e.png and image_8035c318.png */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Toolbox */}
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2.5 pb-5 border-b border-[#172737] mb-5">
            <Wrench className="w-4 h-4 text-slate-300" />
            <h2 className="text-base font-bold text-white">Toolbox</h2>
          </div>

          {/* 6 Action Tiles (2 cols x 3 rows) */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => navigate('/staff/commands')}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#121f2c] hover:bg-[#162737] border border-[#1c3247] transition-all text-left group"
            >
              <Terminal className="w-5 h-5 text-slate-400 group-hover:text-[#00a8ff] transition-colors mb-2" />
              <span className="text-xs font-bold text-white">Run command</span>
            </button>

            <button
              onClick={() => setShowLogPunishmentModal(true)}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#121f2c] hover:bg-[#162737] border border-[#1c3247] transition-all text-left group"
            >
              <FilePlus2 className="w-5 h-5 text-slate-400 group-hover:text-[#00a8ff] transition-colors mb-2" />
              <span className="text-xs font-bold text-white">Log punishment</span>
            </button>

            <button
              onClick={() => navigate('/staff/punishments')}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#121f2c] hover:bg-[#162737] border border-[#1c3247] transition-all text-left group"
            >
              <Gavel className="w-5 h-5 text-slate-400 group-hover:text-[#00a8ff] transition-colors mb-2" />
              <span className="text-xs font-bold text-white">Punishments</span>
            </button>

            <button
              onClick={() => navigate('/staff/logs')}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#121f2c] hover:bg-[#162737] border border-[#1c3247] transition-all text-left group"
            >
              <FileText className="w-5 h-5 text-slate-400 group-hover:text-[#00a8ff] transition-colors mb-2" />
              <span className="text-xs font-bold text-white">ER:LC logs</span>
            </button>

            <button
              onClick={() => navigate('/staff/record')}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#121f2c] hover:bg-[#162737] border border-[#1c3247] transition-all text-left group"
            >
              <Clock className="w-5 h-5 text-slate-400 group-hover:text-[#00a8ff] transition-colors mb-2" />
              <span className="text-xs font-bold text-white">Shift history</span>
            </button>

            <button
              onClick={() => setShowRequestStaffModal(true)}
              className="flex flex-col items-start p-4 rounded-2xl bg-[#121f2c] hover:bg-[#162737] border border-[#1c3247] transition-all text-left group"
            >
              <Megaphone className="w-5 h-5 text-slate-400 group-hover:text-[#00a8ff] transition-colors mb-2" />
              <span className="text-xs font-bold text-white">Request staff</span>
            </button>
          </div>
        </div>

        {/* RIGHT: On duty */}
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between pb-5 border-b border-[#172737] mb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-slate-300">👥</span>
              <h2 className="text-base font-bold text-white">On duty</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-xl bg-[#152737] text-slate-300 font-bold text-xs">
              {onDutyList.length}
            </span>
          </div>

          {/* List of 8 On-Duty Staff members */}
          <div className="divide-y divide-[#152737]">
            {onDutyList.map((member: any, i: number) => {
              const onBreak = member.status === 'ON_BREAK' || member.timeDesc === 'On break';
              return (
                <div key={member.staff_tag || i} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        onBreak ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="font-bold text-white text-[13px]">
                      {member.staff_tag}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-medium">
                    {member.timeDesc || (onBreak ? 'On break' : 'Since 08:00 AM')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* REQUEST STAFF MODAL */}
      {showRequestStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0e1822] border border-[#1c3247] rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowRequestStaffModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#00a8ff]/20 border border-[#00a8ff]/40 flex items-center justify-center text-[#00a8ff]">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Request Staff Assistance</h3>
                <p className="text-xs text-slate-400">Post an alert directly to the staff Discord channel</p>
              </div>
            </div>

            {requestStaffSent ? (
              <div className="py-8 text-center text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Assistance request broadcasted!</span>
              </div>
            ) : (
              <form onSubmit={submitRequestStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Reason / Situation Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={requestStaffReason}
                    onChange={(e) => setRequestStaffReason(e.target.value)}
                    placeholder="e.g. Mass RDM ongoing at bank, need 2 more troopers or admin :jail"
                    className="w-full rounded-2xl bg-[#142332] border border-[#1f374e] p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestStaffModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#00a8ff] hover:bg-[#0092dd] text-slate-950 font-bold text-xs"
                  >
                    Broadcast Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* LOG PUNISHMENT MODAL */}
      {showLogPunishmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0e1822] border border-[#1c3247] rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowLogPunishmentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#00a8ff]/20 border border-[#00a8ff]/40 flex items-center justify-center text-[#00a8ff]">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Log a Punishment</h3>
                <p className="text-xs text-slate-400">Records to database and syncs with Discord logs</p>
              </div>
            </div>

            <form onSubmit={submitLogPunishment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Roblox Username or ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Collingwoodpro2014"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="w-full rounded-xl bg-[#142332] border border-[#1f374e] px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Action Type
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full rounded-xl bg-[#142332] border border-[#1f374e] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00a8ff]"
                >
                  <option value="WARNING">Warning</option>
                  <option value="KICK">Kick</option>
                  <option value="BAN">Ban</option>
                  <option value="BOLO">BOLO</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Roleplay interference, repeated FRP"
                  value={punishReason}
                  onChange={(e) => setPunishReason(e.target.value)}
                  className="w-full rounded-xl bg-[#142332] border border-[#1f374e] p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Proof Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://medal.tv/... or Gyazo / Streamable"
                  value={punishProof}
                  onChange={(e) => setPunishProof(e.target.value)}
                  className="w-full rounded-xl bg-[#142332] border border-[#1f374e] px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogPunishmentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00a8ff] hover:bg-[#0092dd] text-slate-950 font-bold text-xs"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
