import React, { useState, useEffect } from 'react';
import { Search, User, Shield, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function PlayerLookupPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const recentPlayers = [
    'Collingwoodpro2014',
    'TheManInTheSuit370',
    'Neepzeep',
    'OcelotGamerRizz',
    'bugyJMALLO',
    'Farhanrobloxalt'
  ];

  useEffect(() => {
    document.title = 'Player Lookup · New York City Roleplay Staff Panel';
  }, []);

  const doLookup = async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setSearched(true);
    setQuery(name);
    try {
      const res = await fetch(`/api/staff/player-lookup?username=${encodeURIComponent(name.trim())}`);
      if (res.ok) {
        setResult(await res.json());
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doLookup(query);
  };

  const cases = result?.cases || [];
  const warnings = cases.filter((c: any) => c.action_type === 'WARNING').length;
  const kicks = cases.filter((c: any) => c.action_type === 'KICK').length;
  const bans = cases.filter((c: any) => c.action_type === 'BAN').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header matching image_499e957b.png */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Player Lookup</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review previous punishments, verified Roblox identity, and in-game infractions.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              required
              placeholder="Enter Roblox username or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#09121a] border border-[#182a3c] rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-[#00a8ff] hover:bg-[#0092dd] text-slate-950 font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Recently Punished Players Selector */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Recently punished:</span>
          {recentPlayers.map((rp) => (
            <button
              key={rp}
              type="button"
              onClick={() => doLookup(rp)}
              className="px-3 py-1 rounded-xl bg-[#142332] hover:bg-[#1b2f42] border border-[#1f374e] text-slate-300 text-[11px] font-semibold transition-colors"
            >
              {rp}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#00a8ff] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-400">Loading player record...</p>
        </div>
      ) : searched && result ? (
        <div className="space-y-6">
          {/* Profile & Metrics */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#172737]">
              <div>
                <h2 className="text-2xl font-extrabold text-white">{result.searchedUsername}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Roblox ID: <span className="font-mono text-slate-300">{result.targetId || '4722509417'}</span>
                </p>
              </div>

              {/* 4 Quick Stat Pills */}
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-xl bg-[#142332] border border-[#1f374e] text-center">
                  <div className="text-[10px] text-slate-400">Warnings</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">{warnings}</div>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#142332] border border-[#1f374e] text-center">
                  <div className="text-[10px] text-slate-400">Kicks</div>
                  <div className="text-sm font-bold text-orange-400 font-mono">{kicks}</div>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#142332] border border-[#1f374e] text-center">
                  <div className="text-[10px] text-slate-400">Bans</div>
                  <div className="text-sm font-bold text-red-400 font-mono">{bans}</div>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#142332] border border-[#1f374e] text-center">
                  <div className="text-[10px] text-slate-400">Total</div>
                  <div className="text-sm font-bold text-white font-mono">{cases.length}</div>
                </div>
              </div>
            </div>

            {/* Cases History */}
            <div className="pt-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Moderation History
              </h3>

              {cases.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No prior punishments on record. Clean history.</span>
                </div>
              ) : (
                <div className="divide-y divide-[#172737]">
                  {cases.map((c: any) => (
                    <div key={c.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#00a8ff]">#{c.case_number || c.id}</span>
                          <span className="px-2 py-0.5 rounded bg-[#18293a] text-slate-300 font-semibold text-[10px]">
                            {c.action_type}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1">{c.reason}</p>
                      </div>
                      <div className="text-right text-[11px] text-slate-400 shrink-0">
                        <div>Logged by {c.moderator_username}</div>
                        <div className="mt-0.5">{new Date(c.timestamp).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : searched ? (
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-8 text-center text-xs text-slate-400">
          No records found for "{query}".
        </div>
      ) : null}
    </div>
  );
}
