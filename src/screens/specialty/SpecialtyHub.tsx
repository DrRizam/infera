import type { Profile } from "../../types";
import { MODULES } from "../../content";
import {
  casesFor,
  conditionsFor,
  dailyHardCase,
  specialtyStatus,
  type Specialty,
} from "../../specialties";
import { sampleLeaderboard } from "../../engine/leaderboard";
import { loadEncounter } from "../../engine/case/encounter";

/**
 * One specialty's home: practice scoped to its tracks, today's hardest case,
 * a sample leaderboard, and its condition lessons. Specialties without real
 * content yet show one honest card instead — same "in development" copy the
 * rest of the app already uses, never invented pathology.
 */
export default function SpecialtyHub({
  specialty,
  profile,
  setProfile,
  onStartSession,
  onStartEncounter,
  onOpenCondition,
  onBack,
}: {
  specialty: Specialty;
  profile: Profile;
  setProfile: (p: Profile) => void;
  onStartSession: () => void;
  onStartEncounter: (caseId: string, resume?: boolean) => void;
  onOpenCondition: (conditionId: string) => void;
  onBack: () => void;
}) {
  const status = specialtyStatus(specialty);
  const readyModules = specialty.bodyRegionModules.filter(
    (id) => MODULES.find((m) => m.id === id)?.status === "ready"
  );

  const startAssessment = () => {
    if (readyModules.length && !readyModules.includes(profile.currentPath)) {
      setProfile({ ...profile, currentPath: readyModules[0] });
    }
    onStartSession();
  };

  const hardCase = status === "ready" ? dailyHardCase(specialty) : undefined;
  const pendingEncounter = loadEncounter();
  const resumingHardCase = hardCase && pendingEncounter?.caseId === hardCase.id;

  const conditions = status === "ready" ? conditionsFor(specialty) : [];
  const leaderboard = sampleLeaderboard(specialty.id);

  return (
    <div className="app">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="card">
        <h2>
          {specialty.icon} {specialty.name}
        </h2>
        <p className="sub" style={{ marginTop: 6 }}>
          {specialty.blurb}
        </p>
      </div>

      {status === "development" ? (
        <div className="card">
          <span className="path-chip dev">In development</span>
          <p className="sub" style={{ marginTop: 10 }}>
            Practice, cases, and a leaderboard will appear here as content is built and
            clinically reviewed.
          </p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-head">
              <h2>📝 Assessment</h2>
            </div>
            <p className="sub" style={{ marginBottom: 12 }}>
              Practice pulls new drills from {readyModules.join(", ")} — reviews that have fallen
              due always come first, from everywhere.
            </p>
            <button className="big-btn teal" onClick={startAssessment}>
              Start assessment
            </button>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>🔥 Daily hard case</h2>
            </div>
            {hardCase ? (
              <>
                <p className="sub" style={{ marginBottom: 12 }}>
                  {hardCase.title} · {hardCase.estimatedMinutes} min
                </p>
                <button
                  className="big-btn"
                  onClick={() => onStartEncounter(hardCase.id, !!resumingHardCase)}
                >
                  {resumingHardCase ? "Resume" : "Start case"}
                </button>
              </>
            ) : (
              <p className="sub">No case at this difficulty yet — check back as content grows.</p>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h2>🏆 Leaderboard</h2>
            </div>
            <p className="sub" style={{ marginBottom: 12 }}>
              Sample leaderboard — real rankings arrive with accounts. Not live data.
            </p>
            <ol className="leaderboard-list">
              {leaderboard.map((e, i) => (
                <li key={e.name}>
                  <span className="lb-rank">{i + 1}</span>
                  <span className="lb-name">{e.name}</span>
                  <span className="lb-score">{e.score}</span>
                </li>
              ))}
            </ol>
          </div>

          {conditions.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h2>📖 Conditions</h2>
              </div>
              {conditions.map((c) => (
                <button key={c.id} className="condition-row" onClick={() => onOpenCondition(c.id)}>
                  <span className="condition-meta">
                    <b>{c.name}</b>
                    <span className="sub">{c.estimatedMinutes} min</span>
                  </span>
                  <span className="condition-status">›</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
