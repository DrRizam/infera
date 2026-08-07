import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProfileProvider } from "@/lib/ProfileContext";
import ScrollToTop from "@/components/ScrollToTop";
import AppLayout from "@/components/AppLayout";
import PageNotFound from "@/lib/PageNotFound";

import Home from "@/pages/Home";
import CasePlay from "@/pages/CasePlay";
import SpeedRound from "@/pages/SpeedRound";
import Modules from "@/pages/Modules";
import ModuleDetail from "@/pages/ModuleDetail";
import BodyMap from "@/pages/BodyMap";
import Achievements from "@/pages/Achievements";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/speed" element={<SpeedRound />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/module/:id" element={<ModuleDetail />} />
            <Route path="/body-map" element={<BodyMap />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/case/:caseId" element={<CasePlay />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  );
}
