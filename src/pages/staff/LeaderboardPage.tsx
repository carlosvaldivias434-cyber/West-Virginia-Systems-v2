import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, Clock, Users, ShieldAlert, Award } from 'lucide-react';

const timeTabs = [
  'This week',
  'Last week',
  '2 weeks ago',
  '3 weeks ago'
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('This week');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Leaderboard · New York City Roleplay Staff Panel';
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff/leaderboard');
      if (res.ok) {
        const json = await res.json();
        setData(json.leaderboard || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Seeded / realistic data matching image_e31df452.png
  const leaderboardList = data.length ? data : [
    { rank: 1, staffTag: 'demozcool', hours: '14h 20m', seconds: 51600, mods: 38, quotaMet: true },
    { rank: 2, staffTag: 'literallyihn', hours: '11h 05m', seconds: 39900, mods: 27, quotaMet: true },
    { rank: 3, staffTag: 'Bakers54321', hours: '9h 42m', seconds: 34920, mods: 19, quotaMet: true },
    { rank: 4, staffTag: 'BigfootDP1', hours: '7h 15m', seconds: 26100, mods: 14, quotaMet: true },
    { rank: 5, staffTag: 'gr201373', hours: '6h 30m', seconds: 23400, mods: 12, quotaMet: true },
    { rank: 6, staffTag: 'Softsunset3', hours: '4h 50m', seconds: 17400, mods: 8, quotaMet: true },
    { rank: 7, staffTag: 'ronaldoiscat', hours: '3h 40m', seconds: 13200, mods: 6, quotaMet: true },
    { rank: 8, staffTag: 'Djshsdhzudyx', hours: '2h 10m', seconds: 7800, mods: 4, quotaMet: false },
    { rank: 9, staffTag: 'literally_dawson', hours: '1h 45m', seconds: 6300, mods: 2, quotaMet: false },
    { rank: 10, staffTag: 'bugyJMALLO', hours: '1h 02m', seconds: 3720, mods: 1, quotaMet: false }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Time Tabs matching image_e31df452.png */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#0a141e] border border-[#142332] rounded-2xl w-fit">
        {timeTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#152737] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4 Metric Cards matching image_e31df452.png */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-xs text-slate-400 font-medium">Staff</div>
          <div className="text-2xl font-extrabold text-white mt-1">181</div>
        </div>

        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-xs text-slate-400 font-medium">Met quota</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">18</div>
        </div>

        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-xs text-slate-400 font-medium">Below quota</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">127</div>
        </div>

        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-xs text-slate-400 font-medium">Exempt, on leave</div>
          <div className="text-2xl font-extrabold text-slate-400 mt-1">23</div>
        </div>
      </div>

      {/* Leaderboard Table matching image_e31df452.png */}
      <div className="bg-[#0e1822] border border-[#182735] rounded-3xl overflow-hidden shadow-lg shadow-black/20">
        <div className="p-5 border-b border-[#142332] flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Shift Standings</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Quota target: 3h 20m</span>
        </div>

        <div className="divide-y divide-[#142332]">
          {leaderboardList.map((row: any) => {
            const maxSeconds = 54000;
            const progress = Math.min(100, Math.round(((row.seconds || 10000) / maxSeconds) * 100));

            return (
              <div
                key={row.rank || row.staffTag}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#121f2c]/40 transition-colors"
              >
                {/* Left: Rank & Staff Name */}
                <div className="flex items-center gap-4 min-w-56">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      row.rank === 1
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : row.rank === 2
                        ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                        : row.rank === 3
                        ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                        : 'bg-[#142332] text-slate-400'
                    }`}
                  >
                    #{row.rank}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{row.staffTag}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {row.mods || 0} moderations logged
                    </div>
                  </div>
                </div>

                {/* Middle: Progress Bar */}
                <div className="flex-1 max-w-md hidden md:block">
                  <div className="w-full h-2 bg-[#172737] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        row.quotaMet ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Right: Hours & Quota Status */}
                <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                  <div className="font-mono font-bold text-white text-sm">
                    {row.hours || row.totalFormatted}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                      row.quotaMet
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {row.quotaMet ? 'MET' : 'BELOW'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
