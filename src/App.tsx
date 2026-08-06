import { useEffect, useState } from "react";
import type { Profile } from "./types";
import { applyDisplayPrefs, loadProfile, saveProfile } from "./engine/store";
import { checkAchievements } from "./engine/achievements";
import Session from "./screens/Session";
import SpeedRound from "./screens/SpeedRound";
import Stats from "./screens/Stats";
import Onboarding from "./screens/Onboarding";
import Learn from "./screens/Learn";
import You from "./screens/You";
import Library from "./screens/Library";
import CaseEncounter from "./screens/case/CaseEncounter";
import { getCase } from "./cases";
import { loadEncounter } from "./engine/case/encounter";
import ConditionsList from "./screens/conditions/ConditionsList";
import ConditionLesson from "./screens/conditions/ConditionLesson";
import { getCondition } from "./conditions";
import Tour, { LEARN_TOUR } from "./components/Tour";
import SpecialtyHub from "./screens/specialty/SpecialtyHub";
import BodyExplorer from "./screens/BodyExplorer";
import { getSpecialty } from "./specialties";

type Screen =
  | { name: "learn" }
  | { name: "session"; size?: number }
  | { name: "speed" }
  | { name: "stats" }
  | { name: "you" }
  | { name: "library" }
  | { name: "encounter"; caseId: string; resume?: boolean }
  | { name: "conditions" }
  | { name: "condition"; conditionId: string }
  | { name: "specialty"; specialtyId: string }
  | { name: "body-explorer" };

const NAV: { screen: Screen["name"]; icon: string; label: string }[] = [
  { screen: "learn", icon: "🗺️", label: "Learn" },
  { screen: "speed", icon: "⚡", label: "Speed" },
  { screen: "stats", icon: "🏆", label: "Awards" },
  { screen: "you", icon: "👤", label: "Profile" },
];

export default function App() {
  const [profile, setProfileState] = useState<Profile>(() => loadProfile());
  const [screen, setScreen] = useState<Screen>({ name: "learn" });
  // Speed only goes full-screen once the timer is running — its intro and
  // results screens keep the tab bar, or tapping "Speed" strands the user.
  const [speedRunning, setSpeedRunning] = useState(false);

  // Accepts a plain Profile, or a React-style updater when a handler can't
  // safely assume it's building on the latest state — e.g. ConditionLesson's
  // knowledge-check completion fires onProgress and onReviewSeeds back to
  // back in the same tick, and each closes over the same stale `profile`.
  // Without the functional form, the second call's `...profile` spread would
  // silently discard the first call's update.
  const setProfile = (update: Profile | ((prev: Profile) => Profile)) => {
    setProfileState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      saveProfile(next);
      return next;
    });
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
    screen.name === "encounter" ||
    screen.name === "condition" ||
    (screen.name === "speed" && speedRunning);

  let content;
  switch (screen.name) {
    case "session":
      content = (
        <Session
          profile={profile}
          setProfile={setProfile}
          size={screen.size}
          onExit={() => setScreen({ name: "learn" })}
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
            setScreen({ name: "learn" });
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
          onExit={() => setScreen({ name: "learn" })}
        />
      ) : (
        <div className="app">
          <div className="card">
            <h2>Case unavailable</h2>
            <p className="sub" style={{ marginTop: 6 }}>
              That case could not be loaded. It may have been removed from this build.
            </p>
            <button className="big-btn" style={{ marginTop: 14 }} onClick={() => setScreen({ name: "learn" })}>
              Back to Learn
            </button>
          </div>
        </div>
      );
      break;
    }
    case "conditions":
      content = (
        <ConditionsList
          progress={profile.conditionProgress}
          onOpen={(conditionId) => setScreen({ name: "condition", conditionId })}
          onBack={() => setScreen({ name: "learn" })}
        />
      );
      break;
    case "condition": {
      const cond = getCondition(screen.conditionId);
      content = cond ? (
        <ConditionLesson
          condition={cond}
          progress={profile.conditionProgress[cond.id] ?? null}
          onProgress={(lp) =>
            setProfile({
              ...profile,
              conditionProgress: { ...profile.conditionProgress, [cond.id]: lp },
            })
          }
          onReviewSeeds={(items) => {
            if (!items.length) return;
            setProfile((prev) => ({
              ...prev,
              reviewItems: {
                ...prev.reviewItems,
                ...Object.fromEntries(items.map((item) => [item.id, item])),
              },
            }));
          }}
          onExit={() => setScreen({ name: "conditions" })}
        />
      ) : (
        <div className="app">
          <div className="card">
            <h2>Lesson unavailable</h2>
            <button className="big-btn" style={{ marginTop: 14 }} onClick={() => setScreen({ name: "conditions" })}>
              Back
            </button>
          </div>
        </div>
      );
      break;
    }
    case "specialty": {
      const specialty = getSpecialty(screen.specialtyId);
      content = specialty ? (
        <SpecialtyHub
          specialty={specialty}
          profile={profile}
          setProfile={setProfile}
          onStartSession={() => setScreen({ name: "session" })}
          onStartEncounter={(caseId, resume) => setScreen({ name: "encounter", caseId, resume })}
          onOpenCondition={(conditionId) => setScreen({ name: "condition", conditionId })}
          onBack={() => setScreen({ name: "learn" })}
        />
      ) : (
        <div className="app">
          <div className="card">
            <h2>Specialty unavailable</h2>
            <button className="big-btn" style={{ marginTop: 14 }} onClick={() => setScreen({ name: "learn" })}>
              Back
            </button>
          </div>
        </div>
      );
      break;
    }
    case "body-explorer":
      content = (
        <BodyExplorer
          onOpenSpecialty={(specialtyId) => setScreen({ name: "specialty", specialtyId })}
          onStartEncounter={(caseId, resume) => setScreen({ name: "encounter", caseId, resume })}
          onOpenCondition={(conditionId) => setScreen({ name: "condition", conditionId })}
          onBack={() => setScreen({ name: "learn" })}
        />
      );
      break;
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
            setScreen({ name: "learn" });
          }}
        />
      );
      break;
    default:
      content = (
        <Learn
          profile={profile}
          setProfile={setProfile}
          onStartSession={(size) => setScreen({ name: "session", size })}
          onStartEncounter={(caseId, resume) => setScreen({ name: "encounter", caseId, resume })}
          onOpenCondition={(conditionId) => setScreen({ name: "condition", conditionId })}
          onOpenConditions={() => setScreen({ name: "conditions" })}
          onOpenLibrary={() => setScreen({ name: "library" })}
          onOpenSpecialty={(specialtyId) => setScreen({ name: "specialty", specialtyId })}
          onOpenBodyExplorer={() => setScreen({ name: "body-explorer" })}
        />
      );
  }

  // The tour spotlights real elements, so it can only run on Learn — the
  // screen those elements actually live on — and never on top of onboarding.
  const showTour = !profile.seenTour && screen.name === "learn";

  return (
    <>
      {content}
      {showTour && (
        <Tour steps={LEARN_TOUR} onDone={() => setProfile({ ...profile, seenTour: true })} />
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
