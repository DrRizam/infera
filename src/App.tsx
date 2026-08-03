import { useEffect, useState } from "react";
import type { Profile } from "./types";
import { loadProfile, saveProfile } from "./engine/store";
import { checkAchievements } from "./engine/achievements";
import Home from "./screens/Home";
import Session from "./screens/Session";
import CasePlayer from "./screens/CasePlayer";
import SpeedRound from "./screens/SpeedRound";
import Stats from "./screens/Stats";
import Onboarding from "./screens/Onboarding";
import Learn from "./screens/Learn";
import { cases } from "./content/cases";

type Screen =
  | { name: "home" }
  | { name: "learn" }
  | { name: "session" }
  | { name: "case"; caseId: string }
  | { name: "speed" }
  | { name: "stats" };

const NAV: { screen: Screen["name"]; icon: string; label: string }[] = [
  { screen: "home", icon: "🏠", label: "Today" },
  { screen: "learn", icon: "🗺️", label: "Learn" },
  { screen: "speed", icon: "⚡", label: "Speed" },
  { screen: "stats", icon: "📊", label: "Stats" },
];

export default function App() {
  const [profile, setProfileState] = useState<Profile>(() => loadProfile());
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  const setProfile = (p: Profile) => {
    saveProfile(p);
    setProfileState(p);
  };

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

  const inActivity = screen.name === "session" || screen.name === "case" || screen.name === "speed";

  let content;
  switch (screen.name) {
    case "session":
      content = (
        <Session profile={profile} setProfile={setProfile} onExit={() => setScreen({ name: "home" })} />
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
        />
      );
      break;
    case "speed":
      content = (
        <SpeedRound profile={profile} setProfile={setProfile} onExit={() => setScreen({ name: "home" })} />
      );
      break;
    case "stats":
      content = (
        <Stats
          profile={profile}
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
          onStartSession={() => setScreen({ name: "session" })}
          onStartCase={(caseId) => setScreen({ name: "case", caseId })}
        />
      );
  }

  return (
    <>
      {content}
      {!inActivity && (
        <nav className="tabbar">
          {NAV.map((n) => (
            <button
              key={n.screen}
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
