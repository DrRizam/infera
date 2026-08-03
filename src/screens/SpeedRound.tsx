import { useEffect, useMemo, useRef, useState } from "react";
import type { Drill, Profile } from "../types";
import { drills } from "../content";
import { addXp, logAnswer, touchStreak } from "../engine/store";
import { checkAchievements } from "../engine/achievements";
import type { Achievement } from "../types";

const ROUND_SECONDS = 60;
const XP_PER_CORRECT = 4;

type QuickDrill = Extract<Drill, { options: string[]; correctIndex: number }>;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SpeedRound({
  profile,
  setProfile,
  onExit,
  onRunningChange,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onExit: () => void;
  /** Tells the shell to hide the tab bar only while the timer is running. */
  onRunningChange: (running: boolean) => void;
}) {
  const pool = useMemo(
    () =>
      shuffle(
        drills.filter(
          (d): d is QuickDrill =>
            d.type === "mcq" || d.type === "discriminator" || d.type === "interpret"
        )
      ),
    []
  );
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [flash, setFlash] = useState<"right" | "wrong" | null>(null);
  const [finished, setFinished] = useState(false);
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);
  const statsRef = useRef({ correct: 0, answered: 0, log: [] as { topic: Drill["topic"]; score: number }[] });

  const d = pool[idx % pool.length];
  // Shuffle option positions per question — authored banks list the correct
  // answer first, so rendering in file order would leak the answer.
  const optionOrder = useMemo(() => shuffle(d.options.map((_, i) => i)), [d]);

  useEffect(() => {
    if (!started || finished) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, finished]);

  const finish = () => {
    setFinished(true);
    onRunningChange(false);
    const { correct: c, log } = statsRef.current;
    let p = profile;
    for (const l of log) p = logAnswer(p, l.topic, l.score);
    p = addXp(p, c * XP_PER_CORRECT);
    p = { ...p, speedBest: Math.max(p.speedBest, c) };
    if (c > 0) p = touchStreak(p);
    const earned = checkAchievements(p, { speedCorrect: c });
    if (earned.length) p = { ...p, achievements: [...p.achievements, ...earned.map((a) => a.id)] };
    setUnlocked(earned);
    setProfile(p);
  };

  const answer = (i: number) => {
    if (flash || finished) return;
    const right = i === d.correctIndex;
    statsRef.current.answered++;
    statsRef.current.log.push({ topic: d.topic, score: right ? 1 : 0 });
    if (right) {
      statsRef.current.correct++;
      setCorrect((c) => c + 1);
    }
    setAnswered((a) => a + 1);
    setFlash(right ? "right" : "wrong");
    setTimeout(() => {
      setFlash(null);
      setIdx((x) => x + 1);
    }, right ? 350 : 900);
  };

  if (!started)
    return (
      <div className="app">
        <div className="card" style={{ textAlign: "center", paddingTop: 32 }}>
          <div style={{ fontSize: 48 }}>⚡</div>
          <h2 style={{ fontSize: 22, margin: "8px 0" }}>Speed diagnosis</h2>
          <p className="sub" style={{ marginBottom: 6 }}>
            60 seconds. As many answers as you can. +{XP_PER_CORRECT} XP per correct.
          </p>
          <p className="sub" style={{ marginBottom: 16 }}>
            Personal best: <b>{profile.speedBest}</b>
          </p>
          <button
            className="big-btn"
            onClick={() => {
              setStarted(true);
              onRunningChange(true);
            }}
          >
            Go
          </button>
          <button className="big-btn ghost" style={{ marginTop: 10 }} onClick={onExit}>
            Back
          </button>
        </div>
      </div>
    );

  if (finished) {
    const acc = answered ? Math.round((correct / answered) * 100) : 0;
    const newBest = correct >= profile.speedBest && correct > 0;
    return (
      <div className="app">
        <div className="card" style={{ textAlign: "center", paddingTop: 32 }}>
          <div style={{ fontSize: 48 }}>{newBest ? "🏆" : "⚡"}</div>
          <h2 style={{ fontSize: 22, margin: "8px 0" }}>
            {newBest ? "New personal best!" : "Time!"}
          </h2>
          <div className="xp-burst">+{correct * XP_PER_CORRECT} XP</div>
          <div className="score-row">
            <div className="score-box">
              <div className="val">{correct}</div>
              <div className="lbl">correct</div>
            </div>
            <div className="score-box">
              <div className="val">{answered}</div>
              <div className="lbl">answered</div>
            </div>
            <div className="score-box">
              <div className="val">{acc}%</div>
              <div className="lbl">accuracy</div>
            </div>
          </div>
          {unlocked.map((a) => (
            <div className="unlock-banner" key={a.id}>
              {a.icon} Achievement unlocked: <b>{a.title}</b>
            </div>
          ))}
          <button className="big-btn" style={{ marginTop: 12 }} onClick={onExit}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="progress-wrap">
        <button className="quit" onClick={finish} title="End round">
          ✕
        </button>
        <div className="progress-track">
          <div
            className="progress-fill timer"
            style={{ width: `${(secondsLeft / ROUND_SECONDS) * 100}%` }}
          />
        </div>
        <div className="progress-label">
          ⏱ {secondsLeft}s · ✓ {correct}
        </div>
      </div>
      <div className={`card speed-card ${flash === "right" ? "flash-right" : flash === "wrong" ? "flash-wrong" : ""}`}>
        <span className="tag">{d.topic}</span>
        <div className="stem">{d.stem}</div>
        {d.type === "interpret" && (
          <div className="stats-line">
            <span className="stat-pill">{d.test.name}</span>
            <span className="stat-pill">Sn {d.test.sensitivity}%</span>
            <span className="stat-pill">Sp {d.test.specificity}%</span>
            <span className="stat-pill hot">{d.result.toUpperCase()}</span>
          </div>
        )}
        {optionOrder.map((origIdx) => {
          let cls = "option";
          if (flash && origIdx === d.correctIndex) cls += " correct";
          return (
            <button key={origIdx} className={cls} disabled={!!flash} onClick={() => answer(origIdx)}>
              {d.options[origIdx]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
