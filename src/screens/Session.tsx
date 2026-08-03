import { useMemo, useState } from "react";
import type { Achievement, Drill, Profile, RankDrill, RedFlagDrill } from "../types";
import { buildSession, reviewDrill, todayISO } from "../engine/srs";
import { Easy, Good, Hard, gradeFromScore, type Grade } from "../engine/fsrs";
import { addXp, logAnswer, touchStreak } from "../engine/store";
import { checkAchievements } from "../engine/achievements";

// ── Shared bits ──────────────────────────────────────────────────────────

function Feedback({ score, drill }: { score: number; drill: Drill }) {
  const good = score >= 0.99;
  const partial = score >= 0.6 && !good;
  return (
    <div className={`feedback ${good ? "good" : partial ? "neutral" : "bad"}`}>
      <div className={`verdict ${good ? "good-text" : partial ? "" : "bad-text"}`}>
        {good ? "Correct" : partial ? `Partially right (${Math.round(score * 100)}%)` : "Not quite"}
      </div>
      <div>{drill.explanation}</div>
      {drill.pearl && (
        <div className="pearl">
          <b>💎 Clinical pearl:</b> {drill.pearl}
        </div>
      )}
      <div className="citation">
        {drill.verification !== "verified" && (
          <span className={`badge ${drill.verification}`}>
            {drill.verification === "contested" ? "⚖️ evidence contested" : "⚠️ unverified"}
          </span>
        )}
        <span>📚 {drill.citation}</span>
        {drill.contestedNote && <span className="contested-note">{drill.contestedNote}</span>}
      </div>
    </div>
  );
}

/**
 * Lets a tester report a problem with an item without leaving the session.
 * Flags live in the profile and ride along in the JSON export, which is how
 * content feedback gets back to the author during the pilot.
 */
function FlagControl({
  drill,
  profile,
  setProfile,
}: {
  drill: Drill;
  profile: Profile;
  setProfile: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const already = profile.flags.some((f) => f.drillId === drill.id);

  if (already) return <div className="flag-btn flagged">⚑ Flagged — thanks, it's in your report</div>;

  if (!open)
    return (
      <button className="flag-btn" onClick={() => setOpen(true)}>
        ⚑ Something wrong with this item?
      </button>
    );

  const submit = () => {
    setProfile({
      ...profile,
      flags: [...profile.flags, { drillId: drill.id, note: note.trim(), date: todayISO() }],
    });
    setOpen(false);
  };

  return (
    <div className="flag-box">
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What's wrong? Wrong answer, outdated number, unclear wording, bad citation…"
      />
      <div className="flag-actions">
        <button onClick={() => setOpen(false)}>Cancel</button>
        <button className="send" onClick={submit}>
          Send flag
        </button>
      </div>
    </div>
  );
}

/**
 * Post-answer footer. A fully correct answer asks the learner to self-grade —
 * FSRS needs to know "shaky" from "cold". Wrong/partial answers are graded
 * automatically: partial credit means the construct was right but execution
 * wasn't, which by our rubric is Hard, never Again.
 */
function GradeBar({ score, onGrade }: { score: number; onGrade: (g: Grade) => void }) {
  if (score < 0.99) {
    return (
      <button className="big-btn teal" style={{ marginTop: 14 }} onClick={() => onGrade(gradeFromScore(score))}>
        Continue
      </button>
    );
  }
  return (
    <div className="grade-row">
      <button className="grade-btn hard" onClick={() => onGrade(Hard)}>
        Shaky
        <span>back soon</span>
      </button>
      <button className="grade-btn good" onClick={() => onGrade(Good)}>
        Got it
        <span>normal gap</span>
      </button>
      <button className="grade-btn easy" onClick={() => onGrade(Easy)}>
        Knew it cold
        <span>longer gap</span>
      </button>
    </div>
  );
}

function TestStatsLine({ drill }: { drill: Drill }) {
  if (drill.type !== "interpret") return null;
  const t = drill.test;
  return (
    <div className="stats-line">
      <span className="stat-pill">{t.name}</span>
      <span className="stat-pill">Target: {t.target}</span>
      <span className="stat-pill">Sn {t.sensitivity}%</span>
      <span className="stat-pill">Sp {t.specificity}%</span>
      {t.lrPlus != null && <span className="stat-pill">LR+ {t.lrPlus}</span>}
      {t.lrMinus != null && <span className="stat-pill">LR− {t.lrMinus}</span>}
      <span className="stat-pill hot">Result: {drill.result.toUpperCase()}</span>
    </div>
  );
}

// ── Choice drills (mcq / interpret / discriminator) ──────────────────────

function ChoiceDrill({
  drill,
  onDone,
}: {
  drill: Extract<Drill, { options: string[]; correctIndex: number }>;
  onDone: (score: number, grade: Grade) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const shuffled = useMemo(() => {
    const idx = drill.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [drill.id]);

  const answered = picked !== null;
  return (
    <div>
      {drill.type === "discriminator" && (
        <div className="stats-line">
          <span className="stat-pill">{drill.conditionA}</span>
          <span className="stat-pill vs">vs</span>
          <span className="stat-pill">{drill.conditionB}</span>
        </div>
      )}
      <div className="stem">{drill.stem}</div>
      <TestStatsLine drill={drill} />
      {shuffled.map((origIdx) => {
        let cls = "option";
        if (answered) {
          if (origIdx === drill.correctIndex) cls += " correct";
          else if (origIdx === picked) cls += " wrong";
        }
        return (
          <button
            key={origIdx}
            className={cls}
            disabled={answered}
            onClick={() => setPicked(origIdx)}
          >
            {drill.options[origIdx]}
          </button>
        );
      })}
      {answered && (
        <>
          <Feedback score={picked === drill.correctIndex ? 1 : 0} drill={drill} />
          <GradeBar
            score={picked === drill.correctIndex ? 1 : 0}
            onGrade={(g) => onDone(picked === drill.correctIndex ? 1 : 0, g)}
          />
        </>
      )}
    </div>
  );
}

// ── Rank drill: tap options in order ─────────────────────────────────────

export function kendallScore(userOrder: number[], correctCount: number): number {
  // userOrder[i] = original index (0 = most likely per expert) picked at position i.
  let concordant = 0;
  let total = 0;
  for (let i = 0; i < userOrder.length; i++) {
    for (let j = i + 1; j < userOrder.length; j++) {
      total++;
      if (userOrder[i] < userOrder[j]) concordant++;
    }
  }
  return total === 0 ? 0 : concordant / total;
}

function RankDrillView({
  drill,
  onDone,
}: {
  drill: RankDrill;
  onDone: (s: number, g: Grade) => void;
}) {
  const shuffled = useMemo(() => {
    const idx = drill.orderedOptions.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [drill.id]);
  const [order, setOrder] = useState<number[]>([]); // original indices in tap order
  const [submitted, setSubmitted] = useState(false);

  const toggle = (orig: number) => {
    if (submitted) return;
    setOrder((o) => (o.includes(orig) ? o.filter((x) => x !== orig) : [...o, orig]));
  };
  const score = submitted ? kendallScore(order, drill.orderedOptions.length) : 0;

  return (
    <div>
      <div className="stem">{drill.stem}</div>
      <p className="sub" style={{ marginBottom: 12 }}>
        {drill.category === "procedure"
          ? "Tap the steps in order — first step first. Tap again to remove."
          : "Tap in order — most likely first. Tap again to remove."}
      </p>
      {shuffled.map((orig) => {
        const pos = order.indexOf(orig);
        let cls = "option";
        if (submitted) {
          if (pos === orig) cls += " correct";
          else cls += " wrong";
        } else if (pos >= 0) cls += " picked";
        return (
          <button key={orig} className={cls} disabled={submitted} onClick={() => toggle(orig)}>
            <span className={`order-badge ${pos < 0 ? "ghost-badge" : ""}`}>
              {pos >= 0 ? pos + 1 : "·"}
            </span>
            {drill.orderedOptions[orig]}
            {submitted && (
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: "var(--ink-soft)" }}>
                expert: #{orig + 1}
              </span>
            )}
          </button>
        );
      })}
      {!submitted ? (
        <button
          className="big-btn teal"
          disabled={order.length !== drill.orderedOptions.length}
          onClick={() => setSubmitted(true)}
        >
          Check my ranking
        </button>
      ) : (
        <>
          <Feedback score={score} drill={drill} />
          <GradeBar score={score} onGrade={(g) => onDone(score, g)} />
        </>
      )}
    </div>
  );
}

// ── Red flag spotter: select-all ─────────────────────────────────────────

function RedFlagDrillView({
  drill,
  onDone,
}: {
  drill: RedFlagDrill;
  onDone: (s: number, g: Grade) => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggle = (i: number) => {
    if (submitted) return;
    setSelected((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const score = submitted
    ? drill.findings.filter((f, i) => f.isRedFlag === selected.has(i)).length / drill.findings.length
    : 0;

  return (
    <div>
      <div className="stem">{drill.stem}</div>
      {drill.findings.map((f, i) => {
        let cls = "option";
        if (submitted) {
          if (f.isRedFlag) cls += selected.has(i) ? " correct" : " wrong";
          else if (selected.has(i)) cls += " wrong";
        } else if (selected.has(i)) cls += " picked";
        return (
          <div key={i}>
            <button className={cls} disabled={submitted} onClick={() => toggle(i)}>
              <span className={`check ${selected.has(i) ? "on" : ""}`}>
                {selected.has(i) ? "✓" : ""}
              </span>
              {f.text}
              {submitted && (
                <span style={{ marginLeft: "auto", fontSize: 16 }}>{f.isRedFlag ? "🚩" : "✅"}</span>
              )}
            </button>
            {submitted && (
              <div className="qa-answer value-note" style={{ marginTop: -8 }}>
                {f.note}
              </div>
            )}
          </div>
        );
      })}
      {!submitted ? (
        <button className="big-btn teal" onClick={() => setSubmitted(true)}>
          Check
        </button>
      ) : (
        <>
          <Feedback score={score} drill={drill} />
          <GradeBar score={score} onGrade={(g) => onDone(score, g)} />
        </>
      )}
    </div>
  );
}

// ── Session orchestrator ─────────────────────────────────────────────────

export default function Session({
  profile,
  setProfile,
  onExit,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onExit: () => void;
}) {
  const [queue] = useState<Drill[]>(() => buildSession(profile));
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

  const drill = queue[idx];

  const handleDone = (score: number, grade: Grade) => {
    const updated = reviewDrill(profile.srs[drill.id], drill.id, score, grade);
    const xpGain = Math.round(10 * score) + (score >= 0.99 ? 2 : 0);
    let next: Profile = addXp(
      logAnswer({ ...profile, srs: { ...profile.srs, [drill.id]: updated } }, drill.topic, score),
      xpGain
    );
    const newScores = [...scores, score];
    setScores(newScores);
    if (idx + 1 >= queue.length) {
      next = touchStreak({ ...next, sessionsCompleted: next.sessionsCompleted + 1 });
      const accuracy = newScores.reduce((a, b) => a + b, 0) / newScores.length;
      const earned = checkAchievements(next, { sessionAccuracy: accuracy });
      if (earned.length)
        next = { ...next, achievements: [...next.achievements, ...earned.map((a) => a.id)] };
      setUnlocked(earned);
      setProfile(next);
      setFinished(true);
    } else {
      setProfile(next);
      setIdx(idx + 1);
    }
  };

  if (finished) {
    const avg = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
    const xp = scores.reduce((a, s) => a + Math.round(10 * s) + (s >= 0.99 ? 2 : 0), 0);
    return (
      <div className="app">
        <div className="card" style={{ textAlign: "center", paddingTop: 32 }}>
          <div style={{ fontSize: 48 }}>{avg >= 0.8 ? "🏆" : avg >= 0.6 ? "💪" : "📚"}</div>
          <h2 style={{ fontSize: 22, margin: "8px 0" }}>Session complete</h2>
          <div className="xp-burst">+{xp} XP</div>
          <div className="score-row">
            <div className="score-box">
              <div className="val">{Math.round(avg * 100)}%</div>
              <div className="lbl">accuracy</div>
            </div>
            <div className="score-box">
              <div className="val">{queue.length}</div>
              <div className="lbl">drills</div>
            </div>
            <div className="score-box">
              <div className="val">🔥 {profile.streak}</div>
              <div className="lbl">streak</div>
            </div>
          </div>
          <p className="sub" style={{ marginBottom: 16 }}>
            {avg >= 0.8
              ? "Sharp reasoning. Harder material is coming."
              : "The drills you missed will return sooner — that's the system working."}
          </p>
          {unlocked.map((a) => (
            <div className="unlock-banner" key={a.id}>
              {a.icon} Achievement unlocked: <b>{a.title}</b>
            </div>
          ))}
          <button className="big-btn" style={{ marginTop: unlocked.length ? 12 : 0 }} onClick={onExit}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!drill) {
    return (
      <div className="app">
        <div className="card">
          <h2>No drills available</h2>
          <button className="big-btn teal" onClick={onExit}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const isReview = !!profile.srs[drill.id];
  return (
    <div className="app">
      <div className="progress-wrap">
        <button className="quit" onClick={onExit} title="Quit session">
          ✕
        </button>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(idx / queue.length) * 100}%` }} />
        </div>
        <div className="progress-label">
          {idx + 1}/{queue.length}
        </div>
      </div>
      <div className="card" key={drill.id}>
        <span className={`tag ${isReview ? "review" : ""}`}>
          {isReview ? "🔁 review · " : ""}
          {drill.topic}
        </span>
        {drill.type === "rank" ? (
          <RankDrillView drill={drill} onDone={handleDone} />
        ) : drill.type === "redflags" ? (
          <RedFlagDrillView drill={drill} onDone={handleDone} />
        ) : (
          <ChoiceDrill drill={drill} onDone={handleDone} />
        )}
        <FlagControl drill={drill} profile={profile} setProfile={setProfile} />
      </div>
    </div>
  );
}
