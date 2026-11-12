import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Edit3, Save, CheckCircle2, Shield, Search } from 'lucide-react';

interface GuideSection {
  heading: string;
  body: string;
}

export default function GuidesPage() {
  const { user } = useAuth();
  const [guide, setGuide] = useState<any>(null);
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rawContent, setRawContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Staff Guide · New York City Roleplay Staff Panel';
    fetchGuide();
  }, []);

  const fetchGuide = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/staff/guides?id=staff-guide');
      if (res.ok) {
        const data = await res.json();
        setGuide(data);
        setTitle(data?.title || 'New York City Roleplay — Official Staff Handbook');
        setRawContent(data?.content || '');

        if (data?.content) {
          try {
            const parsed = JSON.parse(data.content);
            if (Array.isArray(parsed.sections)) {
              setSections(parsed.sections);
            } else if (Array.isArray(parsed)) {
              setSections(parsed);
            } else {
              setSections([{ heading: 'Overview', body: data.content }]);
            }
          } catch {
            setSections([{ heading: 'Overview', body: data.content }]);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/staff/guides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({
          id: 'staff-guide',
          title,
          category: 'Staff Operations',
          content: rawContent
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Handbook updated successfully.');
        setEditing(false);
        await fetchGuide();
      } else {
        setMessage(data.error || 'Failed to update handbook');
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredSections = sections.filter(
    (s) =>
      s.heading.toLowerCase().includes(search.toLowerCase()) ||
      s.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#142332]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-[#00a8ff]" />
            <span className="text-[10px] font-bold text-[#00a8ff] uppercase tracking-wider">
              Department Operations Manual
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Operating expectations, duty standards, in-game command authorization, and disciplinary procedures.
          </p>
        </div>

        {user?.isManagement && (
          <div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e1822] hover:bg-[#152535] border border-[#1a2d40] text-xs font-semibold text-slate-200 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Handbook</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#0e1822] text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00a8ff] text-slate-950 font-bold text-xs hover:bg-[#0092dd]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className="p-3 rounded-2xl bg-[#00a8ff]/15 border border-[#00a8ff]/30 text-[#00a8ff] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Search handbook topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#09121a] border border-[#182a3c] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a8ff]"
        />
      </div>

      {/* Guide Body */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#00a8ff] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-400">Loading staff handbook...</p>
        </div>
      ) : editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0e1822] border border-[#182735] rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Content (JSON or Text)</label>
            <textarea
              rows={20}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="w-full font-mono bg-[#09121a] border border-[#182735] rounded-xl p-4 text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-[#00a8ff]"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((sec, idx) => (
            <div
              key={idx}
              className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-3"
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#172737]">
                <span className="w-6 h-6 rounded-lg bg-[#142332] text-[#00a8ff] font-mono font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <h2 className="text-base font-bold text-white">{sec.heading}</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {sec.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
