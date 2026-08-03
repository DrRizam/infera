import { useMemo, useState } from "react";
import type { McqDrill } from "../types";
import { drills } from "../content";
import { ONBOARDING_DRILL_ID } from "../config";

// ── Onboarding ───────────────────────────────────────────────────────────
// A skeptical clinician doesn't need three slides telling them the content is
// rigorous — they need to answer one real question and see the citation
// underneath it. Show first, explain second.

function SampleDrill({ onAnswered }: { onAnswered: () => void }) {
  const drill = useMemo(() => {
    const picked = drills.find((d) => d.id === ONBOARDING_DRILL_ID && d.type === "mcq");
    return (picked ?? drills.find((d) => d.type === "mcq")) as McqDrill | undefined;
  }, []);
  const [picked, setPicked] = useState<number | null>(null);
  const [showSource, setShowSource] = useState(false);

  const shuffled = useMemo(() => {
    if (!drill) return [];
    const idx = drill.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [drill]);

  if (!drill) {
    return (
      <>
        <p className="ob-body">No sample drill available — the library looks empty.</p>
        <button className="big-btn" onClick={onAnswered}>
          Continue
        </button>
      </>
    );
  }

  const answered = picked !== null;
  const correct = picked === drill.correctIndex;

  return (
    <>
      <p className="ob-kicker">Try one — this is a real drill from the library.</p>
      <div className="stem" style={{ textAlign: "left" }}>
        {drill.stem}
      </div>
      {shuffled.map((i) => {
        let cls = "option";
        if (answered) {
          if (i === drill.correctIndex) cls += " correct";
          else if (i === picked) cls += " wrong";
        }
        return (
          <button key={i} className={cls} disabled={answered} onClick={() => setPicked(i)}>
            {drill.options[i]}
          </button>
        );
      })}
      {answered && (
        <>
          <div className={`feedback ${correct ? "good" : "bad"}`} style={{ textAlign: "left" }}>
            <div className={`verdict ${correct ? "good-text" : "bad-text"}`}>
              {correct ? "✓ Correct" : "✕ Not quite"}
            </div>
            <div>{drill.explanation}</div>
            {drill.pearl && (
              <div className="pearl">
                <b>💎 Clinical pearl:</b> {drill.pearl}
              </div>
            )}
            <div className="citation">
              <div className="citation-head">
                {drill.verification !== "verified" && (
                  <span className={`badge ${drill.verification}`}>
                    {drill.verification === "contested" ? "⚖️ evidence contested" : "⚠️ unverified"}
                  </span>
                )}
                <button className="source-toggle" onClick={() => setShowSource((s) => !s)}>
                  📚 Source {showSource ? "▲" : "▼"}
                </button>
              </div>
              {showSource && (
                <div className="citation-body">
                  <span>{drill.citation}</span>
                </div>
              )}
            </div>
          </div>
          <p className="ob-body" style={{ margin: "14px 0 16px" }}>
            Every claim in this app carries its source, and anything a clinician hasn't checked
            yet is marked <b>⚠️ unverified</b> — so you always know what you're trusting.
          </p>
          <button className="big-btn" onClick={onAnswered}>
            Next
          </button>
        </>
      )}
    </>
  );
}

const SLIDES = [
  {
    icon: "📅",
    title: "It decides when you see things again",
    body: "Every drill you meet gets scheduled. What you find hard comes back soon; what you know cold comes back in weeks, then months. The goal isn't answering once — it's still knowing it next year, when a patient is in front of you.",
  },
  {
    icon: "🛡️",
    title: "Missing a day is allowed",
    body: "Practise seven days and you bank a rest day. Miss a day after that and the shield covers it — your streak survives. No lives, no hearts, nothing to buy back. You finished a 12-hour clinic; the app isn't going to punish you for it.",
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  // Step 0 is the sample drill; the rest are explanation slides.
  const [step, setStep] = useState(0);
  const totalSteps = SLIDES.length + 1;
  const slide = step > 0 ? SLIDES[step - 1] : null;
  const last = step === totalSteps - 1;

  return (
    <div className="app onboarding">
      <div className="card ob-card">
        {slide ? (
          <>
            <div className="ob-icon">{slide.icon}</div>
            <h1 className="ob-title">{slide.title}</h1>
            <p className="ob-body">{slide.body}</p>
          </>
        ) : (
          <SampleDrill onAnswered={() => setStep(1)} />
        )}

        <div className="ob-dots">
          {Array.from({ length: totalSteps }, (_, j) => (
            <span key={j} className={`ob-dot ${j === step ? "on" : ""}`} />
          ))}
        </div>

        {slide && (
          <button className="big-btn" onClick={() => (last ? onDone() : setStep(step + 1))}>
            {last ? "Start training" : "Next"}
          </button>
        )}
        {!last && (
          <button className="big-btn ghost" style={{ marginTop: 10 }} onClick={onDone}>
            Skip
          </button>
        )}
      </div>
      <div className="footer-note">
        A study aid, not a diagnostic tool — not medical advice
      </div>
    </div>
  );
}
