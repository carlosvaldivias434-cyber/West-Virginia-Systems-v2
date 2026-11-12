import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DevLoginModal } from '../components/DevLoginModal';
import { AlertTriangle, CheckCircle2, AlertCircle, Send, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BanAppealPage: React.FC = () => {
  const { user } = useAuth();
  const [robloxUsername, setRobloxUsername] = useState('');
  const [banReason, setBanReason] = useState('Random Deathmatch (RDM)');
  const [explanation, setExplanation] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedAppeal, setConfirmedAppeal] = useState<{ referenceId: string; submittedAt: number } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    document.title = 'In-Game Ban Appeal · WVSP';
    if (user?.robloxUser?.username) {
      setRobloxUsername(user.robloxUser.username);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!robloxUsername.trim()) {
      setErrorMsg('Please enter your full Roblox username.');
      return;
    }

    if (!explanation || explanation.trim().length < 20) {
      setErrorMsg('Please provide a substantive explanation of at least 20 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ban-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({
          robloxUsername: robloxUsername.trim(),
          banReason,
          explanation: explanation.trim(),
          evidenceUrls: evidenceUrls.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit in-game ban appeal');
      }

      setConfirmedAppeal(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting in-game ban appeal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ER:LC SERVER BAN APPEAL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">In-Game Server Ban Appeal</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Appeal an emergency response or patrol ban. Approved appeals trigger automated administrative unban execution.
          </p>
        </div>

        {!user && (
          <div className="mb-6 rounded-xl bg-slate-900 border border-amber-500/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400" />
              <div className="text-xs">
                <p className="font-semibold text-slate-200">Discord Sign-In Required</p>
                <p className="text-slate-400">Sign in to verify your identity before filing a ban appeal.</p>
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
                Roblox Username
              </label>
              <input
                type="text"
                required
                value={robloxUsername}
                onChange={e => setRobloxUsername(e.target.value)}
                placeholder="e.g. AppalachianTrooper"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Stated Ban Reason
              </label>
              <select
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-400"
              >
                <option value="Random Deathmatch (RDM)">Random Deathmatch (RDM)</option>
                <option value="Vehicle Deathmatch (VDM)">Vehicle Deathmatch (VDM)</option>
                <option value="Fail Roleplay (FRP)">Fail Roleplay (FRP)</option>
                <option value="Leaving to Avoid Arrest / Punishment (LTAP)">Leaving to Avoid Arrest (LTAP/LTAA)</option>
                <option value="Not Intending to Roleplay (NITRP)">Not Intending to Roleplay (NITRP)</option>
                <option value="New Life Rule (NLR)">New Life Rule (NLR) Violation</option>
                <option value="Tool / Gear Abuse">Tool / Gear Abuse</option>
                <option value="Staff Evasion / Disrespect">Staff Evasion / Disrespect</option>
                <option value="Other Policy Violation">Other Policy Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Explanation & Incident Context
              </label>
              <textarea
                rows={5}
                required
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="Explain the circumstances surrounding your ban in detail. What occurred during the scene? Why should your ban be lifted?"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm leading-relaxed focus:outline-none focus:border-red-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Minimum 20 characters required.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Counter-Evidence / Video Clip Links (Optional)
              </label>
              <input
                type="text"
                value={evidenceUrls}
                onChange={e => setEvidenceUrls(e.target.value)}
                placeholder="https://medal.tv/... or YouTube unlisted clip"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-red-400"
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
              className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Ban Appeal...' : 'Submit In-Game Ban Appeal'}</span>
            </button>
          </form>
        ) : (
          <div className="rounded-2xl bg-slate-900 border border-emerald-500/40 p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Ban Appeal Submitted!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your appeal has been received. If approved by High Command, your ban will automatically be unbanned in the ER:LC server.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Appeal Reference ID:</span>
                <span className="font-mono font-bold text-red-400">{confirmedAppeal.referenceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Roblox Account:</span>
                <span className="text-slate-200">{robloxUsername}</span>
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
                className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs"
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
