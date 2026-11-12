import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Gavel,
  Search,
  Plus,
  Users,
  ExternalLink,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const filterPills = [
  'All',
  'Warning',
  'Kick',
  'Ban',
  'BOLO',
  'Note',
  'Active BOLOs',
  'Voided'
];

export default function PunishmentsPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State matching image_a4445cfc.png
  const [showLogModal, setShowLogModal] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [targetId, setTargetId] = useState('');
  const [actionType, setActionType] = useState('Warning');
  const [reason, setReason] = useState('');
  const [proof, setProof] = useState('');
  const [duration, setDuration] = useState('7 days');
  const [submitting, setSubmitting] = useState(false);
  const [playerHistory, setPlayerHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    document.title = 'Punishments · New York City Roleplay Staff Panel';
    fetchCases();
  }, [activeFilter]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const typeParam = activeFilter === 'All' ? 'ALL' : activeFilter.toUpperCase();
      const res = await fetch(`/api/staff/punishments?type=${typeParam}&search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  // Lookup target player history when username is entered
  const lookupPlayer = async (name: string) => {
    if (!name.trim()) {
      setPlayerHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/staff/player-lookup?query=${encodeURIComponent(name.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setPlayerHistory(data.history || []);
        if (data.player?.id) setTargetId(data.player.id);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitLogPunishment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim() || !reason.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/staff/punishments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({
          targetUsername: targetUsername.trim(),
          targetId: targetId.trim() || '4722509417',
          actionType: actionType.toUpperCase(),
          reason: reason.trim(),
          proof: proof.trim(),
          duration: actionType === 'Ban' ? duration : null
        })
      });

      if (res.ok) {
        setShowLogModal(false);
        setTargetUsername('');
        setReason('');
        setProof('');
        setPlayerHistory([]);
        await fetchCases();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const formatWhen = (timestamp: number) => {
    const d = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${month} ${day}, ${h12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header matching image_e52de247.png */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Punishments
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every warning, kick, ban and BOLO logged here or in-game with <code className="bg-[#122434] text-[#00a8ff] px-1 py-0.5 rounded font-mono">:log</code>. Each one is also posted to the punishment log channel.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveFilter('All')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0e1822] hover:bg-[#142433] border border-[#1a2d40] text-slate-200 text-xs font-semibold transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>View All Punishments</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Log a punishment</span>
          </button>
        </div>
      </div>

      {/* Filter Pills + Search Bar matching image_e52de247.png */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1">
          {filterPills.map((pill) => {
            const isActive = activeFilter === pill;
            return (
              <button
                key={pill}
                onClick={() => setActiveFilter(pill)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#152737] text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1822]'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full lg:w-80">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a141e] border border-[#142332] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0e1822] hover:bg-[#152535] border border-[#1a2d40] text-slate-200 font-semibold text-xs transition-colors shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Punishments Table matching image_e52de247.png */}
      <div className="bg-[#0e1822] border border-[#182735] rounded-3xl overflow-hidden shadow-lg shadow-black/20">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#00a8ff] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-slate-400">Loading punishment records...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No punishments recorded under the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#081018] text-[#8094a6] text-[11px] font-medium border-b border-[#142332]">
                <tr>
                  <th className="py-3.5 px-4 font-normal">Case</th>
                  <th className="py-3.5 px-4 font-normal">Type</th>
                  <th className="py-3.5 px-4 font-normal">Player</th>
                  <th className="py-3.5 px-4 font-normal">Reason</th>
                  <th className="py-3.5 px-4 font-normal">Logged by</th>
                  <th className="py-3.5 px-4 font-normal">From</th>
                  <th className="py-3.5 px-4 font-normal">Proof</th>
                  <th className="py-3.5 px-4 font-normal">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142332] text-slate-200">
                {cases.map((c) => (
                  <tr key={c.id || c.case_number} className="hover:bg-[#121f2c]/50 transition-colors">
                    {/* Case Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#00a8ff]">
                      #{c.case_number || c.id?.replace('MOD-', '') || '1953'}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#162534] text-slate-300 font-semibold text-[10px]">
                        {c.action_type || 'Warning'}
                      </span>
                    </td>

                    {/* Target Player */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white hover:text-[#00a8ff] cursor-pointer">
                        {c.target_username}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm truncate" title={c.reason}>
                      {c.reason}
                    </td>

                    {/* Logged by */}
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 font-semibold text-slate-200 cursor-pointer">
                        <span>{c.moderator_username}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </span>
                    </td>

                    {/* From */}
                    <td className="py-3.5 px-4 text-slate-400">
                      In-game
                    </td>

                    {/* Proof */}
                    <td className="py-3.5 px-4">
                      {c.evidence_notes || c.proof ? (
                        <a
                          href={c.evidence_notes || c.proof}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#00a8ff] hover:underline flex items-center gap-1"
                        >
                          <span>Clip</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* When */}
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatWhen(c.timestamp || Date.now())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2-COLUMN LOG PUNISHMENT MODAL matching image_a4445cfc.png */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0e1822] border border-[#1b3145] rounded-3xl p-6 w-full max-w-3xl shadow-2xl relative my-8">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#172737]">
              <div className="w-10 h-10 rounded-2xl bg-[#00a8ff]/20 border border-[#00a8ff]/40 flex items-center justify-center text-[#00a8ff]">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Log a Punishment</h3>
                <p className="text-xs text-slate-400">Record an official sanction to player history and sync in-game</p>
              </div>
            </div>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT COLUMN: Create a log */}
              <form onSubmit={submitLogPunishment} className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Create a log
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Player Roblox Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Collingwoodpro2014"
                    value={targetUsername}
                    onChange={(e) => {
                      setTargetUsername(e.target.value);
                      lookupPlayer(e.target.value);
                    }}
                    className="w-full bg-[#142332] border border-[#1f374e] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Punishment Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full bg-[#142332] border border-[#1f374e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00a8ff]"
                  >
                    <option value="Warning">Warning</option>
                    <option value="Kick">Kick</option>
                    <option value="Ban">Ban</option>
                    <option value="BOLO">BOLO</option>
                    <option value="Note">Note</option>
                  </select>
                </div>

                {actionType === 'Ban' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Ban Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-[#142332] border border-[#1f374e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00a8ff]"
                    >
                      <option value="1 day">1 Day</option>
                      <option value="3 days">3 Days</option>
                      <option value="7 days">7 Days</option>
                      <option value="30 days">30 Days</option>
                      <option value="Permanent">Permanent</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Reason
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="State the rule violation clearly..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[#142332] border border-[#1f374e] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Proof Link (Medal, Streamable, Discord)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={proof}
                    onChange={(e) => setProof(e.target.value)}
                    className="w-full bg-[#142332] border border-[#1f374e] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit punishment log'}
                  </button>
                </div>
              </form>

              {/* RIGHT COLUMN: Player's logs lookup & In-game tip */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Player's logs
                </div>

                <div className="bg-[#121f2c] border border-[#1c3247] rounded-2xl p-4 min-h-[160px] text-xs">
                  {historyLoading ? (
                    <p className="text-slate-400 text-center py-8">Looking up player records...</p>
                  ) : playerHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p>No prior punishments recorded for this user.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Clean moderation record.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {playerHistory.map((ph, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-[#0e1822] border border-[#172737]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-white">{ph.action_type}</span>
                            <span className="text-slate-400">{formatWhen(ph.timestamp)}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">{ph.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick command tip */}
                <div className="p-3 rounded-2xl bg-[#00a8ff]/10 border border-[#00a8ff]/30 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-[#00a8ff] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Quick Command Tip</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    In-game, you can also run <code className="text-[#00a8ff] font-mono">:log &lt;player&gt; &lt;reason&gt;</code> directly from chat. It automatically syncs to this registry and posts to Discord!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
