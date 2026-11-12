import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Heart } from 'lucide-react';
import { DevLoginModal } from './DevLoginModal';

export const Footer: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <footer className="w-full bg-[#030914] border-t border-slate-900 text-slate-400 text-xs py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
            {/* Column 1: Brand & Tagline */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00A8FF]/10 border border-[#00A8FF]/30 flex items-center justify-center text-[#00A8FF]">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base text-white tracking-wider">WVSP</span>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                A professional ER:LC roleplay community built on realistic experiences, professional departments and an active community.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Whitelisted ER:LC Server Active</span>
                <span>·</span>
                <span>Version 1.2</span>
              </div>
            </div>

            {/* Column 2: Community */}
            <div>
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Community</p>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://discord.gg/wvrp"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Discord Server</span>
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.roblox.com/groups/34567890/West-Virginia-State-Roleplay"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Roblox Group</span>
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://policeroleplay.community/join/wvrp"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1.5 text-[#00A8FF]"
                  >
                    <span>ER:LC Quick Join</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Players */}
            <div>
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Players</p>
              <ul className="space-y-2">
                <li>
                  <Link to="/apply" className="hover:text-white transition-colors">
                    Staff Application
                  </Link>
                </li>
                <li>
                  <Link to="/appeal" className="hover:text-white transition-colors">
                    Discord Appeal
                  </Link>
                </li>
                <li>
                  <Link to="/ban-appeal" className="hover:text-white transition-colors">
                    In-Game Ban Appeal
                  </Link>
                </li>
                <li>
                  <Link to="/my-profile" className="hover:text-white transition-colors">
                    Your Stats
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="hover:text-white transition-colors text-left"
                  >
                    Sign In
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Staff & Legal */}
            <div>
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Staff & Legal</p>
              <ul className="space-y-2">
                <li>
                  <Link to="/staff" className="hover:text-white transition-colors text-[#00A8FF]">
                    Staff Panel
                  </Link>
                </li>
                <li>
                  <Link to="/staff/guides" className="hover:text-white transition-colors">
                    Staff Guide
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              &copy; West Virginia State Roleplay. Not affiliated with or endorsed by Roblox, Discord or Police Roleplay Community.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
              <span>·</span>
              <span className="text-slate-600">WVSP Operations</span>
            </div>
          </div>
        </div>
      </footer>

      <DevLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};
