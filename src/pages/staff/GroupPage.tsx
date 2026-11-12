import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Check, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function GroupPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Roblox Group · WVSP';
    fetchGroup();
  }, []);

  const fetchGroup = async () => {
    try {
      const res = await fetch('/api/staff/group');
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (robloxUsername: string) => {
    try {
      const res = await fetch('/api/staff/group/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({ robloxUsername })
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage(json.message || `Accepted ${robloxUsername}.`);
        setData((prev: any) => ({
          ...prev,
          pendingRequests: prev.pendingRequests.filter((r: any) => r.username !== robloxUsername)
        }));
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Roblox Group Roster Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and approve pending recruitment join requests for the official Roblox group.
          </p>
        </div>
        {data?.groupUrl && (
          <a
            href={data.groupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <span>Open Roblox Group</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-[#00A8FF]/10 border border-[#00A8FF]/30 text-xs text-[#00A8FF] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Pending Requests */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00A8FF]" />
            <h2 className="text-sm font-bold text-white">Pending Join Requests</h2>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {data?.pendingRequests?.length || 0} Pending
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#00A8FF] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-slate-400">Loading pending requests...</p>
          </div>
        ) : (!data?.pendingRequests || data.pendingRequests.length === 0) ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No pending join requests waiting for review.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {data.pendingRequests.map((req: any) => (
              <div key={req.username} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-white text-sm">{req.username}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Roblox ID: <span className="font-mono text-slate-300">{req.robloxId}</span> · Applied Rank: <strong className="text-[#00A8FF]">{req.rankApplied}</strong>
                  </div>
                </div>
                <button
                  onClick={() => handleAccept(req.username)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Member</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
