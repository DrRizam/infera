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
import Modules from "@/pages/Modules";
import ModuleDetail from "@/pages/ModuleDetail";
import BodyMap from "@/pages/BodyMap";
import Achievements from "@/pages/Achievements";
import Profile from "@/pages/Profile";

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
                  <Route path="/modules" element={<Modules />} />
                  <Route path="/module/:id" element={<ModuleDetail />} />
                  <Route path="/body-map" element={<BodyMap />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/profile" element={<Profile />} />
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
