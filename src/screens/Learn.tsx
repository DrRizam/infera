import type { Complaint, Profile } from "../types";
import { MODULE_OF_TOPIC } from "../types";
import { MODULES, isReadyModule } from "../content/modules";
import { drills } from "../content";
import { cases } from "../content/cases";
import {
  COMPETENCY_CLASS,
  competencyOf,
  masteryByTopic,
  moduleMastery,
  overallMastery,
  safetyCompetency,
} from "../engine/srs";
import { effectiveStreak } from "../engine/store";

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

export default function Learn({
  profile,
  setProfile,
  onStartSession,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onStartSession: () => void;
}) {
  const streak = effectiveStreak(profile);
  const foundation = overallMastery(profile);
  const mastery = masteryByTopic(profile);
  const safety = safetyCompetency(profile);

  const setPath = (id: Complaint) => setProfile({ ...profile, currentPath: id });

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Clini<span>cian</span>
        </div>
        <div className="stats">
          <div className="chip flame">🔥 {streak}</div>
          {profile.shields > 0 && (
            <div className="chip shield" title="Banked rest days — a missed day spends one of these instead of your streak">
              🛡️ {profile.shields}
            </div>
          )}
          <div className="chip xp">⚡ {profile.xp} XP</div>
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

      {MODULES.map((m, i) => {
        const id = m.id;
        const ready = m.status === "ready";
        const isCurrent = ready && profile.currentPath === m.id;
        const pct = ready ? moduleMastery(profile, m.id as Complaint) : 0;
        const drillCount = ready
          ? drills.filter((d) => MODULE_OF_TOPIC[d.topic] === m.id).length
          : 0;
        const caseCount = ready ? cases.filter((c) => c.presentingComplaint.toLowerCase().includes(m.id.toLowerCase().split(" ")[0])).length : 0;
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
              <div className="sub">
                {ready ? `${drillCount} drills · ${caseCount} boss case${caseCount === 1 ? "" : "s"}` : m.note}
              </div>
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
                <button className="mini-btn" onClick={onStartSession}>
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
        {[...new Set(mastery.map((m) => MODULE_OF_TOPIC[m.topic]))].map((mod) => (
          <div key={mod}>
            <div className="module-head">{mod}</div>
            {mastery
              .filter((m) => MODULE_OF_TOPIC[m.topic] === mod)
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

      <div className="footer-note">
        Modules in development show real curriculum plans — they unlock as content passes
        clinical review.
      </div>
    </div>
  );
}
