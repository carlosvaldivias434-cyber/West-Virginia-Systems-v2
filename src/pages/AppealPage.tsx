import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DevLoginModal } from '../components/DevLoginModal';
import { Scale, CheckCircle2, AlertCircle, Send, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AppealPage: React.FC = () => {
  const { user } = useAuth();
  const [actionType, setActionType] = useState('Timeout / Mute');
  const [caseId, setCaseId] = useState('');
  const [explanation, setExplanation] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedAppeal, setConfirmedAppeal] = useState<{ referenceId: string; submittedAt: number } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    document.title = 'Discord Appeal · WVSP';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!explanation || explanation.trim().length < 20) {
      setErrorMsg('Please provide a substantive explanation of at least 20 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({
          actionType,
          caseId: caseId.trim() || undefined,
          explanation: explanation.trim(),
          evidenceUrls: evidenceUrls.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit appeal');
      }

      setConfirmedAppeal(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting appeal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>DISCORD MODERATION APPEAL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Discord Server Sanction Appeal</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Submit a formal dispute regarding a Discord warning, timeout, or kick issued in West Virginia State Roleplay.
          </p>
        </div>

        {!user && (
          <div className="mb-6 rounded-xl bg-slate-900 border border-amber-500/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400" />
              <div className="text-xs">
                <p className="font-semibold text-slate-200">Discord Sign-In Required</p>
                <p className="text-slate-400">Sign in to verify your identity before filing an appeal.</p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold"
            >
              Sign In
            </button>
          </div>
        )}

        {!confirmedAppeal ? (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Sanction Type
              </label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="Timeout / Mute">Timeout / Mute</option>
                <option value="Official Warning">Official Warning</option>
                <option value="Server Kick">Server Kick</option>
                <option value="Server Ban">Server Ban</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Case ID (Optional)
              </label>
              <input
                type="text"
                value={caseId}
                onChange={e => setCaseId(e.target.value)}
                placeholder="e.g. MOD-0012 (if provided by bot)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Detailed Explanation & Statement
              </label>
              <textarea
                rows={5}
                required
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="State clearly what happened, why you believe the sanction was mistaken or excessive, and how you will follow community standards going forward..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm leading-relaxed focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Minimum 20 characters required.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Evidence / Screenshot Links (Optional)
              </label>
              <input
                type="text"
                value={evidenceUrls}
                onChange={e => setEvidenceUrls(e.target.value)}
                placeholder="https://imgur.com/... or Discord attachment links"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Appeal...' : 'Submit Discord Appeal'}</span>
            </button>
          </form>
        ) : (
          <div className="rounded-2xl bg-slate-900 border border-emerald-500/40 p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Appeal Submitted!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your Discord appeal has been officially recorded and queued for independent Server Management review.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Appeal ID:</span>
                <span className="font-mono font-bold text-amber-400">{confirmedAppeal.referenceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Sanction:</span>
                <span className="text-slate-200">{actionType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Status:</span>
                <span className="text-amber-400 font-semibold">PENDING REVIEW</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-200">{new Date(confirmedAppeal.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Link
                to="/my-profile"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
              >
                Track in Your Stats
              </Link>
              <Link
                to="/"
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
              >
                Home
              </Link>
            </div>
          </div>
        )}
      </div>

      <DevLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};
