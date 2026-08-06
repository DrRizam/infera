import type { Complaint, Profile, Topic } from "../types";
import { MODULES, drills, isReadyModule, moduleOfTopic } from "../content";
import {
  COMPETENCY_CLASS,
  buildSession,
  competencyOf,
  dueCount,
  isReviewItem,
  liveRecords,
  masteryByTopic,
  moduleMastery,
  overallMastery,
  safetyCompetency,
  todayISO,
} from "../engine/srs";
import { effectiveStreak, levelFor, loadActiveSession } from "../engine/store";
import { loadEncounter } from "../engine/case/encounter";
import { buildLearningPath, currentPathNode, type PathNode } from "../engine/path";
import { SPECIALTIES, specialtyStatus } from "../specialties";
import { estimateMinutes } from "../config";

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

// ── Foundation ring (mastery path header) ─────────────────────────────────

function FoundationRing({ pct }: { pct: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <div className="foundation-ring">
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circ * (pct / 100)} ${circ}`}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div className="foundation-label">
        <div className="f-pct">{pct}%</div>
        <div className="f-t">MSK foundation</div>
      </div>
    </div>
  );
}

// ── Reasoning path (cases + conditions, unified) ──────────────────────────

function PathTree({ nodes, onOpen }: { nodes: PathNode[]; onOpen: (n: PathNode) => void }) {
  return (
    <div className="card" data-tour="path">
      <div className="card-head">
        <h2>🧭 Reasoning path</h2>
        <span className="sub">cases &amp; conditions</span>
      </div>
      <p className="sub" style={{ marginBottom: 14 }}>
        Each case starts with a patient — not a diagnosis. Reason your way to it.
      </p>
      <div className="path-tree">
        {nodes.map((n) => (
          <button
            key={n.id}
            className={`path-node ${n.status}`}
            disabled={n.status === "locked"}
            onClick={() => onOpen(n)}
          >
            <span className="path-node-dot" aria-hidden="true">
              {n.status === "completed" ? "✓" : n.status === "locked" ? "🔒" : n.kind === "condition" ? "📖" : "🩺"}
            </span>
            <span className="path-node-label">{n.label}</span>
            <span className="path-node-sub">{n.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function nextSevenDays(): { iso: string; label: string }[] {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label: i === 0 ? "Today" : i === 1 ? "Tmrw" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
    });
  }
  return out;
}

// ── Learn ────────────────────────────────────────────────────────────────
// The single home for "what's next": due drills/reviews, the case/condition
// reasoning path, and progress detail. Formerly split across Home and Learn —
// merged so there is one screen, not two places to check.

export default function Learn({
  profile,
  setProfile,
  onStartSession,
  onStartEncounter,
  onOpenCondition,
  onOpenConditions,
  onOpenLibrary,
  onOpenSpecialty,
  onOpenBodyExplorer,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onStartSession: (size?: number) => void;
  onStartEncounter: (caseId: string, resume?: boolean) => void;
  onOpenCondition: (conditionId: string) => void;
  onOpenConditions: () => void;
  onOpenLibrary: () => void;
  onOpenSpecialty: (specialtyId: string) => void;
  onOpenBodyExplorer: () => void;
}) {
  const streak = effectiveStreak(profile);
  const lvl = levelFor(profile.xp);
  const foundation = overallMastery(profile);
  const mastery = masteryByTopic(profile);
  const safety = safetyCompetency(profile);
  const setPath = (id: Complaint) => setProfile({ ...profile, currentPath: id });

  // ── Reasoning path ──
  const pathNodes = buildLearningPath(profile);
  const current = currentPathNode(profile);
  const pendingEncounter = loadEncounter();
  const resumingCurrent = current?.kind === "case" && pendingEncounter?.caseId === current.id;

  const openNode = (n: PathNode) => {
    if (n.kind === "case") onStartEncounter(n.id, pendingEncounter?.caseId === n.id);
    else if (n.kind === "condition") onOpenCondition(n.id);
  };

  // ── Daily practice (due drills + reviews) ──
  const due = dueCount(profile);
  const session = buildSession(profile);
  const doneToday = profile.lastActiveDate === todayISO();
  const newCount = session.filter((d) => !isReviewItem(d) && !profile.srs[d.id]).length;
  const reviewCount = session.length - newCount;
  const quickSize = Math.min(3, session.length);
  const inProgress = loadActiveSession();

  // ── Review forecast + accuracy by topic (moved here from Stats/Awards) ──
  const forecastDays = nextSevenDays();
  const today = todayISO();
  const live = liveRecords(profile);
  const forecastCounts = forecastDays.map(({ iso }, i) =>
    live.filter((r) => (i === 0 ? r.dueDate <= today : r.dueDate === iso)).length
  );
  const maxForecast = Math.max(...forecastCounts, 1);
  const topicAccuracy = (Object.entries(profile.topicAgg) as [Topic, { n: number; sum: number }][]).sort(
    (a, b) => a[1].sum / a[1].n - b[1].sum / b[1].n
  );

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
            {current ? (
              <>
                <span className="tag">{resumingCurrent ? "Resume" : "Continue learning"}</span>
                <h1 style={{ fontSize: 21 }}>{current.detail}</h1>
                <p className="hero-xp">{current.sub}</p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 21 }}>You're caught up</h1>
                <p className="hero-xp">
                  Every case and condition lesson available today is complete. More is coming.
                </p>
              </>
            )}
          </div>
          <LevelRing level={lvl.level} into={lvl.into} needed={lvl.needed} />
        </div>
        {current && (
          <button className="big-btn" onClick={() => openNode(current)}>
            {resumingCurrent ? "Resume" : current.kind === "case" ? "Start case" : "Start lesson"}
          </button>
        )}
      </div>

      <PathTree nodes={pathNodes} onOpen={openNode} />

      <div className="card">
        <div className="card-head">
          <h2>🏥 Specialties</h2>
        </div>
        <p className="sub" style={{ marginBottom: 14 }}>
          Each has its own practice, a daily hard case, and a leaderboard. Musculoskeletal &amp;
          Orthopedic is furthest along — the rest are in development.
        </p>
        <div className="specialty-grid">
          {SPECIALTIES.map((s) => {
            const status = specialtyStatus(s);
            const ready = status === "ready";
            return (
              <button
                key={s.id}
                className={`specialty-tile ${ready ? "" : "dim"}`}
                disabled={!ready}
                onClick={() => onOpenSpecialty(s.id)}
              >
                <span className="specialty-icon" aria-hidden="true">
                  {s.icon}
                </span>
                <span className="specialty-name">{s.name}</span>
                <span className={`path-chip ${ready ? "" : "dev"}`}>
                  {ready ? "Ready" : "In development"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{doneToday ? "Streak secured 🔥" : "Daily practice"}</h2>
        </div>
        <p className="sub">
          {session.length === 0
            ? "Nothing due — you're ahead of the curve."
            : [
                reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}` : null,
                newCount > 0 ? `${newCount} new drill${newCount === 1 ? "" : "s"}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
        </p>
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
          <h2>This week</h2>
          <span className="sub">{streak > 0 ? `${streak}-day streak` : "Start a streak today"}</span>
        </div>
        <WeekStrip profile={profile} />
      </div>

      <div className={`card safety-card ${COMPETENCY_CLASS[safety.competency]}`}>
        <div className="card-head">
          <h2>🚩 Red flag screening</h2>
          <span className={`comp-chip ${COMPETENCY_CLASS[safety.competency]}`}>
            {safety.competency}
          </span>
        </div>
        <p className="sub">
          {safety.seen === 0
            ? "You haven't met the screening drills yet — these are the ones that matter most."
            : safety.pct >= 85
              ? `Holding strong across ${safety.seen} of ${safety.total} screening drills. This is the competency worth never losing.`
              : `${safety.seen} of ${safety.total} screening drills met. Missing a red flag costs more than missing a special test — these stay in rotation.`}
        </p>
        <div className="mastery-track" style={{ marginTop: 10 }}>
          <div
            className={`mastery-fill ${safety.pct >= 70 ? "strong" : safety.pct >= 30 ? "mid" : ""}`}
            style={{ width: `${Math.max(safety.pct, 2)}%` }}
          />
        </div>
      </div>

      <div className="card">
        <div className="hero-row">
          <div className="hero-main">
            <span className="tag">Mastery path</span>
            <h2 style={{ fontSize: 21, marginBottom: 4 }}>Learn by presentation — not by label.</h2>
            <p className="sub">
              Pick the complaint you want to train. New drills come from your current path;
              reviews from everything you've already met keep coming regardless — that's how it
              sticks.
            </p>
          </div>
          <FoundationRing pct={foundation} />
        </div>
      </div>

      {MODULES.map((m, i) => {
        const id = m.id;
        const ready = m.status === "ready";
        const isCurrent = ready && profile.currentPath === m.id;
        const pct = ready ? moduleMastery(profile, m.id as Complaint) : 0;
        const drillCount = ready
          ? drills.filter((d) => moduleOfTopic[d.topic] === m.id).length
          : 0;
        return (
          <div className={`card path-row ${isCurrent ? "current" : ""} ${!ready ? "dim" : ""}`} key={m.id}>
            <div className="path-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="path-meta">
              <h3>
                {m.name}
                {isCurrent && <span className="path-chip">Current path</span>}
                {m.status === "development" && <span className="path-chip dev">In development</span>}
                {m.status === "locked" && <span className="path-chip locked">Locked</span>}
              </h3>
              <div className="sub">{ready ? `${drillCount} drills` : m.note}</div>
              <div className="path-progress">
                <div className="mastery-track">
                  <div
                    className={`mastery-fill ${pct >= 70 ? "strong" : pct >= 30 ? "mid" : ""}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="path-pct">{pct}%</span>
              </div>
            </div>
            <div className="path-action">
              {isCurrent ? (
                <button className="mini-btn" onClick={() => onStartSession()}>
                  Continue →
                </button>
              ) : ready && isReadyModule(id) ? (
                <button className="mini-btn ghost-mini" onClick={() => setPath(id)}>
                  Set path
                </button>
              ) : (
                <button className="mini-btn ghost-mini" disabled>
                  {m.status === "locked" ? "Locked" : "Soon"}
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="card">
        <div className="card-head">
          <h2>🗺️ Where you stand</h2>
          <span className="sub">by topic</span>
        </div>
        {[...new Set(mastery.map((m) => moduleOfTopic[m.topic]))].map((mod) => (
          <div key={mod}>
            <div className="module-head">{mod}</div>
            {mastery
              .filter((m) => moduleOfTopic[m.topic] === mod)
              .map((m) => {
                const comp = competencyOf(m);
                return (
                  <div className="mastery-row" key={m.topic}>
                    <div className="mastery-label">
                      <span>{m.topic}</span>
                      <span className={`comp-chip ${COMPETENCY_CLASS[comp]}`}>{comp}</span>
                    </div>
                    <div className="mastery-track">
                      <div
                        className={`mastery-fill ${m.pct >= 70 ? "strong" : m.pct >= 30 ? "mid" : ""}`}
                        style={{ width: `${Math.max(m.pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
        <p className="sub" style={{ marginTop: 10 }}>
          "Sharp" means you've remembered it across widening gaps — not that you answered it right
          once. Anything below Solid comes back sooner.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>📅 Review forecast</h2>
          <span className="sub">what spaced repetition has queued</span>
        </div>
        <div className="forecast">
          {forecastDays.map((d, i) => (
            <div className="forecast-col" key={d.iso}>
              <div className="forecast-n">{forecastCounts[i] || ""}</div>
              <div
                className={`forecast-bar ${i === 0 && forecastCounts[0] > 0 ? "due-now" : ""}`}
                style={{ height: `${Math.max((forecastCounts[i] / maxForecast) * 64, 4)}px` }}
              />
              <div className="forecast-label">{d.label}</div>
            </div>
          ))}
        </div>
        <p className="sub" style={{ marginTop: 8 }}>
          {forecastCounts[0] > 0
            ? `${forecastCounts[0]} due now — clearing reviews daily is what makes them stick.`
            : "Nothing due right now. Reviews accumulate as drills and review cards fall due."}
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🎯 Accuracy by topic</h2>
          <span className="sub">lifetime</span>
        </div>
        {topicAccuracy.length === 0 ? (
          <p className="sub">Answer some drills and your per-topic accuracy will appear here.</p>
        ) : (
          topicAccuracy.map(([topic, agg]) => {
            const pct = Math.round((agg.sum / agg.n) * 100);
            return (
              <div className="mastery-row" key={topic}>
                <div className="mastery-label">
                  <span>
                    {topic}
                    <span className="sub" style={{ fontWeight: 600 }}> · {moduleOfTopic[topic]}</span>
                  </span>
                  <span className="sub">
                    {pct}% · {agg.n} answered
                  </span>
                </div>
                <div className="mastery-track">
                  <div
                    className={`mastery-fill ${pct >= 75 ? "strong" : pct >= 50 ? "mid" : ""}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
        {topicAccuracy.length > 0 && (
          <p className="sub" style={{ marginTop: 8 }}>
            Your weakest topics sit at the top — the session builder already prioritizes them for review.
          </p>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>📖 Conditions</h2>
          <span className="sub">short lessons</span>
        </div>
        <p className="sub" style={{ marginBottom: 12 }}>
          Build the recognition pattern for a diagnosis in five to eight minutes — one idea per
          screen, then a quick check.
        </p>
        <button className="big-btn ghost" onClick={onOpenConditions}>
          Browse conditions →
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🫀 Body explorer</h2>
          <span className="sub">tap to explore</span>
        </div>
        <p className="sub" style={{ marginBottom: 12 }}>
          A whole-body diagram — tap a region to see what's clinically relevant there.
        </p>
        <button className="big-btn ghost" onClick={onOpenBodyExplorer}>
          Open body explorer →
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>📚 Evidence library</h2>
          <span className="sub">{drills.length} items</span>
        </div>
        <p className="sub" style={{ marginBottom: 12 }}>
          Read every drill with its citation and review status. If a number looks wrong, dispute
          it — that's how the content gets better.
        </p>
        <button className="big-btn ghost" onClick={onOpenLibrary}>
          Browse the evidence →
        </button>
      </div>

      <div className="footer-note">
        Clinician · A study aid, not a diagnostic tool — not medical advice
      </div>
    </div>
  );
}
