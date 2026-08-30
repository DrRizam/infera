import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext";
import { ProfileProvider } from "@/lib/ProfileContext";
import { useAndroidBackButton } from "@/lib/useAndroidBackButton";
import { useAdMobInit } from "@/lib/useAdMobInit";
import ScrollToTop from "@/components/ScrollToTop";
import AppLayout from "@/components/AppLayout";
import RequireAuth, { RequireBaseline } from "@/components/RequireAuth";
import PageNotFound from "@/lib/PageNotFound";

// Login is the first thing a logged-out visitor sees — keep it eager. Every
// other page is a separate chunk, so the login screen no longer ships the
// case engine, the 32-case bank, the ~430 KB reference database, the anatomy
// data, or the admin screens.
import Login from "@/pages/Login";

const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Home = lazy(() => import("@/pages/Home"));
const ConditionOfTheDay = lazy(() => import("@/pages/ConditionOfTheDay"));
const CasePlay = lazy(() => import("@/pages/CasePlay"));
const SpeedRound = lazy(() => import("@/pages/SpeedRound"));
const Recall = lazy(() => import("@/pages/Recall"));
const AnatomyQuiz = lazy(() => import("@/pages/AnatomyQuiz"));
const DailyGame = lazy(() => import("@/pages/DailyGame"));
const Groups = lazy(() => import("@/pages/Groups"));
const SubmitCase = lazy(() => import("@/pages/SubmitCase"));
const Explore = lazy(() => import("@/pages/Explore"));
const ConditionInfo = lazy(() => import("@/pages/ConditionInfo"));
const ConditionReferenceInfo = lazy(() => import("@/pages/ConditionReferenceInfo"));
const ModuleDetail = lazy(() => import("@/pages/ModuleDetail"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const Settings = lazy(() => import("@/pages/Settings"));
const Premium = lazy(() => import("@/pages/Premium"));
const AdminFeedback = lazy(() => import("@/pages/AdminFeedback"));
const AdminDailyGameReview = lazy(() => import("@/pages/AdminDailyGameReview"));
const OsceCheckpoint = lazy(() => import("@/pages/OsceCheckpoint"));

function AndroidBackButton() {
  useAndroidBackButton();
  return null;
}

function RouteFallback() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
}

export default function App() {
  useAdMobInit();
  return (
    <AuthProvider>
      <ProfileProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AndroidBackButton />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* "/" is the static marketing page (served by the CF Worker / the
                  dev middleware) and normally never reaches the SPA. This keeps
                  a stray in-app hit on "/" pointed at the real dashboard. */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/login" element={<Login />} />
              {/* /terms, /privacy, /refunds are static HTML served by the CF
                  Worker (worker/index.js) — not SPA routes. */}

              <Route element={<RequireAuth />}>
                <Route element={<RequireBaseline />}>
                  <Route path="/onboarding" element={<Onboarding />} />

                  <Route element={<AppLayout />}>
                    <Route path="/home" element={<Home />} />
                    <Route path="/condition-of-the-day" element={<ConditionOfTheDay />} />
                    <Route path="/speed" element={<SpeedRound />} />
                    <Route path="/recall" element={<Recall />} />
                    <Route path="/anatomy" element={<AnatomyQuiz />} />
                    <Route path="/daily-game" element={<DailyGame />} />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="/submit-case" element={<SubmitCase />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/condition/:caseId" element={<ConditionInfo />} />
                    <Route path="/reference/:slug" element={<ConditionReferenceInfo />} />
                    <Route path="/module/:id" element={<ModuleDetail />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:userId" element={<PublicProfile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/premium" element={<Premium />} />
                    <Route path="/admin/feedback" element={<AdminFeedback />} />
                    <Route path="/admin/daily-game" element={<AdminDailyGameReview />} />
                    <Route path="/osce" element={<OsceCheckpoint />} />
                  </Route>

                  <Route path="/case/:caseId" element={<CasePlay />} />
                </Route>
              </Route>

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}
