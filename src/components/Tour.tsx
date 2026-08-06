import { useEffect, useLayoutEffect, useState } from "react";

// ── First-launch guided tour ─────────────────────────────────────────────
// Spotlights real elements rather than showing screenshots, so what the user
// learns is where things actually are. Any step whose target is missing (a
// chip that only appears once earned, say) is skipped rather than pointing at
// nothing.

export interface TourStep {
  /** data-tour attribute value of the element to highlight. */
  target: string;
  title: string;
  body: string;
}

export const LEARN_TOUR: TourStep[] = [
  {
    target: "path",
    title: "Your reasoning path",
    body: "Cases and condition lessons, in order — work through a patient, not a quiz about a named disease.",
  },
  {
    target: "start",
    title: "Daily practice",
    body: "One tap starts today's session — reviews that have fallen due, plus new material. Five to ten minutes and you're done.",
  },
  {
    target: "streak",
    title: "Your streak, without the guilt",
    body: "Practise seven days and you bank a rest day. Miss a day after that and it's quietly covered — no lives, nothing to buy back.",
  },
  {
    target: "speed",
    title: "Speed — optional sharpening",
    body: "Sixty seconds, as many as you can answer. Good for recall speed; it doesn't replace your daily session.",
  },
  {
    target: "stats",
    title: "Awards — what you've earned",
    body: "Milestones, level, and lifetime numbers.",
  },
  {
    target: "you",
    title: "Profile — settings and backup",
    body: "Daily goal, theme, text size, and your backup file. Everything lives on this device, so back it up now and then.",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function rectOf(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function Tour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Skip past any steps whose target isn't on screen.
  const advanceTo = (from: number): number => {
    for (let j = from; j < steps.length; j++) {
      if (rectOf(steps[j].target)) return j;
    }
    return steps.length;
  };

  useLayoutEffect(() => {
    const next = advanceTo(i);
    if (next >= steps.length) {
      onDone();
      return;
    }
    if (next !== i) {
      setI(next);
      return;
    }
    setRect(rectOf(steps[i].target));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, steps]);

  useEffect(() => {
    const onResize = () => setRect(rectOf(steps[i].target));
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [i, steps]);

  if (!rect) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  const pad = 8;
  const spotlight = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  // Put the card on whichever side of the target has more room.
  const below = rect.top + rect.height / 2 < window.innerHeight / 2;
  const cardStyle: React.CSSProperties = below
    ? { top: spotlight.top + spotlight.height + 12 }
    : { bottom: window.innerHeight - spotlight.top + 12 };

  return (
    <div className="tour-overlay" role="dialog" aria-label={step.title}>
      <div className="tour-spotlight" style={spotlight} />
      <div className="tour-card" style={cardStyle}>
        <div className="tour-step-count">
          Step {i + 1} of {steps.length}
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onDone}>
            Skip tour
          </button>
          <button className="tour-next" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
