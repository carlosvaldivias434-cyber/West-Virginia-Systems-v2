import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Shield, Bot, Calendar, Download, AlertTriangle } from 'lucide-react';

interface TranscriptMessage {
  id: string;
  author_id: string;
  author_tag: string;
  author_avatar?: string;
  content: string;
  embeds_json?: string;
  attachments_json?: string;
  is_bot: number | boolean;
  is_staff: number | boolean;
  created_at: number;
}

interface TranscriptData {
  ticketId: string;
  ticket: any;
  messages: TranscriptMessage[];
  authorized: boolean;
}

export default function TranscriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Transcript #${id} · WVSP`;
    fetchTranscript();
  }, [id]);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/transcripts/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else if (res.status === 403) {
        setError('Access Denied: You are not authorized to view this ticket transcript.');
      } else {
        setError('Transcript not found or has expired.');
      }
    } catch {
      setError('Network error loading transcript.');
    } finally {
      setLoading(false);
    }
  };

  const downloadText = () => {
    if (!data) return;
    const lines = [
      `WEST VIRGINIA STATE ROLEPLAY - TICKET TRANSCRIPT #${data.ticketId}`,
      `Category: ${data.ticket?.category || 'General Support'}`,
      `Opener: ${data.ticket?.opener_tag || 'Unknown'} (${data.ticket?.opener_id})`,
      `Closed by: ${data.ticket?.closer_tag || 'Staff'}`,
      `Date: ${new Date(data.ticket?.closed_at || Date.now()).toLocaleString()}`,
      '------------------------------------------------------------',
      ''
    ];

    data.messages.forEach(m => {
      const time = new Date(m.created_at).toLocaleTimeString();
      const badge = m.is_staff ? '[STAFF] ' : m.is_bot ? '[BOT] ' : '';
      lines.push(`[${time}] ${badge}${m.author_tag}: ${m.content}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${data.ticketId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/transcripts"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Transcripts</span>
          </Link>
          {data && (
            <button
              onClick={downloadText}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Raw Transcript</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#00A8FF] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-400">Loading conversation log...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Transcript Unavailable</h3>
            <p className="text-sm text-red-300 max-w-md mx-auto">{error}</p>
            <div className="pt-2">
              <Link
                to="/transcripts"
                className="inline-block px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Return to Directory
              </Link>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Ticket Header Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#00A8FF]/20 text-[#00A8FF] font-bold">
                      #{data.ticketId}
                    </span>
                    <span className="text-xs uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-semibold border border-emerald-800/40">
                      Archived
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-white">
                    {data.ticket?.category || 'General Support Inquiry'}
                  </h1>
                </div>
                <div className="text-xs text-slate-400 space-y-1 md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(data.ticket?.closed_at || Date.now()).toLocaleString()}</span>
                  </div>
                  <div>
                    Opener: <span className="text-slate-200 font-medium">{data.ticket?.opener_tag}</span>
                  </div>
                  {data.ticket?.closer_tag && (
                    <div>
                      Closed by: <span className="text-[#00A8FF]">{data.ticket.closer_tag}</span>
                    </div>
                  )}
                </div>
              </div>

              {data.ticket?.inquiry && (
                <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1 text-[10px]">
                    Initial Inquiry Prompt:
                  </span>
                  {data.ticket.inquiry}
                </div>
              )}
            </div>

            {/* Chat Transcript Stream */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <MessageSquare className="w-4 h-4 text-[#00A8FF]" />
                <span>Conversation Log ({data.messages.length} messages)</span>
              </div>

              {data.messages.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No chat messages were recorded for this ticket session.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.messages.map((m, index) => {
                    const isStaff = Boolean(m.is_staff);
                    const isBot = Boolean(m.is_bot);

                    return (
                      <div
                        key={m.id || index}
                        className={`flex gap-3 p-3 rounded-lg transition-colors ${
                          isStaff
                            ? 'bg-[#00A8FF]/5 border border-[#00A8FF]/20'
                            : 'bg-slate-900/60 border border-slate-800/60'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 flex-shrink-0">
                          {isBot ? (
                            <Bot className="w-5 h-5 text-indigo-400" />
                          ) : isStaff ? (
                            <Shield className="w-4 h-4 text-[#00A8FF]" />
                          ) : (
                            m.author_tag.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-white">{m.author_tag}</span>
                            {isStaff && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#00A8FF] text-slate-950 uppercase tracking-wider">
                                Staff
                              </span>
                            )}
                            {isBot && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                                BOT
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
