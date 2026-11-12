import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Terminal, Send, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

export default function CommandsPage() {
  const { user } = useAuth();
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<{ cmd: string; time: string; success: boolean; res: string }[]>([
    { cmd: ':pm Collingwoodpro2014 Please keep roleplay realistic during peacetime.', time: '11:42 AM', success: true, res: 'Delivered to player via ER:LC API' },
    { cmd: ':m Peacetime is in effect. Obey all traffic laws.', time: '11:30 AM', success: true, res: 'Global server broadcast transmitted' }
  ]);

  // Online players in server matching image_d16b9176.png
  const onlinePlayers = [
    'Bugoff35',
    'gr201373',
    'Bakers54321',
    'Djshsdhzudyx',
    'literally_dawson',
    'literallyihn',
    'BigfootDP1',
    'demozcool',
    'Softsunset3',
    'Collingwoodpro2014',
    'TheManInTheSuit370',
    'Neepzeep',
    'OcelotGamerRizz',
    'farhanrobloxalt',
    'bugyJMALLO',
    'carlos473'
  ];

  useEffect(() => {
    document.title = 'Commands · New York City Roleplay Staff Panel';
  }, []);

  const handlePlayerClick = (playerName: string) => {
    if (!command.trim() || command.startsWith(':pm')) {
      setCommand(`:pm ${playerName} `);
    } else if (command.startsWith(':kick') || command.startsWith(':jail')) {
      const parts = command.split(' ');
      setCommand(`${parts[0]} ${playerName} `);
    } else {
      setCommand(prev => `${prev} ${playerName}`);
    }
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/staff/commands/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({ command: command.trim() })
      });

      const data = await res.json();
      setResult(data);
      setHistory(prev => [
        {
          cmd: command.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          success: res.ok,
          res: data.message || data.error || 'Command sent to ER:LC server'
        },
        ...prev
      ]);
      if (res.ok) setCommand('');
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header matching image_d16b9176.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Commands</h1>
          <p className="text-xs text-slate-400 mt-1">
            Run in-game commands directly through the ER:LC API.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0e1822] border border-[#1a2d40] text-xs font-semibold text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>46 of 50 players in the server</span>
        </div>
      </div>

      {/* Main Console Box matching image_d16b9176.png */}
      <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-6">
        <form onSubmit={handleRun} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              placeholder=":pm username message"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="flex-1 font-mono bg-[#09121a] border border-[#182a3c] rounded-2xl px-4 py-3 text-sm text-[#00a8ff] placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
            />
            <button
              type="submit"
              disabled={loading || !command.trim()}
              className="px-6 py-3 rounded-2xl bg-[#00a8ff] hover:bg-[#0092dd] text-slate-950 font-bold text-sm transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? 'Running...' : 'Run'}
            </button>
          </div>

          {/* Quick command helpers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Quick actions:</span>
            <button
              type="button"
              onClick={() => setCommand(':m Peacetime is now in effect. Drive within marked lanes and observe speed limits.')}
              className="px-3 py-1 rounded-xl bg-[#121f2c] hover:bg-[#182b3d] border border-[#1c3247] text-slate-300 text-[11px]"
            >
              :m Peacetime Notice
            </button>
            <button
              type="button"
              onClick={() => setCommand(':h Priority in progress. Clear the emergency roadway.')}
              className="px-3 py-1 rounded-xl bg-[#121f2c] hover:bg-[#182b3d] border border-[#1c3247] text-slate-300 text-[11px]"
            >
              :h Priority Broadcast
            </button>
            <button
              type="button"
              onClick={() => setCommand(':kick ')}
              className="px-3 py-1 rounded-xl bg-[#121f2c] hover:bg-[#182b3d] border border-[#1c3247] text-slate-300 text-[11px]"
            >
              :kick &lt;player&gt;
            </button>
            <button
              type="button"
              onClick={() => setCommand(':jail ')}
              className="px-3 py-1 rounded-xl bg-[#121f2c] hover:bg-[#182b3d] border border-[#1c3247] text-slate-300 text-[11px]"
            >
              :jail &lt;player&gt;
            </button>
          </div>
        </form>

        {/* In the server now clickable player pills matching image_d16b9176.png */}
        <div className="pt-4 border-t border-[#172737] space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>In the server now</span>
            <span className="text-[11px] text-slate-400 font-normal">Click a player to autofill username</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {onlinePlayers.map((player) => (
              <button
                key={player}
                type="button"
                onClick={() => handlePlayerClick(player)}
                className="px-3 py-1.5 rounded-xl bg-[#121f2c] hover:bg-[#1c344a] border border-[#1c3247] hover:border-[#00a8ff] text-slate-200 text-xs font-semibold transition-all"
              >
                {player}
              </button>
            ))}
          </div>
        </div>

        {/* Execution Log */}
        {result && (
          <div
            className={`p-3 rounded-2xl text-xs font-mono flex items-center gap-2 ${
              result.success
                ? 'bg-[#0f2d25] border border-[#175240] text-emerald-300'
                : 'bg-red-950/60 border border-red-800/40 text-red-300'
            }`}
          >
            {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{result.message || result.error}</span>
          </div>
        )}
      </div>

      {/* Terminal History */}
      <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 pb-4 border-b border-[#172737] mb-4">
          <Terminal className="w-4 h-4 text-[#00a8ff]" />
          <h2 className="text-sm font-bold text-white">Execution Console Log</h2>
        </div>

        <div className="divide-y divide-[#172737] font-mono text-xs">
          {history.map((h, i) => (
            <div key={i} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-[#00a8ff] font-semibold">{h.cmd}</span>
                <span className="text-slate-400 text-[11px] ml-2">↳ {h.res}</span>
              </div>
              <span className="text-[11px] text-slate-500 whitespace-nowrap">{h.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
