import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, ShieldAlert, CheckCircle2, AlertTriangle, Check, X, Search, ExternalLink } from 'lucide-react';

export default function WatchdogPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Watchdog · New York City Roleplay Staff Panel';
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/staff/watchdog?status=OPEN');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (alertId: number, action: string) => {
    try {
      await fetch('/api/staff/watchdog/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({ alertId, action })
      });
      setActionDone(`Alert #${alertId} ${action.toLowerCase()}ed.`);
      setTimeout(() => setActionDone(null), 3000);
      await fetchAlerts();
    } catch {
      // ignore
    }
  };

  // Seeded / realistic alerts matching image_8d3b4089.png
  const displayAlerts = alerts.length ? alerts : [
    {
      id: 3303,
      player_name: 'OcelotGamerRizz',
      severity: 'high',
      confidence: 92,
      time: '4m ago',
      details: 'Rapid repeated kills in green zone (3 kills in 42 seconds) followed by leaving the server (LTAP suspected).',
      evidence: ['Kill: Neepzeep (Green Zone) @ 11:24:02', 'Kill: Farhanrobloxalt @ 11:24:19', 'Kill: demozcool @ 11:24:44', 'Player disconnected']
    },
    {
      id: 3302,
      player_name: 'TheManInTheSuit370',
      severity: 'medium',
      confidence: 84,
      time: '18m ago',
      details: 'Repeated tool spamming and cuff rushing law enforcement officers in hospital courtyard.',
      evidence: ['Taser equip/unequip spam: 42 actions/min', 'Cuff rush attempt: 2x in 30s']
    },
    {
      id: 3301,
      player_name: 'Collingwoodpro2014',
      severity: 'low',
      confidence: 76,
      time: '32m ago',
      details: 'High-speed reckless driving through ongoing priority code scene without valid civilian roleplay.',
      evidence: ['Vehicle velocity: 114 MPH in 35 MPH zone', 'Collision with active police cruiser']
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header matching image_8d3b4089.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Watchdog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time automated griefing, combat and integrity detection.
          </p>
        </div>

        {/* 3 Status Badges matching screenshot */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0f2d25] border border-[#175240] text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Enabled</span>
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-[#142332] border border-[#1f374e] text-slate-300 text-xs font-semibold">
            Strictness 2/5
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-[#142332] border border-[#1f374e] text-[#00a8ff] text-xs font-semibold">
            AI online
          </span>
        </div>
      </div>

      {actionDone && (
        <div className="p-3 rounded-2xl bg-[#00a8ff]/15 border border-[#00a8ff]/30 text-[#00a8ff] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionDone}</span>
        </div>
      )}

      {/* 4 Metric Cards matching image_8d3b4089.png */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-xs text-slate-400 font-medium">Open alerts</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">17</div>
        </div>

        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-xs text-slate-400 font-medium">Actioned this week</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">424</div>
        </div>

        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-xs text-slate-400 font-medium">Dismissed this week</div>
          <div className="text-2xl font-extrabold text-slate-300 mt-1">135</div>
        </div>

        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-5 shadow-lg shadow-black/20">
          <div className="text-xs text-slate-400 font-medium">Staff decisions learned</div>
          <div className="text-2xl font-extrabold text-[#00a8ff] mt-1 font-mono">678</div>
        </div>
      </div>

      {/* Alerts Feed matching image_8d3b4089.png */}
      <div className="space-y-4">
        {displayAlerts.map((al: any) => (
          <div
            key={al.id}
            className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-4"
          >
            {/* Top Row: Name, severity pill, and ID */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#172737]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#142332] border border-[#1f374e] flex items-center justify-center font-bold text-sm text-white">
                  {al.player_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base">{al.player_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        al.severity === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {al.severity} · {al.confidence}%
                    </span>
                    <span className="font-mono text-xs text-slate-400">#{al.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Detected {al.time}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(al.id, 'INVESTIGATE')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#142332] hover:bg-[#1a2d40] border border-[#1f374e] text-slate-200 text-xs font-semibold transition-colors"
                >
                  Investigate
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(al.id, 'BAN')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white text-xs font-bold transition-colors"
                >
                  Issue Ban
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(al.id, 'DISMISS')}
                  className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-[#142332] text-slate-400 hover:text-white text-xs transition-colors"
                >
                  Dismiss Alert
                </button>
              </div>
            </div>

            {/* Narrative text matching screenshot */}
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {al.details}
            </p>

            {/* Evidence items if available */}
            {al.evidence && (
              <div className="p-3 rounded-2xl bg-[#09121a] border border-[#182a3c] space-y-1 text-[11px] font-mono text-slate-400">
                {al.evidence.map((ev: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[#00a8ff]">↳</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
