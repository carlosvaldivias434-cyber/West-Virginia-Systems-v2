import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Key,
  Users,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

const rulesList = [
  'Do not abuse permissions for personal advantage or during active roleplay scenarios.',
  'Always use :log or the panel to record kicks, bans, and formal warnings.',
  'Never run server-wide commands (:m, :h, :time, :weather) without Command Staff authorization.',
  'Respect NLR (New Life Rule) and Fear RP even when on staff team unless actively taking a sit.',
  'Off-duty staff are subject to all standard server roleplay rules.',
  'In-game commands must never be used against fellow staff members without IA oversight.',
  'Logging false proof or fabricating player records results in immediate blacklist.',
  'Any permissions issues must be reported to the Tech Department via tickets.'
];

export default function GetCommandsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'commands' | 'group'>('commands');
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const displayRoblox = user?.robloxUser?.username || 'ronaldoiscat';

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/staff/sync-permissions', { method: 'POST' });
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Tabs matching image_c624ac58.png */}
      <div className="flex items-center gap-1 p-1 bg-[#0a141e] border border-[#142332] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('commands')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'commands'
              ? 'bg-[#152737] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Commands
        </button>
        <button
          onClick={() => setActiveTab('group')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'group'
              ? 'bg-[#152737] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Group
        </button>
      </div>

      {activeTab === 'commands' ? (
        <div className="space-y-6">
          {/* In-game permissions Card matching image_c624ac58.png */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#172737]">
              <div>
                <h1 className="text-xl font-extrabold text-white">In-game permissions</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your server commands are synced directly to your Roblox account.
                </p>
              </div>
              <button
                disabled={syncing}
                onClick={handleSync}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#142332] hover:bg-[#1b2f42] border border-[#1f374e] text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : syncDone ? 'Synced!' : 'Sync permissions'}</span>
              </button>
            </div>

            {/* Green Banner matching image_c624ac58.png */}
            <div className="p-4 rounded-2xl bg-[#0f2d25] border border-[#175240] flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-emerald-200">
                You already have <strong className="text-white font-semibold">Administrator</strong> on <strong className="text-white font-semibold">{displayRoblox}</strong>. Your in-game permissions are synced with your Roblox group rank.
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-3.5 rounded-2xl bg-[#121f2c] border border-[#1c3247]">
                <span className="text-[11px] text-slate-400 font-medium block">Current Rank Tier</span>
                <span className="text-base font-bold text-white mt-1 block">Lead Administrator</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#121f2c] border border-[#1c3247]">
                <span className="text-[11px] text-slate-400 font-medium block">Authorized Account</span>
                <span className="text-base font-bold text-[#00a8ff] mt-1 block font-mono">{displayRoblox}</span>
              </div>
            </div>
          </div>

          {/* Rules Section matching image_c624ac58.png */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
            <h2 className="text-base font-bold text-white mb-4">Rules</h2>
            <ol className="space-y-3 text-xs text-slate-300 pl-1">
              {rulesList.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#142332] border border-[#1f374e] text-slate-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        /* TAB: GROUP */
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00a8ff]/20 border border-[#00a8ff]/40 flex items-center justify-center text-[#00a8ff]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Roblox Community Group</h2>
              <p className="text-xs text-slate-400">Join our official Roblox group to verify your rank in-game</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Ensure your Roblox account is a member of the New York City Roleplay group. In-game moderation permissions, vehicle liveries, and team unlocks synchronize directly with your group rank.
          </p>

          <div className="pt-2">
            <a
              href="https://www.roblox.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00a8ff] hover:bg-[#0092dd] text-slate-950 font-bold text-xs transition-colors"
            >
              <span>View Roblox Group</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
