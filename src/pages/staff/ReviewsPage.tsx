import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CheckSquare,
  Search,
  Check,
  X,
  Play,
  RotateCcw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const filterPills = [
  'All',
  'Staff Application',
  'Discord Appeal',
  'In-Game Ban Appeal'
];

export default function ReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Waiting' | 'Decided'>('Waiting');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedReviewId, setSelectedReviewId] = useState<string>('APP-0130');
  const [actionDone, setActionDone] = useState<string | null>(null);

  // Replay typing state simulation
  const [replayingQuestion, setReplayingQuestion] = useState<number | null>(null);
  const [replayedText, setReplayedText] = useState<{ [qIndex: number]: string }>({});

  useEffect(() => {
    document.title = 'Reviews · New York City Roleplay Staff Panel';
  }, []);

  // Candidate questions & answers matching image_aae36836.png
  const candidateQuestions = [
    {
      id: 1,
      q: 'Why do you want to join the New York City Roleplay staff team?',
      a: 'I want to help maintain a realistic, high quality roleplay environment. I have been in the ER:LC community for over 2 years and I notice that when staff are absent, trolls and mass RDMers ruin the experience for civilians and police officers. I want to assist on duty and handle sits promptly.',
      aiPercent: 0,
      pastedPercent: 12,
      wpm: 58
    },
    {
      id: 2,
      q: 'What previous ER:LC moderation or staff experience do you have?',
      a: 'I was previously a Moderator in Liberty County State Police (LCSP) for 4 months where I logged over 120 shift hours and handled in-game tickets. I also served as an Administrator in a 1,500 member community.',
      aiPercent: 0,
      pastedPercent: 85,
      wpm: 42
    },
    {
      id: 3,
      q: 'Define Fail Roleplay (FRP), Random Deathmatch (RDM), and Vehicle Deathmatch (VDM).',
      a: 'FRP is performing actions that defy real-world logic, physics, or roleplay scenarios, such as driving up a 90 degree cliff or cuff rushing someone holding a firearm. RDM is killing another player with no valid roleplay justification or interaction. VDM is running players over with a motor vehicle without prior valid RP.',
      aiPercent: 0,
      pastedPercent: 70,
      wpm: 60
    },
    {
      id: 4,
      q: 'How would you handle a player who refuses to listen or continuously interrupts during a staff sit?',
      a: 'I would calmly ask them to mute their mic or refrain from spamming chat. If they continue to disrupt the sit, I would issue a temporary 5-minute mute or bring them to an isolated sit location so the other parties can provide their side of the story.',
      aiPercent: 0,
      pastedPercent: 0,
      wpm: 54
    },
    {
      id: 5,
      q: 'What would you do if you catch a fellow staff member abusing in-game commands?',
      a: 'I would record video evidence using Medal or OBS, avoid arguing or retaliating in front of civilian players, and immediately submit the clip and details to Internal Affairs (IA) and Management through staff channels.',
      aiPercent: 0,
      pastedPercent: 0,
      wpm: 51
    },
    {
      id: 6,
      q: 'Explain the New Life Rule (NLR) and Fear RP in detail.',
      a: 'NLR states that once killed, you forget all prior events and interactions leading to your death and cannot return to that exact scene for 15 minutes. Fear RP requires players to realistically value their character life when faced with a lethal threat, such as being held at gunpoint.',
      aiPercent: 0,
      pastedPercent: 80,
      wpm: 49
    },
    {
      id: 7,
      q: 'What are the restrictions on running server-wide broadcast commands like :m and :h?',
      a: ':m and :h are strictly reserved for server-wide notices such as peacetime status, server restarts, or command-level emergencies. They must never be used for casual chat, jokes, or non-administrative chatter.',
      aiPercent: 0,
      pastedPercent: 0,
      wpm: 55
    },
    {
      id: 8,
      q: 'How many hours can you commit to active staff duty weekly?',
      a: 'I can commit between 4 to 6 hours every week, which easily satisfies the 3 hour and 20 minute quota.',
      aiPercent: 0,
      pastedPercent: 0,
      wpm: 62
    },
    {
      id: 9,
      q: 'What timezone are you located in and what hours are you most active?',
      a: 'I am located in Eastern Standard Time (EST) and I am primarily active between 4:00 PM and 10:00 PM on weekdays, and all afternoon on weekends.',
      aiPercent: 0,
      pastedPercent: 0,
      wpm: 56
    },
    {
      id: 10,
      q: 'Do you have any questions or additional comments for the review board?',
      a: 'Thank you for reviewing my application! I look forward to helping the community grow and keeping server roleplay realistic.',
      aiPercent: 0,
      pastedPercent: 0,
      wpm: 58
    }
  ];

  // Replay typing animation
  const startReplay = (qIndex: number, fullText: string) => {
    setReplayingQuestion(qIndex);
    setReplayedText(prev => ({ ...prev, [qIndex]: '' }));
    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex += 3;
      if (charIndex >= fullText.length) {
        setReplayedText(prev => ({ ...prev, [qIndex]: fullText }));
        clearInterval(interval);
        setReplayingQuestion(null);
      } else {
        setReplayedText(prev => ({ ...prev, [qIndex]: fullText.slice(0, charIndex) }));
      }
    }, 40);
  };

  const handleDecision = (decision: string) => {
    setActionDone(decision);
    setTimeout(() => setActionDone(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching image_ebcd3b39.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Reviews</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review candidate applications and moderation appeals with AI &amp; typing integrity analysis.
          </p>
        </div>

        {/* Waiting vs Decided Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#0a141e] border border-[#142332] rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('Waiting')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'Waiting'
                ? 'bg-[#152737] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Waiting
          </button>
          <button
            onClick={() => setActiveTab('Decided')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'Decided'
                ? 'bg-[#152737] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Decided
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#0a141e] border border-[#142332] rounded-2xl w-fit">
        {filterPills.map((pill) => (
          <button
            key={pill}
            onClick={() => setActiveFilter(pill)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeFilter === pill
                ? 'bg-[#152737] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      {actionDone && (
        <div className="p-3 rounded-2xl bg-[#00a8ff]/15 border border-[#00a8ff]/30 text-[#00a8ff] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Decision recorded: Candidate marked as {actionDone}!</span>
        </div>
      )}

      {/* DETAILED INSPECTION VIEW matching image_aae36836.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 cols): 10 Questions with answer and replay */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Banner */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#00a8ff]">APP-0130</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-white font-bold text-base">woy543</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Staff Application · Submitted 18m ago · Discord: <span className="text-slate-200">woy#0000</span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold w-fit">
                Waiting for review
              </span>
            </div>
          </div>

          {/* 10 Questions and Answers */}
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-6">
            <div className="text-sm font-bold text-white pb-3 border-b border-[#172737]">
              Application Questionnaire &amp; Replay (10 Questions)
            </div>

            <div className="space-y-6 divide-y divide-[#152737] pt-1">
              {candidateQuestions.map((q, idx) => {
                const isReplaying = replayingQuestion === idx;
                const displayText = isReplaying && replayedText[idx] !== undefined ? replayedText[idx] : q.a;

                return (
                  <div key={q.id} className="pt-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-white text-xs leading-relaxed">
                        <span className="text-[#00a8ff] font-bold">Q{q.id}.</span> {q.q}
                      </div>

                      {/* Integrity Badges per question */}
                      <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                        <span className="px-2 py-0.5 rounded-lg bg-[#142332] text-slate-300 font-mono">
                          AI: {q.aiPercent}%
                        </span>
                        {q.pastedPercent > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 font-mono font-semibold">
                            Pasted: {q.pastedPercent}%
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => startReplay(idx, q.a)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0e273c] hover:bg-[#133754] text-[#00a8ff] font-semibold transition-colors"
                          title="Replay simulated keystrokes"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Replay</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#09121a] border border-[#182a3c] text-xs text-slate-200 leading-relaxed font-sans">
                      {displayText}
                      {isReplaying && <span className="inline-block w-1.5 h-3 bg-[#00a8ff] ml-1 animate-pulse" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): Integrity Check Scorecard matching image_aae36836.png */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="bg-[#0e1822] border border-[#182735] rounded-3xl p-6 shadow-lg shadow-black/20 space-y-5">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Integrity Check
              </div>
              <p className="text-[11px] text-slate-400">
                Automated keystroke dynamics, copy-paste monitoring, and AI detection.
              </p>
            </div>

            {/* Score Display (40/100 Amber) matching image_aae36836.png */}
            <div className="p-4 rounded-2xl bg-[#142332] border border-[#1f374e] flex items-center justify-between">
              <div>
                <div className="text-3xl font-extrabold text-amber-400 font-mono">
                  40<span className="text-lg text-slate-400">/100</span>
                </div>
                <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                  Caution: High paste ratio
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-amber-400/80 border-t-transparent flex items-center justify-center font-bold text-xs text-white">
                40%
              </div>
            </div>

            {/* Metrics Breakdown matching screenshot */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#172737]">
                <span className="text-slate-400">AI detection</span>
                <span className="font-semibold text-emerald-400">0%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#172737]">
                <span className="text-slate-400">Pasted content</span>
                <span className="font-semibold text-amber-400">62% of answers</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#172737]">
                <span className="text-slate-400">Typing speed</span>
                <span className="font-semibold text-white font-mono">55 WPM</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#172737]">
                <span className="text-slate-400">Time on form</span>
                <span className="font-semibold text-white font-mono">9m 16s</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Page exits</span>
                <span className="font-semibold text-amber-300 font-mono">10 times · 39s total</span>
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="pt-4 border-t border-[#172737] space-y-2">
              <button
                type="button"
                onClick={() => handleDecision('ACCEPTED')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
              >
                Approve Candidate
              </button>
              <button
                type="button"
                onClick={() => handleDecision('INTERVIEW_REQUESTED')}
                className="w-full py-2.5 rounded-xl bg-[#142332] hover:bg-[#1b2f42] text-slate-200 border border-[#1f374e] font-semibold text-xs transition-colors"
              >
                Request Voice Interview
              </button>
              <button
                type="button"
                onClick={() => handleDecision('DENIED')}
                className="w-full py-2.5 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white font-bold text-xs transition-colors"
              >
                Deny Candidate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
