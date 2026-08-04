import { useEffect, useState } from "react";
import type { Profile } from "./types";
import { applyDisplayPrefs, loadProfile, saveProfile } from "./engine/store";
import { checkAchievements } from "./engine/achievements";
import Home from "./screens/Home";
import Session from "./screens/Session";
import CasePlayer from "./screens/CasePlayer";
import SpeedRound from "./screens/SpeedRound";
import Stats from "./screens/Stats";
import Onboarding from "./screens/Onboarding";
import Learn from "./screens/Learn";
import You from "./screens/You";
import Library from "./screens/Library";
import CaseEncounter from "./screens/case/CaseEncounter";
import { getCase } from "./cases";
import { loadEncounter } from "./engine/case/encounter";
import Tour, { HOME_TOUR } from "./components/Tour";
import { cases } from "./content/cases";

type Screen =
  | { name: "home" }
  | { name: "learn" }
  | { name: "session"; size?: number }
  | { name: "case"; caseId: string }
  | { name: "speed" }
  | { name: "stats" }
  | { name: "you" }
  | { name: "library" }
  | { name: "encounter"; caseId: string; resume?: boolean };

const NAV: { screen: Screen["name"]; icon: string; label: string }[] = [
  { screen: "home", icon: "🏠", label: "Today" },
  { screen: "learn", icon: "🗺️", label: "Learn" },
  { screen: "speed", icon: "⚡", label: "Speed" },
  { screen: "stats", icon: "📊", label: "Stats" },
  { screen: "you", icon: "👤", label: "You" },
];

export default function App() {
  const [profile, setProfileState] = useState<Profile>(() => loadProfile());
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  // Speed only goes full-screen once the timer is running — its intro and
  // results screens keep the tab bar, or tapping "Speed" strands the user.
  const [speedRunning, setSpeedRunning] = useState(false);

  const setProfile = (p: Profile) => {
    saveProfile(p);
    setProfileState(p);
  };

  // Theme and text size live on the document root so they cover every screen.
  useEffect(() => {
    applyDisplayPrefs(profile);
  }, [profile.theme, profile.textSize]);

  // Grant any achievements earned by progress made before the achievement system existed
  useEffect(() => {
    const earned = checkAchievements(profile);
    if (earned.length) {
      setProfile({ ...profile, achievements: [...profile.achievements, ...earned.map((a) => a.id)] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile.onboarded) {
    return <Onboarding onDone={() => setProfile({ ...profile, onboarded: true })} />;
  }

  const inActivity =
    screen.name === "session" ||
    screen.name === "case" ||
    screen.name === "encounter" ||
    (screen.name === "speed" && speedRunning);

  let content;
  switch (screen.name) {
    case "session":
      content = (
        <Session
          profile={profile}
          setProfile={setProfile}
          size={screen.size}
          onExit={() => setScreen({ name: "home" })}
        />
      );
      break;
    case "case": {
      const c = cases.find((x) => x.id === (screen as { caseId: string }).caseId)!;
      content = (
        <CasePlayer clinicalCase={c} profile={profile} setProfile={setProfile} onExit={() => setScreen({ name: "home" })} />
      );
      break;
    }
    case "learn":
      content = (
        <Learn
          profile={profile}
          setProfile={setProfile}
          onStartSession={() => setScreen({ name: "session" })}
          onOpenLibrary={() => setScreen({ name: "library" })}
        />
      );
      break;
    case "speed":
      content = (
        <SpeedRound
          profile={profile}
          setProfile={setProfile}
          onRunningChange={setSpeedRunning}
          onExit={() => {
            setSpeedRunning(false);
            setScreen({ name: "home" });
          }}
        />
      );
      break;
    case "stats":
      content = <Stats profile={profile} />;
      break;
    case "encounter": {
      const encounterCase = getCase(screen.caseId);
      content = encounterCase ? (
        <CaseEncounter
          clinicalCase={encounterCase}
          profile={profile}
          setProfile={setProfile}
          resume={screen.resume ? loadEncounter() : null}
          onExit={() => setScreen({ name: "home" })}
        />
      ) : (
        <div className="app">
          <div className="card">
            <h2>Case unavailable</h2>
            <p className="sub" style={{ marginTop: 6 }}>
              That case could not be loaded. It may have been removed from this build.
            </p>
            <button className="big-btn" style={{ marginTop: 14 }} onClick={() => setScreen({ name: "home" })}>
              Back to home
            </button>
          </div>
        </div>
      );
      break;
    }
    case "library":
      content = (
        <Library
          profile={profile}
          setProfile={setProfile}
          onBack={() => setScreen({ name: "learn" })}
        />
      );
      break;
    case "you":
      content = (
        <You
          profile={profile}
          setProfile={setProfile}
          onOpenLibrary={() => setScreen({ name: "library" })}
          onResetDone={() => {
            setProfileState(loadProfile());
            setScreen({ name: "home" });
          }}
        />
      );
      break;
    default:
      content = (
        <Home
          profile={profile}
          onStartSession={(size) => setScreen({ name: "session", size })}
          onStartCase={(caseId) => setScreen({ name: "case", caseId })}
          onStartEncounter={(caseId, resume) => setScreen({ name: "encounter", caseId, resume })}
        />
      );
  }

  // The tour spotlights real elements, so it can only run on the home screen
  // with the tab bar present — and never on top of the onboarding flow.
  const showTour = !profile.seenTour && screen.name === "home";

  return (
    <>
      {content}
      {showTour && (
        <Tour steps={HOME_TOUR} onDone={() => setProfile({ ...profile, seenTour: true })} />
      )}
      {!inActivity && (
        <nav className="tabbar">
          {NAV.map((n) => (
            <button
              key={n.screen}
              data-tour={n.screen}
              className={`tab ${screen.name === n.screen ? "on" : ""}`}
              onClick={() => setScreen({ name: n.screen } as Screen)}
            >
              <span className="tab-icon">{n.icon}</span>
              <span className="tab-label">{n.label}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
