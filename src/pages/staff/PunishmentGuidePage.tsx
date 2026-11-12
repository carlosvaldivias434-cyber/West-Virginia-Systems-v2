import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface OffenceRule {
  offence: string;
  first: string;
  second: string;
  third: string;
  notes?: string;
}

export default function PunishmentGuidePage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<OffenceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Punishment Matrix · New York City Roleplay Staff Panel';
    fetchGuide();
  }, []);

  const fetchGuide = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/staff/guides?id=punishment-guide');
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) {
          try {
            const parsed = JSON.parse(data.content);
            const list = Array.isArray(parsed) ? parsed : (parsed.matrix || []);
            setRules(list);
          } catch {
            setRules([]);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = rules.filter(r =>
    r.offence.toLowerCase().includes(search.toLowerCase()) ||
    (r.notes && r.notes.toLowerCase().includes(search.toLowerCase())) ||
    r.first.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#142332]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-[#00a8ff]" />
            <span className="text-[10px] font-bold text-[#00a8ff] uppercase tracking-wider">
              Enforcement Protocols
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Punishment Guide &amp; Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard progressive disciplinary guidelines across all 25 official server offences.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search offence (e.g. RDM, FRP)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#09121a] border border-[#182a3c] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
          />
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-[#0e1822] border border-[#182735] rounded-3xl overflow-hidden shadow-lg shadow-black/20">
        <div className="p-4 bg-[#09121a] border-b border-[#142332] flex items-center justify-between text-xs text-slate-400">
          <span>Showing <strong className="text-white">{filtered.length}</strong> of <strong className="text-white">{rules.length}</strong> offences</span>
          <span className="text-[11px] font-mono text-[#00a8ff]">Version 2.4 · Management Approved</span>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#00a8ff] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-slate-400">Loading punishment matrix...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#081018] text-[#8094a6] text-[11px] font-medium border-b border-[#142332]">
                <tr>
                  <th className="py-3.5 px-4 font-normal">#</th>
                  <th className="py-3.5 px-4 font-normal">Offence</th>
                  <th className="py-3.5 px-4 font-normal">1st Offence</th>
                  <th className="py-3.5 px-4 font-normal">2nd Offence</th>
                  <th className="py-3.5 px-4 font-normal">3rd Offence</th>
                  <th className="py-3.5 px-4 font-normal">Enforcement Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142332] text-slate-200">
                {filtered.map((r, idx) => (
                  <tr key={idx} className="hover:bg-[#121f2c]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {r.offence}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#162534] text-amber-300 font-semibold text-[10px]">
                        {r.first}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#251b14] text-orange-300 font-semibold text-[10px]">
                        {r.second}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#301616] text-red-400 font-semibold text-[10px]">
                        {r.third}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] leading-relaxed max-w-md">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
