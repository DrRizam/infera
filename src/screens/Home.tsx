import type { Profile } from "../types";
import { cases } from "../content/cases";
import { buildSession, dueCount, todayISO } from "../engine/srs";
import { DAYS_PER_SHIELD, MAX_SHIELDS, effectiveStreak, levelFor, loadActiveSession } from "../engine/store";
import { SHOW_BOSS_CASES, estimateMinutes } from "../config";
import { cases as encounterCases } from "../cases";
import { loadEncounter } from "../engine/case/encounter";

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
          stroke="var(--accent)"
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
  const shielded = new Set(profile.shieldedDates);
  return (
    <div className="week-strip">
      {days.map((d) => {
        const done = active.has(d.iso);
        const rest = !done && shielded.has(d.iso);
        return (
          <div className="day-col" key={d.iso}>
            <div className="day-letter">{d.letter}</div>
            <div
              className={`day-cell ${done ? "done" : ""} ${rest ? "rested" : ""} ${d.isToday ? "today" : ""}`}
              title={rest ? "Rest day — a shield covered this one" : undefined}
            >
              {done ? "🔥" : rest ? "🛡️" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────
// One screen, one decision: start today's session. Progress detail lives on
// Learn — a clinician opening this at the end of a shift should not have to
// scroll past three cards to find the button.

export default function Home({
  profile,
  onStartSession,
  onStartCase,
  onStartEncounter,
}: {
  profile: Profile;
  onStartSession: (size?: number) => void;
  onStartCase: (caseId: string) => void;
  onStartEncounter: (caseId: string, resume?: boolean) => void;
}) {
  const streak = effectiveStreak(profile);
  const lvl = levelFor(profile.xp);
  const due = dueCount(profile);
  const session = buildSession(profile);
  const doneToday = profile.lastActiveDate === todayISO();
  const newCount = session.filter((d) => !profile.srs[d.id]).length;
  const reviewCount = session.length - newCount;
  const quickSize = Math.min(3, session.length);
  const inProgress = loadActiveSession();
  // An unfinished encounter always wins; otherwise rotate a case by day so the
  // "daily case" is stable within a day rather than changing on every render.
  const pendingEncounter = loadEncounter();
  const dailyCase =
    (pendingEncounter && encounterCases.find((x) => x.id === pendingEncounter.caseId)) ??
    (encounterCases.length
      ? encounterCases[Number(todayISO().replace(/-/g, "")) % encounterCases.length]
      : undefined);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Clini<span>cian</span>
        </div>
        <div className="stats">
          <div className="chip flame" data-tour="streak">
            🔥 {streak}
          </div>
          {profile.shields > 0 && (
            <div className="chip shield" title="Banked rest days — a missed day spends one of these instead of your streak">
              🛡️ {profile.shields}
            </div>
          )}
          <div className="chip xp">⚡ {profile.xp} XP</div>
        </div>
      </div>

      <div className="card hero">
        <div className="hero-row">
          <div className="hero-main">
            <h1>{doneToday ? "Streak secured 🔥" : "Today's session"}</h1>
            <p>
              {session.length === 0
                ? "Nothing due — you're ahead of the curve."
                : [
                    reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}` : null,
                    newCount > 0 ? `${newCount} new drill${newCount === 1 ? "" : "s"}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
            <p className="hero-xp">
              {profile.currentPath} · {lvl.into}/{lvl.needed} XP to level {lvl.level + 1}
            </p>
          </div>
          <LevelRing level={lvl.level} into={lvl.into} needed={lvl.needed} />
        </div>
        {session.length > 0 ? (
          <>
            <button className="big-btn" data-tour="start" onClick={() => onStartSession()}>
              {inProgress
                ? `Resume · ${inProgress.drillIds.length - inProgress.idx} left`
                : doneToday
                  ? "Keep training"
                  : `Start · ${session.length} drills · ~${estimateMinutes(session.length)} min`}
            </button>
            {!inProgress && session.length > quickSize && (
              <button className="hero-link" onClick={() => onStartSession(quickSize)}>
                Only have a minute? Do {quickSize} →
              </button>
            )}
          </>
        ) : (
          <p className="hero-xp" style={{ marginTop: 12 }}>
            {due === 0 && "Reviews reappear as they fall due — check back tomorrow."}
          </p>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Today</h2>
          <span className="sub">three ways to train</span>
        </div>

        {dailyCase && (
          <button
            className="mode-card primary"
            onClick={() => onStartEncounter(dailyCase.id, !!pendingEncounter)}
          >
            <span className="mode-icon" aria-hidden="true">
              🩺
            </span>
            <span>
              <h3>{pendingEncounter ? "Resume your case" : "Daily case"}</h3>
              <span className="sub">
                {pendingEncounter
                  ? `${dailyCase.presentingComplaint} — picked up where you left off`
                  : `${dailyCase.presentingComplaint} · a full patient encounter`}
              </span>
            </span>
            <span className="mode-meta sub">~{dailyCase.estimatedMinutes} min</span>
          </button>
        )}

        <button className="mode-card" onClick={() => onStartSession(quickSize || undefined)}>
          <span className="mode-icon" aria-hidden="true">
            ⚡
          </span>
          <span>
            <h3>Quick review</h3>
            <span className="sub">
              {due > 0 ? `${due} item${due === 1 ? "" : "s"} due` : "Nothing due — practise ahead"}
            </span>
          </span>
          <span className="mode-meta sub">2–5 min</span>
        </button>

        <button className="mode-card" disabled aria-disabled="true">
          <span className="mode-icon" aria-hidden="true">
            🧠
          </span>
          <span>
            <h3>Challenge case</h3>
            <span className="sub">Ambiguous presentations — coming soon</span>
          </span>
          <span className="mode-meta sub">Soon</span>
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>This week</h2>
          <span className="sub">{streak > 0 ? `${streak}-day streak` : "Start a streak today"}</span>
        </div>
        <WeekStrip profile={profile} />
        <div className="shield-note">
          <span className="pips">
            {Array.from({ length: DAYS_PER_SHIELD }, (_, i) => (
              <span key={i} className={`pip ${i < profile.shieldProgress ? "on" : ""}`} />
            ))}
          </span>
          <span>
            {profile.shields >= MAX_SHIELDS
              ? `🛡️ ${profile.shields} rest days banked (full) — miss a day and one covers you`
              : `${DAYS_PER_SHIELD - profile.shieldProgress} more practice day${
                  DAYS_PER_SHIELD - profile.shieldProgress === 1 ? "" : "s"
                } earns a rest-day shield`}
          </span>
        </div>
      </div>

      {SHOW_BOSS_CASES && (
        <div className="card">
          <div className="card-head">
            <h2>🧠 Boss cases</h2>
            <span className="sub">
              {profile.caseResults.length}/{cases.length} solved
            </span>
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
      )}

      <div className="footer-note">
        Clinician · A study aid, not a diagnostic tool — not medical advice
      </div>
    </div>
  );
}
