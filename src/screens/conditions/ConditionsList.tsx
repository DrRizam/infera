import { conditionsByComplaint } from "../../conditions";
import type { LessonProgress } from "../../conditions/lesson";
import { buildLesson } from "../../conditions/lesson";
import { getCondition } from "../../conditions";

/**
 * Conditions browsed by presenting complaint, matching how a patient arrives.
 * Each row shows where the learner got to, so resuming is one tap.
 */
export default function ConditionsList({
  progress,
  onOpen,
  onBack,
}: {
  progress: Record<string, LessonProgress>;
  onOpen: (conditionId: string) => void;
  onBack: () => void;
}) {
  const groups = conditionsByComplaint();

  return (
    <div className="app">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="card">
        <h2>📖 Conditions</h2>
        <p className="sub" style={{ marginTop: 6 }}>
          Short lessons that build the recognition pattern for a diagnosis. Five to eight minutes
          each, then a quick check.
        </p>
      </div>

      {groups.length === 0 && (
        <div className="card">
          <p className="sub">No condition lessons yet.</p>
        </div>
      )}

      {groups.map((g) => (
        <div className="card" key={g.complaint}>
          <div className="module-head">{g.complaint}</div>
          {g.conditions.map((c) => {
            const p = progress[c.id];
            const cards = buildLesson(c);
            const done = p?.completedOn != null;
            const started = p && !done && p.step > 0;
            return (
              <button key={c.id} className="condition-row" onClick={() => onOpen(c.id)}>
                <span className="condition-meta">
                  <b>{c.name}</b>
                  <span className="sub">
                    {done
                      ? `Completed${p.knowledgeScore !== null ? ` · ${p.knowledgeScore}%` : ""}`
                      : started
                        ? `Resume · ${p.step + 1} of ${cards.length}`
                        : `${c.estimatedMinutes} min · ${cards.length} cards`}
                  </span>
                </span>
                <span className={`condition-status ${done ? "done" : started ? "part" : ""}`}>
                  {done ? "✓" : started ? "▸" : "›"}
                </span>
              </button>
            );
          })}
        </div>
      ))}

      <div className="footer-note">
        Condition lessons are demonstration content pending clinical review.
      </div>
    </div>
  );
}
