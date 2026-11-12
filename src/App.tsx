import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public & Member Pages
import { HomePage } from './pages/HomePage';
import { ApplyPage } from './pages/ApplyPage';
import { AppealPage } from './pages/AppealPage';
import { BanAppealPage } from './pages/BanAppealPage';
import { MyProfilePage } from './pages/MyProfilePage';
import TranscriptsPage from './pages/TranscriptsPage';
import TranscriptDetailPage from './pages/TranscriptDetailPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// Staff Command Pages
import StaffLayout from './pages/staff/StaffLayout';
import StaffOverviewPage from './pages/staff/StaffOverviewPage';
import MyRecordPage from './pages/staff/MyRecordPage';
import GuidesPage from './pages/staff/GuidesPage';
import PunishmentGuidePage from './pages/staff/PunishmentGuidePage';
import InstructorGuidePage from './pages/staff/InstructorGuidePage';
import PunishmentsPage from './pages/staff/PunishmentsPage';
import PlayerLookupPage from './pages/staff/PlayerLookupPage';
import ActiveShiftsPage from './pages/staff/ActiveShiftsPage';
import LeaderboardPage from './pages/staff/LeaderboardPage';
import ReviewsPage from './pages/staff/ReviewsPage';
import LiveMapPage from './pages/staff/LiveMapPage';
import ErlcLogsPage from './pages/staff/ErlcLogsPage';
import CommandsPage from './pages/staff/CommandsPage';
import GetCommandsPage from './pages/staff/GetCommandsPage';
import GroupPage from './pages/staff/GroupPage';
import WatchdogPage from './pages/staff/WatchdogPage';
import SettingsPage from './pages/staff/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-[#00A8FF]/20 selection:text-[#00A8FF]">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/apply" element={<ApplyPage />} />
              <Route path="/appeal" element={<AppealPage />} />
              <Route path="/ban-appeal" element={<BanAppealPage />} />
              <Route path="/my-profile" element={<MyProfilePage />} />
              <Route path="/profile" element={<Navigate to="/my-profile" replace />} />
              <Route path="/transcripts" element={<TranscriptsPage />} />
              <Route path="/transcripts/:id" element={<TranscriptDetailPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Staff Command Panel Nested Routes */}
              <Route path="/staff" element={<StaffLayout />}>
                <Route index element={<StaffOverviewPage />} />
                <Route path="overview" element={<StaffOverviewPage />} />
                <Route path="record" element={<MyRecordPage />} />
                <Route path="guides" element={<GuidesPage />} />
                <Route path="punishment-guide" element={<PunishmentGuidePage />} />
                <Route path="instructor-guide" element={<InstructorGuidePage />} />
                <Route path="punishments" element={<PunishmentsPage />} />
                <Route path="lookup" element={<PlayerLookupPage />} />
                <Route path="shifts" element={<ActiveShiftsPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="map" element={<LiveMapPage />} />
                <Route path="logs" element={<ErlcLogsPage />} />
                <Route path="commands" element={<CommandsPage />} />
                <Route path="get-commands" element={<GetCommandsPage />} />
                <Route path="group" element={<GroupPage />} />
                <Route path="watchdog" element={<WatchdogPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
