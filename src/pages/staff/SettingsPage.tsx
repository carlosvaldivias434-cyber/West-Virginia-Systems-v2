import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sliders, Save, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Settings
  const [rdmWindow, setRdmWindow] = useState('60');
  const [rdmThreshold, setRdmThreshold] = useState('3');
  const [autoPm, setAutoPm] = useState('1');
  const [confidenceCutoff, setConfidenceCutoff] = useState('70');
  const [guidance, setGuidance] = useState('');

  useEffect(() => {
    document.title = 'Leadership Settings · WVSP';
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/staff/settings');
      if (res.ok) {
        const data = await res.json();
        const settingsMap: Record<string, string> = {};
        (data.settings || []).forEach((s: any) => {
          settingsMap[s.key] = s.value;
        });

        if (settingsMap.rdm_window_seconds) setRdmWindow(settingsMap.rdm_window_seconds);
        if (settingsMap.rdm_kill_threshold) setRdmThreshold(settingsMap.rdm_kill_threshold);
        if (settingsMap.auto_pm_warning) setAutoPm(settingsMap.auto_pm_warning);
        if (settingsMap.confidence_cutoff) setConfidenceCutoff(settingsMap.confidence_cutoff);
        setGuidance(data.leadershipGuidance || '');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/staff/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({
          settings: {
            rdm_window_seconds: rdmWindow,
            rdm_kill_threshold: rdmThreshold,
            auto_pm_warning: autoPm,
            confidence_cutoff: confidenceCutoff
          },
          leadershipGuidance: guidance
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('System settings and leadership parameters updated.');
      } else {
        setMessage(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#00A8FF]/10 text-[#00A8FF] text-[10px] font-bold uppercase tracking-wider mb-2 border border-[#00A8FF]/30">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Management Clearance Level</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Executive Leadership Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Adjust Watchdog autonomous detection thresholds and automated assistance directives.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-[#00A8FF]/10 border border-[#00A8FF]/30 text-xs text-[#00A8FF] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#00A8FF] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-400">Loading parameters...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Section 1: Watchdog Telemetry Thresholds */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-[#00A8FF]" />
              <h2 className="text-sm font-bold text-white">Watchdog AI Autonomous Thresholds</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  RDM Window Seconds (Combat Window)
                </label>
                <input
                  type="number"
                  value={rdmWindow}
                  onChange={e => setRdmWindow(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Time window to evaluate rapid kill counts (default: 60s).</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  RDM Kill Count Threshold
                </label>
                <input
                  type="number"
                  value={rdmThreshold}
                  onChange={e => setRdmThreshold(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Number of rapid kills required to trigger emergency alert (default: 3).</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Confidence Threshold (%)
                </label>
                <input
                  type="number"
                  value={confidenceCutoff}
                  onChange={e => setConfidenceCutoff(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Minimum confidence percent required before flag is raised (default: 70%).</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Autonomous PM Warning
                </label>
                <select
                  value={autoPm}
                  onChange={e => setAutoPm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="1">Enabled (Automatically message offender)</option>
                  <option value="0">Disabled (Staff sit required)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">Send in-game warning to subject on high-confidence flag.</span>
              </div>
            </div>
          </div>

          {/* Section 2: Leadership Directives & Guidance Prompt */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Leadership Operational Directives</h2>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Executive Directives &amp; Tone Guidance Prompt
              </label>
              <textarea
                rows={6}
                value={guidance}
                onChange={e => setGuidance(e.target.value)}
                placeholder="Enter current community focus, peacetime enforcement priority, or ticketing guidance..."
                className="w-full font-mono bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-[#00A8FF]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Broadcasted across automated ticket helpers and staff review guidelines.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00A8FF] text-slate-950 font-bold text-xs hover:bg-[#0090dd] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Executive Configuration'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
