import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DevLoginModal } from './DevLoginModal';
import { Shield, Menu, X, User as UserIcon, LogOut, ChevronDown, ExternalLink } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#06101e]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A8FF]/20 to-[#021b3a] border border-[#00A8FF]/40 flex items-center justify-center text-[#00A8FF] shadow-lg shadow-[#00A8FF]/10 group-hover:border-[#00A8FF] transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-wider">WVSP</span>
                <span className="text-[10px] uppercase font-bold text-[#00A8FF] tracking-wider px-1.5 py-0.5 rounded bg-[#00A8FF]/10 border border-[#00A8FF]/20">ER:LC</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">West Virginia State Roleplay</p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Zero-pill text links with active indicator) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              to="/"
              className={`transition-colors py-1 ${isActive('/') ? 'text-[#00A8FF] font-semibold border-b-2 border-[#00A8FF]' : 'text-slate-300 hover:text-white'}`}
            >
              Home
            </Link>
            <Link
              to="/staff"
              className={`transition-colors py-1 flex items-center gap-1.5 ${location.pathname.startsWith('/staff') ? 'text-[#00A8FF] font-semibold border-b-2 border-[#00A8FF]' : 'text-slate-300 hover:text-white'}`}
            >
              <span>Staff Panel</span>
              {user?.isStaff && (
                <span className="w-2 h-2 rounded-full bg-[#00A8FF] animate-pulse"></span>
              )}
            </Link>
            <Link
              to="/apply"
              className={`transition-colors py-1 ${isActive('/apply') ? 'text-[#00A8FF] font-semibold border-b-2 border-[#00A8FF]' : 'text-slate-300 hover:text-white'}`}
            >
              Apply
            </Link>
            <Link
              to="/my-profile"
              className={`transition-colors py-1 ${isActive('/my-profile') ? 'text-[#00A8FF] font-semibold border-b-2 border-[#00A8FF]' : 'text-slate-300 hover:text-white'}`}
            >
              Your Stats
            </Link>
          </nav>

          {/* Auth Controls */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-all text-left"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#00A8FF]/40"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white leading-none">{user.username}</p>
                    <p className="text-[10px] text-[#00A8FF] font-medium leading-tight mt-0.5">
                      {user.isManagement ? 'Management' : user.isHighRank ? 'High Rank' : user.isStaff ? 'Staff' : 'Civilian'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs"
                  >
                    <div className="px-3.5 py-2 border-b border-slate-800">
                      <p className="font-semibold text-slate-200">{user.username}</p>
                      <p className="text-slate-400 font-mono text-[10px]">ID: {user.id}</p>
                    </div>

                    <Link
                      to="/my-profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Your Stats & Record</span>
                    </Link>

                    {user.isStaff && (
                      <Link
                        to="/staff/overview"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-[#00A8FF] hover:bg-slate-800/80 transition-colors font-medium"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Staff Operations Panel</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2 w-full text-left px-3.5 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A8FF] hover:bg-[#0092dd] text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-md shadow-[#00A8FF]/20"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#00A8FF] text-slate-950 font-semibold text-xs"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#06101e] px-4 pt-3 pb-6 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-200 hover:text-[#00A8FF]"
            >
              Home
            </Link>
            <Link
              to="/staff"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-200 hover:text-[#00A8FF]"
            >
              Staff Panel
            </Link>
            <Link
              to="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-200 hover:text-[#00A8FF]"
            >
              Apply
            </Link>
            <Link
              to="/my-profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-200 hover:text-[#00A8FF]"
            >
              Your Stats
            </Link>

            {user && (
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded" />
                  <span className="text-xs text-slate-300 font-semibold">{user.username}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 text-xs text-red-400 py-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <DevLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};
