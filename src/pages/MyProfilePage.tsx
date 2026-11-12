import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DevLoginModal } from '../components/DevLoginModal';
import { Link } from 'react-router-dom';
import {
  User,
  Shield,
  FileText,
  Clock,
  Swords,
  AlertTriangle,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

export const MyProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingRoblox, setEditingRoblox] = useState(false);
  const [newRobloxName, setNewRobloxName] = useState('');
  const [savingRoblox, setSavingRoblox] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    document.title = 'Your Stats · WVSP';

    if (user) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          setProfileData(data);
          setNewRobloxName(data.roblox?.username || '');
        })
        .catch(err => console.warn('Profile fetch error:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSaveRoblox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRobloxName.trim()) return;

    setSavingRoblox(true);
    try {
      const res = await fetch('/api/user/link-roblox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({ robloxUsername: newRobloxName.trim() })
      });
      if (res.ok) {
        setEditingRoblox(false);
        await refreshUser();
        const profileRes = await fetch('/api/user/profile');
        if (profileRes.ok) {
          const updated = await profileRes.json();
          setProfileData(updated);
        }
      }
    } finally {
      setSavingRoblox(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020814] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#00A8FF]/10 border border-[#00A8FF]/30 flex items-center justify-center text-[#00A8FF] mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">Authentication Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please sign in with your Discord account to access your personal West Virginia State Roleplay dossier, sanctions history, and combat statistics.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-xs transition-all shadow-lg shadow-[#5865F2]/20"
          >
            Sign In with Discord
          </button>
        </div>
        <DevLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Profile Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#03152d] border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#00A8FF]/40 shadow-xl"
            />
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-white">{user.username}</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#00A8FF]/10 text-[#00A8FF] border border-[#00A8FF]/30">
                  {user.isManagement ? 'Management' : user.isHighRank ? 'High Rank' : user.isStaff ? 'Staff Member' : 'Civilian Member'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Discord ID: {user.id}</p>

              {/* Linked Roblox Username */}
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="text-slate-500">Linked Roblox:</span>
                {editingRoblox ? (
                  <form onSubmit={handleSaveRoblox} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRobloxName}
                      onChange={e => setNewRobloxName(e.target.value)}
                      placeholder="Roblox Username"
                      className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#00A8FF]"
                    />
                    <button
                      type="submit"
                      disabled={savingRoblox}
                      className="px-2.5 py-1 rounded bg-[#00A8FF] text-slate-950 font-bold text-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRoblox(false)}
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">
                      {profileData?.roblox?.username || 'Not Linked'}
                    </span>
                    <button
                      onClick={() => setEditingRoblox(true)}
                      className="text-slate-500 hover:text-[#00A8FF] transition-colors"
                      title="Update Roblox account"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {user.isStaff && (
            <Link
              to="/staff/overview"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A8FF] hover:bg-[#0092dd] text-slate-950 font-bold text-xs transition-all shadow-lg shadow-[#00A8FF]/20"
            >
              <Shield className="w-4 h-4" />
              <span>Go to Staff Operations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Combat & In-Game Statistics (Displays "Not tracked yet" if not tracked) */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Swords className="w-4 h-4 text-[#00A8FF]" />
              <span>ER:LC Combat & Server Statistics</span>
            </h2>
            <span className="text-[11px] text-slate-500">Live Database Feed</span>
          </div>

          {profileData?.stats && profileData.stats.tracked ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Logged Kills</p>
                <p className="text-2xl font-black text-white mt-1">{profileData.stats.kills}</p>
              </div>
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Logged Deaths</p>
                <p className="text-2xl font-black text-white mt-1">{profileData.stats.deaths}</p>
              </div>
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Kill / Death Ratio</p>
                <p className="text-2xl font-black text-[#00A8FF] mt-1">{profileData.stats.kd}</p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Playtime, kills, and death metrics:</span>
              <span className="px-3 py-1 rounded bg-slate-800 text-slate-400 font-medium font-mono">
                Not tracked yet
              </span>
            </div>
          )}
        </div>

        {/* Moderation Cases on Record */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Your Moderation Cases ({profileData?.cases?.length || 0})</span>
            </h2>
            <Link to="/appeal" className="text-xs text-[#00A8FF] hover:underline font-semibold">
              Submit Appeal
            </Link>
          </div>

          {loading ? (
            <div className="h-20 bg-slate-950 animate-pulse rounded-xl" />
          ) : !profileData?.cases || profileData.cases.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Clean Standing</p>
              <p className="text-[11px] text-slate-500">You have zero active sanctions or moderation cases on file.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Case ID</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Moderator</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {profileData.cases.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#00A8FF]">{c.id}</td>
                      <td className="py-3 px-3 font-semibold text-white">{c.action_type}</td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{c.reason}</td>
                      <td className="py-3 px-3 text-slate-400">{c.moderator_username}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'ACTIVE' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(c.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Support Tickets & Transcripts */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00A8FF]" />
              <span>Your Support Tickets & Transcripts</span>
            </h2>
            <Link to="/transcripts" className="text-xs text-[#00A8FF] hover:underline font-semibold">
              Browse All Transcripts
            </Link>
          </div>

          {loading ? (
            <div className="h-20 bg-slate-950 animate-pulse rounded-xl" />
          ) : !profileData?.tickets || profileData.tickets.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No support tickets opened under your Discord ID.</p>
          ) : (
            <div className="space-y-2">
              {profileData.tickets.map((t: any) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">#{t.id}</span>
                      <span className="font-semibold text-[#00A8FF]">{t.category}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        t.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate max-w-md">{t.inquiry}</p>
                  </div>
                  <Link
                    to={`/transcripts/${t.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-[#00A8FF] hover:text-slate-950 text-slate-300 font-semibold text-xs transition-colors"
                  >
                    <span>View Transcript</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
