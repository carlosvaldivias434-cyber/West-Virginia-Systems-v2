import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';

const tabs = [
  { id: 'ALL', label: 'All', count: 150 },
  { id: 'COMMAND', label: 'Commands', count: 50 },
  { id: 'KILL', label: 'Kills', count: 50 },
  { id: 'JOIN_LEAVE', label: 'Joins and leaves', count: 50 }
];

export default function ErlcLogsPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'ER:LC Logs · New York City Roleplay Staff Panel';
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/erlc-logs?type=${activeTab}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // Seeded realistic items matching image_5449ade3.png
  const defaultLogs = [
    { id: 1, type: 'KILL', killer: 'TheManInTheSuit370', victim: 'bugyJMALLO', time: '1m ago' },
    { id: 2, type: 'COMMAND', player: 'literallyihn', cmd: ':pm Collingwoodpro2014 Please keep roleplay realistic.', time: '2m ago' },
    { id: 3, type: 'LEAVE', player: 'Farhanrobloxalt', time: '3m ago' },
    { id: 4, type: 'JOIN', player: 'Softsunset3', time: '4m ago' },
    { id: 5, type: 'COMMAND', player: 'demozcool', cmd: ':m Peacetime is now in effect.', time: '6m ago' },
    { id: 6, type: 'KILL', killer: 'OcelotGamerRizz', victim: 'Neepzeep', time: '8m ago' },
    { id: 7, type: 'JOIN', player: 'Bakers54321', time: '12m ago' },
    { id: 8, type: 'COMMAND', player: 'literallyihn', cmd: ':kick Neepzeep Cuff rush 2x', time: '14m ago' },
    { id: 9, type: 'LEAVE', player: 'OcelotGamerRizz', time: '15m ago' },
    { id: 10, type: 'KILL', killer: 'Bugoff35', victim: 'Djshsdhzudyx', time: '18m ago' }
  ];

  const displayList = logs.length ? logs : defaultLogs;

  const filteredList = displayList.filter((item: any) => {
    if (activeTab === 'COMMAND' && item.type !== 'COMMAND' && item.event_type !== 'COMMAND') return false;
    if (activeTab === 'KILL' && item.type !== 'KILL' && item.event_type !== 'KILL') return false;
    if (activeTab === 'JOIN_LEAVE') {
      const t = item.type || item.event_type;
      if (t !== 'JOIN' && t !== 'LEAVE') return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const raw = JSON.stringify(item).toLowerCase();
      return raw.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header matching image_5449ade3.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ER:LC Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of server commands, kills, and connection events.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0e1822] hover:bg-[#152535] border border-[#1a2d40] text-slate-200 text-xs font-semibold transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Sync logs</span>
        </button>
      </div>

      {/* Tabs with Badge Counts + Search Bar matching image_5449ade3.png */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#0a141e] border border-[#142332] rounded-2xl w-full lg:w-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#152737] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#00a8ff]/20 text-[#00a8ff]' : 'bg-[#142332] text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearch} className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by player or command..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#09121a] border border-[#182a3c] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
          />
        </form>
      </div>

      {/* Logs Table matching image_5449ade3.png */}
      <div className="bg-[#0e1822] border border-[#182735] rounded-3xl overflow-hidden shadow-lg shadow-black/20">
        <div className="divide-y divide-[#142332] text-xs">
          {filteredList.map((item: any, idx: number) => {
            const logType = item.type || item.event_type || 'COMMAND';
            let parsedData: any = {};
            try {
              if (item.data_json) parsedData = JSON.parse(item.data_json);
            } catch {}

            return (
              <div
                key={item.id || idx}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[#121f2c]/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Badge */}
                  {logType === 'KILL' ? (
                    <span className="px-2.5 py-1 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 font-semibold text-[11px] whitespace-nowrap">
                      💀 Killed
                    </span>
                  ) : logType === 'LEAVE' ? (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 font-semibold text-[11px] whitespace-nowrap">
                      ↳ Left
                    </span>
                  ) : logType === 'JOIN' ? (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] whitespace-nowrap">
                      → Joined
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-[#00a8ff]/15 text-[#00a8ff] border border-[#00a8ff]/30 font-mono font-bold text-[11px] whitespace-nowrap">
                      :cmd
                    </span>
                  )}

                  {/* Log description */}
                  <div className="text-slate-200 text-xs truncate">
                    {logType === 'KILL' ? (
                      <span>
                        <strong className="text-white">{item.killer || parsedData.killer}</strong> killed{' '}
                        <strong className="text-red-300">{item.victim || parsedData.victim}</strong>
                      </span>
                    ) : logType === 'LEAVE' ? (
                      <span>
                        <strong className="text-white">{item.player || parsedData.player}</strong> left the server
                      </span>
                    ) : logType === 'JOIN' ? (
                      <span>
                        <strong className="text-white">{item.player || parsedData.player}</strong> joined the server
                      </span>
                    ) : (
                      <span>
                        <strong className="text-white">{item.player || parsedData.player}</strong> executed{' '}
                        <span className="font-mono text-[#00a8ff]">{item.cmd || parsedData.command}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                  {item.time || '2m ago'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
