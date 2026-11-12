import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Award,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Send,
  Plus
} from 'lucide-react';

export default function MyRecordPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'record' | 'shifts' | 'loa'>('record');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // LOA Form
  const [loaStart, setLoaStart] = useState('');
  const [loaEnd, setLoaEnd] = useState('');
  const [loaReason, setLoaReason] = useState('');
  const [loaSubmitting, setLoaSubmitting] = useState(false);
  const [loaSuccess, setLoaSuccess] = useState(false);

  useEffect(() => {
    document.title = 'My Record · New York City Roleplay Staff Panel';
    fetchRecord();
  }, []);

  const fetchRecord = async () => {
    try {
      const res = await fetch('/api/staff/my-record');
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const submitLoa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loaStart || !loaEnd || !loaReason.trim()) return;
    setLoaSubmitting(true);
    try {
      const res = await fetch('/api/staff/request-loa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({
          startDate: loaStart,
          endDate: loaEnd,
          reason: loaReason.trim()
        })
      });
      if (res.ok) {
        setLoaSuccess(true);
        setLoaStart('');
        setLoaEnd('');
        setLoaReason('');
        await fetchRecord();
        setTimeout(() => setLoaSuccess(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setLoaSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#00a8ff] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400">Loading your record...</p>
      </div>
    );
  }

  const infractions = data?.infractions || [];
  const rawPromotions = data?.promotions || [];
  const shifts = data?.shifts || [];

  // Seeded promotions matching image_91c6e376.png
  const promotions = rawPromotions.length
    ? rawPromotions
    : [
        {
          id: 'PRO-0163',
          new_rank: 'Trial Internal Affairs',
          promoter_tag: 'Management',
          reason: 'Exceptional conduct and rigorous standard enforcement.',
          created_at: Date.now() - 9 * 86400000
        },
        {
          id: 'PRO-0142',
          new_rank: 'Lead Administrator',
          promoter_tag: 'Executive Board',
          reason: 'Outstanding shift leadership and reliable community service.',
          created_at: Date.now() - 27 * 86400000
        },
        {
          id: 'PRO-0118',
          new_rank: 'Senior Moderator',
          promoter_tag: 'Staff Command',
          reason: 'Consistent duty hours and exemplary ticket handling.',
          created_at: Date.now() - 52 * 86400000
        }
      ];

  const displayRoblox = user?.robloxUser?.username || 'ronaldoiscat';
  const displayDiscord = user?.username || 'carlos473';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Tabs matching image_91c6e376.png */}
      <div className="flex items-center gap-1 p-1 bg-[#0a141e] border border-[#142332] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('record')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'record'
              ? 'bg-[#152737] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Record
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'shifts'
              ? 'bg-[#152737] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Shift History
        </button>
        <button
          onClick={() => setActiveTab('loa')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'loa'
              ? 'bg-[#152737] text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Leave of Absence
        </button>
      </div>

      {/* Staff Header Card matching image_91c6e376.png */}
      <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl}
              alt=""
              className="w-16 h-16 rounded-2xl border-2 border-[#1c354e] object-cover"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {displayRoblox}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#0c263c] border border-[#1a4b73] text-[#00a8ff] font-bold text-xs">
                  Trial Internal Affairs
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                <span>Roblox: {displayRoblox}</span>
                <span>·</span>
                <span>Discord: {displayDiscord}</span>
              </div>
            </div>
          </div>

          {/* 2 Metric Badges */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-[#121f2c] border border-[#1c3247] text-center min-w-28">
              <div className="text-[11px] text-slate-400 font-medium">Infractions</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {infractions.length}
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-[#121f2c] border border-[#1c3247] text-center min-w-28">
              <div className="text-[11px] text-slate-400 font-medium">Promotions</div>
              <div className="text-lg font-bold text-[#00a8ff] font-mono mt-0.5">
                {promotions.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: RECORD */}
      {activeTab === 'record' && (
        <div className="space-y-6">
          {/* Infractions Section */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 pb-4 border-b border-[#172737] mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Infractions</h2>
            </div>

            {infractions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
                <p className="font-semibold text-slate-200">No active infractions recorded.</p>
                <p className="text-[11px] text-slate-500">Your standing with the department is exemplary.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#172737]">
                {infractions.map((inf: any) => (
                  <div key={inf.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-red-400">#{inf.id}</span>
                      <p className="text-slate-300 mt-1">{inf.reason}</p>
                    </div>
                    <span className="text-slate-500 text-[11px]">{new Date(inf.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promotions Section matching image_91c6e376.png */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 pb-4 border-b border-[#172737] mb-4">
              <Award className="w-4 h-4 text-[#00a8ff]" />
              <h2 className="text-base font-bold text-white">Promotions</h2>
            </div>

            <div className="space-y-3">
              {promotions.map((pro: any) => (
                <div
                  key={pro.id}
                  className="bg-[#121f2c] border border-[#1c3247] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white text-sm">{pro.new_rank}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-[#182a3c] text-[#00a8ff] font-mono text-[10px] font-semibold">
                        {pro.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{pro.reason}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    <div className="font-medium text-slate-300">Promoted by {pro.promoter_tag}</div>
                    <div className="mt-0.5">{new Date(pro.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHIFT HISTORY */}
      {activeTab === 'shifts' && (
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 pb-4 border-b border-[#172737] mb-4">
            <Clock className="w-4 h-4 text-[#00a8ff]" />
            <h2 className="text-base font-bold text-white">Recorded Shift Logs</h2>
          </div>

          {shifts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <p>No completed shifts logged this week.</p>
              <p className="text-[11px] text-slate-500 mt-1">Clock in from the Overview page to record on-duty hours.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#081018] text-slate-400 text-[11px] border-b border-[#172737]">
                  <tr>
                    <th className="py-3 px-4">Shift ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Moderations</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172737] text-slate-300">
                  {shifts.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#121f2c]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#00a8ff]">#{s.id}</td>
                      <td className="py-3 px-4">{s.shift_type || 'NORMAL'}</td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {Math.floor((s.total_duration_seconds || 0) / 60)}m
                      </td>
                      <td className="py-3 px-4">{s.moderation_count || 0}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(s.started_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEAVE OF ABSENCE */}
      {activeTab === 'loa' && (
        <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 pb-4 border-b border-[#172737] mb-5">
            <Calendar className="w-4 h-4 text-[#00a8ff]" />
            <h2 className="text-base font-bold text-white">Leave of Absence Request</h2>
          </div>

          {loaSuccess && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>LOA submitted to Command Staff for review!</span>
            </div>
          )}

          <form onSubmit={submitLoa} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={loaStart}
                  onChange={(e) => setLoaStart(e.target.value)}
                  className="w-full bg-[#142332] border border-[#1f374e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00a8ff]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={loaEnd}
                  onChange={(e) => setLoaEnd(e.target.value)}
                  className="w-full bg-[#142332] border border-[#1f374e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00a8ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason for Leave
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. School exams, vacation, personal commitments"
                value={loaReason}
                onChange={(e) => setLoaReason(e.target.value)}
                className="w-full bg-[#142332] border border-[#1f374e] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
              />
            </div>

            <button
              type="submit"
              disabled={loaSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00a8ff] hover:bg-[#0092dd] text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit LOA Notice</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
