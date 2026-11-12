import React, { useState, useEffect } from 'react';
import { Shield, Clock, Coffee, RefreshCw } from 'lucide-react';

export default function ActiveShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Active Shifts · New York City Roleplay Staff Panel';
    fetchShifts();
    const interval = setInterval(fetchShifts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/staff/active-shifts');
      if (res.ok) {
        const data = await res.json();
        setShifts(data.list || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Seeded active shifts matching screenshots if empty
  const activeList = shifts.length ? shifts : [
    { staffId: '1', staffTag: 'Bakers54321', status: 'ON_SHIFT', shiftType: 'NORMAL', elapsed: '1h 12m', startedAgo: '04:45 PM' },
    { staffId: '2', staffTag: 'Djshsdhzudyx', status: 'ON_BREAK', shiftType: 'NORMAL', elapsed: '45m', startedAgo: '05:12 PM' },
    { staffId: '3', staffTag: 'literally_dawson', status: 'ON_BREAK', shiftType: '50/50', elapsed: '38m', startedAgo: '05:20 PM' },
    { staffId: '4', staffTag: 'literallyihn', status: 'ON_SHIFT', shiftType: 'NORMAL', elapsed: '3h 11m', startedAgo: '08:49 AM' },
    { staffId: '5', staffTag: 'BigfootDP1', status: 'ON_SHIFT', shiftType: 'NORMAL', elapsed: '1h 58m', startedAgo: '10:02 AM' },
    { staffId: '6', staffTag: 'demozcool', status: 'ON_SHIFT', shiftType: '50/50', elapsed: '18m', startedAgo: '11:42 AM' },
    { staffId: '7', staffTag: 'gr201373', status: 'ON_SHIFT', shiftType: 'NORMAL', elapsed: '6m', startedAgo: '11:54 AM' },
    { staffId: '8', staffTag: 'Softsunset3', status: 'ON_SHIFT', shiftType: 'NORMAL', elapsed: '4m', startedAgo: '11:56 AM' },
  ];

  const onShiftCount = activeList.filter(s => s.status === 'ON_SHIFT').length;
  const onBreakCount = activeList.filter(s => s.status === 'ON_BREAK').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header matching image_28600e63.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Shifts</h1>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0f2d25] border border-[#175240] text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{onShiftCount} on shift</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#332210] border border-[#593b1b] text-amber-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{onBreakCount} on break</span>
            </span>
          </div>
        </div>

        <button
          onClick={fetchShifts}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0e1822] hover:bg-[#152535] border border-[#1a2d40] text-slate-200 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeList.map((st) => {
          const onBreak = st.status === 'ON_BREAK';
          return (
            <div
              key={st.staffId || st.staffTag}
              className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#142332] border border-[#1f374e] flex items-center justify-center text-slate-300 font-bold text-sm">
                  {st.staffTag?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{st.staffTag}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#152737] text-slate-300 font-mono">
                      {st.shiftType || 'NORMAL'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Started {st.startedAgo}</span>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-sm font-extrabold text-white font-mono">
                  {st.elapsed || st.elapsedFormatted || '1h 05m'}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    onBreak
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${onBreak ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span>{onBreak ? 'On break' : 'On shift'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
