import React from 'react';
import { Shield, User, Award, ShieldAlert, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DevLoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#00A8FF]/10 border border-[#00A8FF]/30 flex items-center justify-center text-[#00A8FF]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sign In to WVSP</h3>
            <p className="text-xs text-slate-400">West Virginia State Roleplay Portal</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          Sign in with your Discord account via OAuth2, or select a role simulation to explore and test the platform immediately:
        </p>

        <div className="space-y-2.5">
          {/* Discord OAuth2 Direct */}
          <a
            href="/api/auth/login"
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium text-sm transition-all shadow-lg shadow-[#5865F2]/20"
          >
            <span className="flex items-center gap-2.5">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Connect with Discord OAuth2</span>
            </span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Official</span>
          </a>

          <div className="relative my-3 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <span className="relative bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider">or Test Role Clearance</span>
          </div>

          {/* Management */}
          <a
            href="/api/auth/dev-login?role=MANAGEMENT&username=ManagementOfficer"
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 text-white text-sm transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-200 leading-none">Management</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Settings, guide editing, all clearance</p>
              </div>
            </div>
            <span className="text-xs text-amber-400/80 group-hover:translate-x-0.5 transition-transform">Select &rarr;</span>
          </a>

          {/* High Rank */}
          <a
            href="/api/auth/dev-login?role=HIGH_RANK&username=Captain_HighRank"
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-[#00A8FF]/30 text-white text-sm transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-[#00A8FF]" />
              <div>
                <p className="font-semibold text-[#00A8FF] leading-none">High Rank / Command</p>
                <p className="text-[11px] text-slate-400 mt-0.5">In-game command runner, reviews</p>
              </div>
            </div>
            <span className="text-xs text-[#00A8FF]/80 group-hover:translate-x-0.5 transition-transform">Select &rarr;</span>
          </a>

          {/* Staff Member */}
          <a
            href="/api/auth/dev-login?role=STAFF&username=Trooper_Appalachian"
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white text-sm transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-200 leading-none">Staff Member (Trooper)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Clock in, punishments, live map, logs</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 group-hover:translate-x-0.5 transition-transform">Select &rarr;</span>
          </a>

          {/* Guest */}
          <a
            href="/api/auth/dev-login?role=GUEST&username=Civilian_Carter"
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 text-white text-sm transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-300 leading-none">Civilian Member</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Apply, appeal, view personal stats</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 group-hover:translate-x-0.5 transition-transform">Select &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
};
