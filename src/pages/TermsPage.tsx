import React, { useEffect } from 'react';
import { Gavel, CheckCircle2, AlertOctagon, Scale, ShieldAlert } from 'lucide-react';

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service · WVSP';
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00A8FF]/10 text-[#00A8FF] text-xs font-semibold uppercase tracking-wider mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>Community Standards · Version 2.0</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            West Virginia State Roleplay (WVSP) Participation Agreement &amp; Code of Conduct
          </p>
          <div className="text-xs text-slate-500 mt-4 flex items-center gap-4">
            <span>Last Revised: November 10, 2026</span>
            <span>•</span>
            <span>Applies to all players, staff, and visitors</span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00A8FF]" />
              1. Agreement to Terms
            </h2>
            <p>
              By accessing the West Virginia State Roleplay portal, joining our Discord guild, or connecting to our Emergency Response: Liberty County (ER:LC) private server, you expressly agree to abide by these Terms of Service and all community guidelines enacted by WVSP Leadership.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#00A8FF]" />
              2. Roleplay Standards &amp; In-Game Conduct
            </h2>
            <p>
              All participants are required to maintain a high standard of realistic roleplay during official sessions. The following prohibited conduct will result in formal disciplinary action:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">RDM / VDM:</strong> Random Deathmatch or Vehicle Deathmatch without active, valid roleplay justification.</li>
              <li><strong className="text-slate-200">FRP (Fail Roleplay):</strong> Unrealistic behaviors, vehicle flipping exploits, or refusal to comply with law enforcement fear RP.</li>
              <li><strong className="text-slate-200">LTAP / LTAA:</strong> Leaving to Avoid Punishment or Leaving to Avoid Arrest.</li>
              <li><strong className="text-slate-200">Cop Baiting:</strong> Deliberately committing petty offenses directly in front of law enforcement units solely to provoke pursuits.</li>
              <li><strong className="text-slate-200">Staff Evasion:</strong> Disconnecting or refusing to respond during an active staff sit.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#00A8FF]" />
              3. Staff Authority &amp; System Integrity
            </h2>
            <p>
              Designated West Virginia State Roleplay staff members are empowered to moderate in-game sessions, inspect player conduct, issue timeouts, and enforce disciplinary actions in accordance with the official Punishment Guide.
            </p>
            <p>
              Attempting to bypass automated systems, exploit Discord OAuth sessions, forge application responses, or interfere with web portal operations will result in an immediate permanent blacklist from all WVSP assets.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Gavel className="w-4 h-4 text-[#00A8FF]" />
              4. Appeals &amp; Administrative Review
            </h2>
            <p>
              Members subjected to moderation sanctions are entitled to file a single formal appeal via the WVSP portal. All appeal determinations made by High Command or Management are final and binding.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              West Virginia State Roleplay is an independent community and is not affiliated with, sponsored by, or endorsed by Roblox Corporation, Discord Inc., or Police Roleplay Community.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
