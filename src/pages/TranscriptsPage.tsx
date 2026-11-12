import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Search, ExternalLink, Calendar, User, Clock, ShieldCheck } from 'lucide-react';

interface TranscriptItem {
  ticket_id: string;
  opener_id: string;
  opener_tag: string;
  category: string;
  status: string;
  closed_at: number;
  closer_tag: string;
  message_count: number;
}

export default function TranscriptsPage() {
  const { user } = useAuth();
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Transcripts · WVSP';
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transcripts');
      if (res.ok) {
        const data = await res.json();
        setTranscripts(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load ticket transcripts. Please ensure you are logged in.');
      }
    } catch {
      setError('Network error loading transcripts.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = transcripts.filter(t => {
    const ticketId = (t.ticket_id || (t as any).id || '').toLowerCase();
    const category = (t.category || '').toLowerCase();
    const opener = (t.opener_tag || (t as any).user_tag || '').toLowerCase();
    const closer = (t.closer_tag || (t as any).closed_by || '').toLowerCase();
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return ticketId.includes(term) || category.includes(term) || opener.includes(term) || closer.includes(term);
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00A8FF]/10 text-[#00A8FF] text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Records</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Support Transcripts</h1>
            <p className="text-sm text-slate-400 mt-1">
              Archived conversation transcripts for closed support tickets and inquiries.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, opener, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00A8FF] transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#00A8FF] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-400">Loading transcript archives...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-950/30 border border-red-800/40 text-center">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800/80">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-300">No transcripts found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {search ? 'No tickets matched your search query.' : 'There are currently no closed ticket transcripts accessible to your account.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => {
              const ticketId = t.ticket_id || (t as any).id || '0000';
              return (
                <div
                  key={ticketId}
                  className="bg-slate-900/70 border border-slate-800 hover:border-[#00A8FF]/50 rounded-xl p-5 transition-all flex flex-col justify-between group shadow-sm hover:shadow-[#00A8FF]/5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#00A8FF]/15 text-[#00A8FF] font-bold">
                        #{ticketId}
                      </span>
                      <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t.status || 'CLOSED'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#00A8FF] transition-colors">
                      {t.category || 'General Support'}
                    </h3>
                    <div className="space-y-1.5 mt-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Opened by:</span>
                        <span className="text-slate-200 font-medium">{t.opener_tag || (t as any).user_tag || 'Member'}</span>
                      </div>
                      {(t.closer_tag || (t as any).closed_by) && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Closed by:</span>
                          <span className="text-slate-300">{t.closer_tag || (t as any).closed_by}</span>
                        </div>
                      )}
                      {t.closed_at && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(t.closed_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {t.message_count ? `${t.message_count} messages` : 'Archived'}
                    </span>
                    <Link
                      to={`/transcripts/${ticketId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#00A8FF] hover:underline"
                    >
                      <span>View Transcript</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
