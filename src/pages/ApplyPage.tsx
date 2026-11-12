import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Department } from '../types';
import { DevLoginModal } from '../components/DevLoginModal';
import {
  FileText,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Lock,
  Building2,
  Sparkles
} from 'lucide-react';

export const ApplyPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [robloxUsername, setRobloxUsername] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(Array(15).fill(''));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [step, setStep] = useState<'PICKER' | 'QUESTIONNAIRE' | 'CONFIRMATION'>('PICKER');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [confirmationData, setConfirmationData] = useState<{ referenceId: string; department: string; submittedAt: number } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Staff Application · WVSP';

    // Fetch active departments
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          setSelectedDept(data[0].id);
        }
      })
      .catch(() => {});

    // Prefill linked Roblox username if available
    if (user?.robloxUser?.username) {
      setRobloxUsername(user.robloxUser.username);
    }
  }, [user]);

  const handleStartApplication = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedDept) {
      setErrorMsg('Please select a department to apply for.');
      return;
    }

    if (!robloxUsername.trim()) {
      setErrorMsg('Please enter your Roblox username.');
      return;
    }

    setErrorMsg('');
    try {
      const res = await fetch(`/api/apply/questions?departmentId=${selectedDept}`);
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length === 15) {
          setQuestions(data.questions);
          setStep('QUESTIONNAIRE');
          setCurrentIndex(0);
          return;
        }
      }
    } catch {}

    setErrorMsg('Could not load application questions. Please try again.');
  };

  const handleAnswerChange = (text: string) => {
    const updated = [...answers];
    updated[currentIndex] = text;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (!answers[currentIndex] || answers[currentIndex].trim().length < 5) {
      setErrorMsg('Please provide a substantive answer (at least 5 characters).');
      return;
    }
    setErrorMsg('');
    if (currentIndex < 14) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate current answer
    if (!answers[currentIndex] || answers[currentIndex].trim().length < 5) {
      setErrorMsg('Please complete Question 15 before submitting.');
      return;
    }

    // Verify all 15 questions have answers
    for (let i = 0; i < 15; i++) {
      if (!answers[i] || answers[i].trim().length < 5) {
        setCurrentIndex(i);
        setErrorMsg(`Please complete Question ${i + 1} before submitting.`);
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': user?.csrfToken || ''
        },
        body: JSON.stringify({
          departmentId: selectedDept,
          robloxUsername: robloxUsername.trim(),
          answers
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setConfirmationData(data);
      setStep('CONFIRMATION');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Step Indicator Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A8FF]/10 border border-[#00A8FF]/30 text-[#00A8FF] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>WEST VIRGINIA STATE ROLEPLAY RECRUITMENT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Department Staff Application</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            15 evaluated questions covering emergency response protocols, roleplay standards, and server guidelines.
          </p>
        </div>

        {/* Auth Check Banner if logged out */}
        {!user && (
          <div className="mb-6 rounded-xl bg-slate-900 border border-amber-500/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400" />
              <div className="text-xs">
                <p className="font-semibold text-slate-200">Discord Sign-In Required</p>
                <p className="text-slate-400">You must sign in to save and submit your application.</p>
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

        {/* STEP 1: PICKER */}
        {step === 'PICKER' && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Desired Department
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDept(dept.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedDept === dept.id
                        ? 'bg-[#00A8FF]/10 border-[#00A8FF] text-white shadow-lg shadow-[#00A8FF]/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <p className="font-bold text-sm text-white">{dept.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {dept.description || 'Primary emergency response department.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                2. Roblox Username
              </label>
              <input
                type="text"
                value={robloxUsername}
                onChange={e => setRobloxUsername(e.target.value)}
                placeholder="e.g. WV_Trooper42"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-[#00A8FF] text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Must match your primary Roblox account used to join ER:LC server sessions.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleStartApplication}
              className="w-full py-3.5 rounded-xl bg-[#00A8FF] hover:bg-[#0092dd] text-slate-950 font-bold text-sm transition-all shadow-lg shadow-[#00A8FF]/20 flex items-center justify-center gap-2"
            >
              <span>Begin 15-Question Questionnaire</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: QUESTIONNAIRE (1 AT A TIME WITH LIVE PROGRESS) */}
        {step === 'QUESTIONNAIRE' && (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Progress Bar & Indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Question Progress</span>
                <span className="text-[#00A8FF] font-bold">
                  {currentIndex + 1} of 15 ({Math.round(((currentIndex + 1) / 15) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-[#00A8FF] h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[11px] font-bold text-[#00A8FF] uppercase tracking-wider block mb-1">
                Question #{currentIndex + 1}
              </span>
              <p className="text-base font-semibold text-white leading-relaxed">
                {questions[currentIndex]}
              </p>
            </div>

            {/* Answer Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Answer
              </label>
              <textarea
                rows={5}
                value={answers[currentIndex] || ''}
                onChange={e => handleAnswerChange(e.target.value)}
                placeholder="Type your response in complete sentences. Provide specific scenarios and clear explanations..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-[#00A8FF] text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span>Avoid shorthand and abbreviations</span>
                <span>{(answers[currentIndex] || '').length} characters</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentIndex === 0
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {currentIndex < 14 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-[#00A8FF] hover:bg-[#0092dd] text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#00A8FF]/20"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION SCREEN */}
        {step === 'CONFIRMATION' && confirmationData && (
          <div className="rounded-2xl bg-slate-900 border border-emerald-500/40 p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Application Submitted!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your application for <strong className="text-white">{confirmationData.department}</strong> has been logged to the database and queued for High Command review.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Reference ID:</span>
                <span className="font-mono font-bold text-[#00A8FF]">{confirmationData.referenceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Applicant:</span>
                <span className="text-slate-200">{user?.username} ({robloxUsername})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Status:</span>
                <span className="text-amber-400 font-semibold">PENDING REVIEW</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Submission Date:</span>
                <span className="text-slate-200">{new Date(confirmationData.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <a
                href="/my-profile"
                className="px-6 py-2.5 rounded-xl bg-[#00A8FF] hover:bg-[#0092dd] text-slate-950 font-bold text-xs"
              >
                Track in Your Stats
              </a>
              <a
                href="/"
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
              >
                Return to Home
              </a>
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
