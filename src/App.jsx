import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import { ProfileProvider } from "@/lib/ProfileContext";
import ScrollToTop from "@/components/ScrollToTop";
import AppLayout from "@/components/AppLayout";
import RequireAuth, { RequireBaseline } from "@/components/RequireAuth";
import PageNotFound from "@/lib/PageNotFound";

import Login from "@/pages/Login";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import ConditionOfTheDay from "@/pages/ConditionOfTheDay";
import CasePlay from "@/pages/CasePlay";
import SpeedRound from "@/pages/SpeedRound";
import Recall from "@/pages/Recall";
import DailyGame from "@/pages/DailyGame";
import Groups from "@/pages/Groups";
import SubmitCase from "@/pages/SubmitCase";
import Explore from "@/pages/Explore";
import ConditionInfo from "@/pages/ConditionInfo";
import ModuleDetail from "@/pages/ModuleDetail";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />

            <Route element={<RequireAuth />}>
              <Route element={<RequireBaseline />}>
                <Route path="/onboarding" element={<Onboarding />} />

                <Route element={<AppLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/condition-of-the-day" element={<ConditionOfTheDay />} />
                  <Route path="/speed" element={<SpeedRound />} />
                  <Route path="/recall" element={<Recall />} />
                  <Route path="/daily-game" element={<DailyGame />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/submit-case" element={<SubmitCase />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/condition/:caseId" element={<ConditionInfo />} />
                  <Route path="/module/:id" element={<ModuleDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="/case/:caseId" element={<CasePlay />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}
