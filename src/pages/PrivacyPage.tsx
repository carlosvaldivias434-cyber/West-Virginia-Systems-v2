import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

const sections = [
  { id: 'who-this-covers', title: 'Who this covers' },
  { id: 'not-staff', title: 'If you are not staff' },
  { id: 'from-staff', title: 'What we collect from staff' },
  { id: 'support-tickets', title: 'Support tickets' },
  { id: 'about-players', title: 'What we collect about players' },
  { id: 'staff-applications', title: 'Staff applications' },
  { id: 'who-can-see', title: 'Who can see it' },
  { id: 'services-rely-on', title: 'Services we rely on' },
  { id: 'how-long-keep', title: 'How long we keep it' },
  { id: 'your-choices', title: 'Your choices' },
  { id: 'changes', title: 'Changes' },
];

export default function PrivacyPage() {
  const [activeId, setActiveId] = useState('who-this-covers');

  useEffect(() => {
    document.title = 'Privacy Policy · New York City Roleplay';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveId(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d13] text-[#cfd9e3] selection:bg-[#00a8ff]/30 selection:text-white">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#060d13]/85 backdrop-blur-md border-b border-[#132230]/60 flex items-center justify-between px-6 lg:px-12 text-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to sign in</span>
        </Link>
        <Link
          to="/terms"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-[#00a8ff] transition-colors"
        >
          <span>Read the Terms of Service</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="pt-28 pb-32 px-6 lg:px-12 max-w-6xl mx-auto">
        {/* Title Header matching image_5f85599a.png */}
        <div className="text-center max-w-2xl mx-auto mb-16 pt-4">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#0e273c] to-[#0a1824] border border-[#1b3d5c] p-2.5 shadow-xl shadow-cyan-950/40 flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-[#00a8ff]">
                <path
                  d="M24 4L7 11V22C7 32.5 14.3 42.1 24 44C33.7 42.1 41 32.5 41 22V11L24 4Z"
                  stroke="#00a8ff"
                  strokeWidth="2.5"
                  fill="#0c2235"
                />
                <path
                  d="M24 12V36M16 20L24 12L32 20M15 32H33"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mt-4 leading-relaxed font-normal">
            What New York City Roleplay collects, why we collect it, and how long we keep it.
          </p>
          <p className="text-xs text-slate-500 mt-4 tracking-wide font-mono">
            Version 1.1 · Effective 27 October 2026
          </p>
        </div>

        {/* 2-Column Grid: Sticky Nav Left + Content Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="bg-[#0a141e]/70 border border-[#142332] rounded-xl p-5 shadow-lg shadow-black/20">
              <div className="text-xs font-semibold text-[#00a8ff] uppercase tracking-wider mb-3">
                On this page
              </div>
              <nav className="space-y-1">
                {sections.map((sec) => {
                  const isActive = activeId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                        isActive
                          ? 'bg-[#00a8ff]/15 text-white font-medium border-l-2 border-[#00a8ff]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#101e2c]'
                      }`}
                    >
                      <span className="truncate">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right Content Stream */}
          <article className="lg:col-span-8 space-y-12 text-[15px] leading-relaxed text-[#c3d0dc]">
            {/* Who this covers */}
            <section id="who-this-covers" className="scroll-mt-24 space-y-3 pt-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Who this covers
              </h2>
              <p className="text-slate-300">
                This policy explains what the New York City Roleplay website, staff panel and Discord bot collect about members, staff and players moderated in our ER:LC server, why we collect it, and how long we keep it. By signing in you agree to it.
              </p>
            </section>

            {/* If you are not staff */}
            <section id="not-staff" className="scroll-mt-24 space-y-3 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                If you are not staff
              </h2>
              <p className="text-slate-300">
                Anyone in the New York City Roleplay Discord server can sign in to see their own moderation logs and ticket transcripts. For non-staff we use your Discord user ID, username, avatar and the Roblox account linked to your Discord, to show logs recorded against that Roblox account. We do not read your server list, and a session cookie keeps you signed in for up to 12 hours. If you request staff, your Discord name, Roblox name and reason are posted to a staff channel.
              </p>
            </section>

            {/* What we collect from staff */}
            <section id="from-staff" className="scroll-mt-24 space-y-4 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                What we collect from staff
              </h2>
              <ul className="space-y-3 text-slate-300 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-[#00a8ff] font-semibold">Discord account:</span>
                  <span>your user ID, username, display name, avatar and server roles, checked on every page to confirm you are still staff.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00a8ff] font-semibold">Linked Roblox account:</span>
                  <span>your Roblox username and user ID, taken from Bloxlink or your server nickname.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00a8ff] font-semibold">Staff activity:</span>
                  <span>shift times, punishments you log, proof you upload, in-game commands you run from the panel, and leave of absence requests including the reason.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00a8ff] font-semibold">Sign-in details:</span>
                  <span>a session cookie that keeps you signed in, and the date you agreed to this policy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00a8ff] font-semibold">Your Discord servers:</span>
                  <span>the list of servers you are in, used only to check staff against our server blacklist. It is replaced each time you sign in, and matches are only shown to management.</span>
                </li>
              </ul>
            </section>

            {/* Support tickets */}
            <section id="support-tickets" className="scroll-mt-24 space-y-3 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Support tickets
              </h2>
              <p className="text-slate-300">
                When a support ticket closes, its messages, attachments and participants are saved as a transcript. Transcripts can be read by staff and by the member who opened the ticket.
              </p>
            </section>

            {/* What we collect about players */}
            <section id="about-players" className="scroll-mt-24 space-y-3 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                What we collect about players
              </h2>
              <p className="text-slate-300">
                When a punishment is logged against you in-game (using <code className="bg-[#122334] text-[#00a8ff] px-1.5 py-0.5 rounded font-mono text-xs">:log</code>) or through the staff panel, we save your Roblox username, Roblox user ID, the reason, proof if provided, and who logged it. These are kept so staff can check previous offences when deciding how to handle a player.
              </p>
            </section>

            {/* Staff applications */}
            <section id="staff-applications" className="scroll-mt-24 space-y-3 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Staff applications
              </h2>
              <p className="text-slate-300">
                When you apply for staff, we record your Discord and Roblox accounts, your answers, how long you took to fill the form, and a typing integrity score. Applications are kept on file and can be reviewed by staff.
              </p>
            </section>

            {/* Who can see it */}
            <section id="who-can-see" className="scroll-mt-24 space-y-4 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Who can see it
              </h2>
              <ul className="space-y-2.5 text-slate-300 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-semibold">Your logs:</span>
                  <span>you can see your own punishments and your own ticket transcripts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00a8ff] font-semibold">Staff:</span>
                  <span>staff can see all player punishments, ticket transcripts, in-game logs, and active shifts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-semibold">Management:</span>
                  <span>only management can see the server blacklist matches, staff activity reports, and audit logs.</span>
                </li>
              </ul>
              <p className="text-slate-400 text-sm mt-3">
                We never sell, rent or share your data with advertisers or third parties.
              </p>
            </section>

            {/* Services we rely on */}
            <section id="services-rely-on" className="scroll-mt-24 space-y-3 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Services we rely on
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li><strong className="text-white">Discord API</strong> for sign-in, role checks, and sending transcripts to ticket channels.</li>
                <li><strong className="text-white">Roblox and Bloxlink APIs</strong> to match Discord accounts to Roblox accounts and fetch avatar headshots.</li>
                <li><strong className="text-white">ER:LC API</strong> to run in-game commands, read server logs, and sync punishment records.</li>
              </ul>
            </section>

            {/* How long we keep it */}
            <section id="how-long-keep" className="scroll-mt-24 space-y-3 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                How long we keep it
              </h2>
              <ul className="space-y-2 text-slate-300">
                <li><strong className="text-white">Punishments and transcripts:</strong> kept indefinitely for moderation history and appeal checks.</li>
                <li><strong className="text-white">Staff activity and shifts:</strong> kept for the duration of the staff member's service plus 90 days.</li>
                <li><strong className="text-white">Session cookies:</strong> expire automatically after 12 hours.</li>
                <li><strong className="text-white">Discord server lists:</strong> overwritten on every sign-in and not stored historically.</li>
              </ul>
            </section>

            {/* Your choices */}
            <section id="your-choices" className="scroll-mt-24 space-y-3 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Your choices
              </h2>
              <p className="text-slate-300">
                You can request a copy of your records or ask to have non-essential data removed by opening a ticket in our Discord server. Note that active punishments and bans cannot be deleted while they remain in effect.
              </p>
            </section>

            {/* Changes */}
            <section id="changes" className="scroll-mt-24 space-y-3 border-t border-[#122232] pt-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Changes
              </h2>
              <p className="text-slate-300">
                We may update this policy occasionally. When we make significant changes, we will post an announcement in our Discord server. Continued use of the website or staff panel after changes are posted means you accept the updated policy.
              </p>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
