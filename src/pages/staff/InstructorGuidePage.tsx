import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Edit3, Save, CheckCircle2, ChevronDown, HelpCircle, Check, BookOpen } from 'lucide-react';

interface ExamQuestion {
  num: number;
  question: string;
  answerKey: string;
}

export default function InstructorGuidePage() {
  const { user } = useAuth();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [expandedAnswers, setExpandedAnswers] = useState<{ [num: number]: boolean }>({});

  const examQuestions: ExamQuestion[] = [
    {
      num: 1,
      question: 'What are the three core elements required before conducting a traffic stop in ER:LC?',
      answerKey: 'Probable cause (observed violation), proper vehicle lighting and siren activation, and transmitting a radio dispatch stop code with location and plate.'
    },
    {
      num: 2,
      question: 'Under what exact circumstances is lethal force authorized by law enforcement personnel?',
      answerKey: 'Only when there is an immediate, demonstrable threat of death or serious physical harm to officers or civilians. Never use lethal force for fleeing vehicles or non-violent evasion.'
    },
    {
      num: 3,
      question: 'Define Fail Roleplay (FRP) and provide two distinct in-game examples.',
      answerKey: 'FRP is taking actions in-game that are physically impossible or violate realistic human behavior. Examples: 1) Continuing a 100 MPH pursuit after multiple rollovers without medical RP; 2) Cuff-rushing an armed suspect holding an assault rifle.'
    },
    {
      num: 4,
      question: 'What is the mandatory procedure when a player disconnects during an active staff sit (LTAP)?',
      answerKey: 'Immediately capture recording/screenshot proof of the disconnection and the sit reason, note their Roblox ID and username, issue a 3-day server ban for LTAP, and log it in the staff panel.'
    },
    {
      num: 5,
      question: 'Explain the New Life Rule (NLR) timer and area restriction policy.',
      answerKey: 'Upon respawning after death, the player must not return to the same scene or sector within 15 minutes, must not retaliate against the person who killed them, and has forgotten all memory of the event.'
    },
    {
      num: 6,
      question: 'What command permissions are probationary moderators strictly prohibited from running?',
      answerKey: 'Server-wide broadcast commands (:m, :h), map environment alterations (:time, :weather), permanent server bans, and administrative group rank changes without supervisor oversight.'
    },
    {
      num: 7,
      question: 'How must an on-duty staff member respond if a civilian accuses them of abusive behavior?',
      answerKey: 'Remain calm and de-escalate. Never argue in game chat. Advise the player to file a formal ticket in the Discord server with video evidence, and notify an active supervisor or Internal Affairs.'
    },
    {
      num: 8,
      question: 'What is the required quota for all active staff troopers each week?',
      answerKey: '3 hours and 20 minutes of recorded duty time logged via the staff panel clock-in module or in-game duty tracking system.'
    },
    {
      num: 9,
      question: 'Describe the protocol for initiating and participating in a high-speed vehicle pursuit.',
      answerKey: 'Maximum of 3 secondary pursuit vehicles unless authorized by a Sergeant or higher. Terminate pursuit if approaching crowded civilian safezones or if civilian pedestrian hazard is severe.'
    },
    {
      num: 10,
      question: 'How does the Watchdog AI sentinel flag potential mass RDM and what is the staff response protocol?',
      answerKey: 'Watchdog flags 3 or more kills in under 60 seconds with 85%+ confidence. Staff must check the target, teleport or spectate immediately, verify combat logs, and issue a ban if RDM is confirmed.'
    },
    {
      num: 11,
      question: 'What constitutes Cop Baiting and what progressive discipline applies?',
      answerKey: 'Deliberately revving, ramming cruisers, or performing illegal donuts in front of police solely to force a pursuit. Penalty: 1st offence Warning, 2nd offence Kick, 3rd offence 24h Ban.'
    },
    {
      num: 12,
      question: 'What steps are required to conclude an in-game staff sit properly?',
      answerKey: 'State the final disciplinary decision clearly to all involved parties, log the case in the staff panel using :log or web form with proof, return players to their original locations, and close the sit.'
    }
  ];

  useEffect(() => {
    document.title = 'Instructor Guide · New York City Roleplay Staff Panel';
    fetchGuide();
  }, []);

  const fetchGuide = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/staff/guides?id=instructor-guide');
      if (res.ok) {
        const data = await res.json();
        setGuide(data);
        setTitle(data?.title || 'Training & Academy Instructor Curriculum');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (num: number) => {
    setExpandedAnswers(prev => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#142332]">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-4 h-4 text-[#00a8ff]" />
          <span className="text-[10px] font-bold text-[#00a8ff] uppercase tracking-wider">
            Academy Instruction &amp; Evaluation
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Staff Instructor Guide
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Standardized syllabus, examination questions, and ride-along evaluation rubric for Staff Instructors.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#00a8ff] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-400">Loading instructor guide...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION I */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#172737]">
              <span className="w-6 h-6 rounded-lg bg-[#142332] text-[#00a8ff] font-mono font-bold text-xs flex items-center justify-center">
                I
              </span>
              <h2 className="text-base font-bold text-white">Section I: Instructor Mission &amp; Onboarding Script</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Welcome each candidate into the private training voice channel. Instructors must maintain an encouraging yet professional demeanor. Read the official orientation script:
            </p>
            <div className="p-4 rounded-2xl bg-[#09121a] border border-[#182a3c] text-xs text-slate-300 leading-relaxed font-mono space-y-2">
              <p className="text-[#00a8ff] font-bold">"Welcome to your New York City Roleplay Staff Assessment session."</p>
              <p>"During this evaluation, you will be tested on your knowledge of server rules, staff command etiquette, de-escalation methods, and hands-on moderation scenarios. Take your time to formulate thorough, realistic answers. You are expected to demonstrate fairness, composure, and strict adherence to the 25-offence disciplinary matrix."</p>
            </div>
          </div>

          {/* SECTION II */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#172737]">
              <span className="w-6 h-6 rounded-lg bg-[#142332] text-[#00a8ff] font-mono font-bold text-xs flex items-center justify-center">
                II
              </span>
              <h2 className="text-base font-bold text-white">Section II: Rules &amp; Policy Review</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Before issuing the written exam, verify that the candidate understands:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li>The difference between civilian roleplay and administrative staff sits.</li>
              <li>How to clock in correctly and maintain the 3h 20m weekly quota.</li>
              <li>The requirement to always document proof (Medal/OBS/Gyazo) for all kicks and bans.</li>
              <li>The prohibition of utilizing administrative commands (:jail, :kick, :m) during active roleplay without supervisory permission.</li>
            </ul>
          </div>

          {/* SECTION III: 12 EXAM QUESTIONS */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#172737]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#142332] text-[#00a8ff] font-mono font-bold text-xs flex items-center justify-center">
                  III
                </span>
                <h2 className="text-base font-bold text-white">Section III: 12 Written Examination Questions</h2>
              </div>
              <span className="text-xs text-[#00a8ff] font-mono">Passing Grade: 10/12 (83%)</span>
            </div>

            <p className="text-xs text-slate-400">
              Instructors can click on any question to view the standardized evaluation answer key.
            </p>

            <div className="space-y-3">
              {examQuestions.map((q) => {
                const isOpen = expandedAnswers[q.num];
                return (
                  <div
                    key={q.num}
                    className="p-4 rounded-2xl bg-[#09121a] border border-[#182a3c] space-y-2.5 text-xs"
                  >
                    <div
                      onClick={() => toggleAnswer(q.num)}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <div className="font-semibold text-white group-hover:text-[#00a8ff] transition-colors pr-2">
                        <span className="text-[#00a8ff] font-bold mr-2">Question {q.num}:</span>
                        <span>{q.question}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {isOpen && (
                      <div className="pt-2 border-t border-[#142332] text-[11px] text-slate-300 space-y-1">
                        <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Standard Evaluation Answer Key:</span>
                        </div>
                        <p className="leading-relaxed pl-5 text-slate-300">
                          {q.answerKey}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION IV: RIDE-ALONG */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#172737]">
              <span className="w-6 h-6 rounded-lg bg-[#142332] text-[#00a8ff] font-mono font-bold text-xs flex items-center justify-center">
                IV
              </span>
              <h2 className="text-base font-bold text-white">Section IV: In-Game Ride-Along Evaluation Protocol</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Candidates who pass the examination must complete a 45-minute supervised in-game ride-along:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#09121a] border border-[#182a3c] space-y-1">
                <span className="font-bold text-white block">Phase 1: Observation</span>
                <p className="text-slate-400 text-[11px]">Shadow the instructor during 2 live traffic stops and 1 staff sit without intervening.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#09121a] border border-[#182a3c] space-y-1">
                <span className="font-bold text-white block">Phase 2: Lead Handling</span>
                <p className="text-slate-400 text-[11px]">The candidate leads 1 staff sit while the instructor monitors dialogue and professionalism.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#09121a] border border-[#182a3c] space-y-1">
                <span className="font-bold text-white block">Phase 3: Final Debrief</span>
                <p className="text-slate-400 text-[11px]">Review logging accuracy, command syntax, and submit the recommendation to Management.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
