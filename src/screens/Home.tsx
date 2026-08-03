import type { Complaint, Profile, Topic } from "../types";
import { MODULE_OF_TOPIC } from "../types";
import { cases } from "../content/cases";
import { drills } from "../content";
import { buildSession, dueCount, masteryByTopic, todayISO } from "../engine/srs";
import { effectiveStreak, levelFor } from "../engine/store";

// ── Level ring (SVG progress circle) ─────────────────────────────────────

function LevelRing({ level, into, needed }: { level: number; into: number; needed: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const frac = Math.min(into / needed, 1);
  return (
    <div className="level-ring">
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${circ * frac} ${circ}`}
          transform="rotate(-90 38 38)"
        />
      </svg>
      <div className="level-ring-label">
        <div className="lvl-n">{level}</div>
        <div className="lvl-t">LVL</div>
      </div>
    </div>
  );
}

// ── Week strip ───────────────────────────────────────────────────────────

function WeekStrip({ profile }: { profile: Profile }) {
  const days: { iso: string; letter: string; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({
      iso,
      letter: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()],
      isToday: i === 0,
    });
  }
  const active = new Set(profile.activityLog);
  return (
    <div className="week-strip">
      {days.map((d) => {
        const done = active.has(d.iso);
        return (
          <div className="day-col" key={d.iso}>
            <div className="day-letter">{d.letter}</div>
            <div className={`day-cell ${done ? "done" : ""} ${d.isToday ? "today" : ""}`}>
              {done ? "🔥" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────

export default function Home({
  profile,
  onStartSession,
  onStartCase,
}: {
  profile: Profile;
  onStartSession: () => void;
  onStartCase: (caseId: string) => void;
}) {
  const streak = effectiveStreak(profile);
  const lvl = levelFor(profile.xp);
  const due = dueCount(profile);
  const session = buildSession(profile);
  const doneToday = profile.lastActiveDate === todayISO();
  const mastery = masteryByTopic(profile);
  const modules = [...new Set(mastery.map((m) => MODULE_OF_TOPIC[m.topic]))] as Complaint[];
  const newCount = session.filter((d) => !profile.srs[d.id]).length;
  const reviewCount = session.length - newCount;

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Clini<span>cian</span>
        </div>
        <div className="stats">
          <div className="chip flame">🔥 {streak}</div>
          <div className="chip xp">⚡ {profile.xp} XP</div>
        </div>
      </div>

      <div className="card hero">
        <div className="hero-row">
          <div className="hero-main">
            <h1>{doneToday ? "Streak secured 🔥" : "Today's session"}</h1>
            <p>
              {session.length === 0
                ? "All drills seen — reviews appear as they fall due."
                : [
                    reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}` : null,
                    newCount > 0 ? `${newCount} new drill${newCount === 1 ? "" : "s"}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
            <p className="hero-xp">
              Path: {profile.currentPath} · {lvl.into}/{lvl.needed} XP to level {lvl.level + 1}
            </p>
          </div>
          <LevelRing level={lvl.level} into={lvl.into} needed={lvl.needed} />
        </div>
        {session.length > 0 && (
          <button className="big-btn" onClick={onStartSession}>
            {doneToday ? "Keep training" : "Start · ~7 min"}
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>This week</h2>
          <span className="sub">
            {streak > 0 ? `${streak}-day streak` : "Start a streak today"}
          </span>
        </div>
        <WeekStrip profile={profile} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🧠 Boss cases</h2>
          <span className="sub">{profile.caseResults.length}/{cases.length} solved</span>
        </div>
        <p className="sub" style={{ marginBottom: 14 }}>
          Full patient encounters — every question, exam pick, and ranking is scored.
        </p>
        {cases.map((c) => {
          const done = profile.caseResults.find((r) => r.caseId === c.id);
          return (
            <div className="card case-list-item" key={c.id} style={{ marginBottom: 10, padding: 14 }}>
              <div className="meta">
                <h3>
                  {c.title}{" "}
                  <span className={`diff-chip diff-${c.difficulty}`}>
                    {"●".repeat(c.difficulty)}
                    {"○".repeat(3 - c.difficulty)}
                  </span>
                </h3>
                <div className="sub">
                  {c.presentingComplaint} · {c.patient.age}
                  {c.patient.sex[0]} · {c.patient.occupation}
                </div>
                {done && (
                  <div className="case-scores">
                    <span className="mini-score">🧩 {done.scores.reasoning}%</span>
                    <span className="mini-score">🚩 {done.scores.redFlag}%</span>
                    <span className="mini-score">🔬 {done.scores.evidence}%</span>
                  </div>
                )}
              </div>
              <button className="mini-btn" onClick={() => onStartCase(c.id)}>
                {done ? "Replay" : "Start"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🗺️ Mastery map</h2>
          <span className="sub">{modules.length} modules</span>
        </div>
        {modules.map((mod) => (
          <div key={mod}>
            <div className="module-head">{mod}</div>
            {mastery
              .filter((m) => MODULE_OF_TOPIC[m.topic] === mod)
              .map((m) => (
                <div className="mastery-row" key={m.topic}>
                  <div className="mastery-label">
                    <span>{m.topic}</span>
                    <span className="sub">
                      {m.seen}/{m.total}
                    </span>
                  </div>
                  <div className="mastery-track">
                    <div
                      className={`mastery-fill ${m.pct >= 70 ? "strong" : m.pct >= 30 ? "mid" : ""}`}
                      style={{ width: `${Math.max(m.pct, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        ))}
        <p className="sub" style={{ marginTop: 10 }}>
          Bars grow as drills survive longer review intervals — mastery means remembering, not
          just answering once.
        </p>
      </div>

      <div className="footer-note">
        Clinician prototype · Shoulder pain module · Educational use only — not medical advice
      </div>
    </div>
  );
}
