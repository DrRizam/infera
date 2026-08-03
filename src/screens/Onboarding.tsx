import { useState } from "react";

const SLIDES = [
  {
    icon: "🩺",
    title: "Train the skill textbooks can't teach",
    body: "Clinician sharpens your clinical reasoning — differentials, red flags, and test interpretation — in short daily sessions built for working MSK clinicians and students.",
  },
  {
    icon: "🧠",
    title: "Drills daily, boss cases weekly",
    body: "Quick drills keep your pattern recognition sharp in ~7 minutes a day. Full branching patient cases let you run an entire consultation — every question and exam pick is scored.",
  },
  {
    icon: "📅",
    title: "Built to be remembered",
    body: "Spaced repetition schedules every drill you meet: what you find hard returns sooner, what you master returns later. The goal isn't answering once — it's still knowing it in a year.",
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <div className="app onboarding">
      <div className="card ob-card">
        <div className="ob-icon">{s.icon}</div>
        <h1 className="ob-title">{s.title}</h1>
        <p className="ob-body">{s.body}</p>
        <div className="ob-dots">
          {SLIDES.map((_, j) => (
            <span key={j} className={`ob-dot ${j === i ? "on" : ""}`} />
          ))}
        </div>
        <button className="big-btn" onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? "Start training" : "Next"}
        </button>
        {!last && (
          <button className="big-btn ghost" style={{ marginTop: 10 }} onClick={onDone}>
            Skip
          </button>
        )}
      </div>
      <div className="footer-note">Educational use only — not medical advice</div>
    </div>
  );
}
