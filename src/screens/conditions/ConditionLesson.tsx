import { useEffect, useMemo, useRef, useState } from "react";
import type { Condition } from "../../conditions/schema";
import {
  buildLesson,
  createProgress,
  progressLabel,
  recordAnswer,
  reviewSeeds,
  type ConditionReviewSeed,
  type LessonProgress,
} from "../../conditions/lesson";
import {
  DifferentialsCard,
  DoesNotFitCard,
  ExaminationCard,
  InteractionBlock,
  LearnMore,
  LocationCard,
  PresentationCard,
  SafetyCard,
  SnapshotCard,
  SummaryCard,
} from "./cards";
import DeepDive from "./DeepDive";

/**
 * One-concept-per-screen lesson player.
 *
 * Progress is persisted on every step so a learner can leave mid-lesson and
 * resume. Deep Dive is never required to finish — the essential lesson
 * completes on its own.
 */
export default function ConditionLesson({
  condition: c,
  progress: saved,
  onProgress,
  onReviewSeeds,
  onExit,
}: {
  condition: Condition;
  progress: LessonProgress | null;
  onProgress: (p: LessonProgress) => void;
  /** Called once with the review items the knowledge check earned. */
  onReviewSeeds: (seeds: ConditionReviewSeed[]) => void;
  onExit: () => void;
}) {
  const cards = useMemo(() => buildLesson(c), [c]);
  const [p, setP] = useState<LessonProgress>(() => saved ?? createProgress(c.id));
  const [showDeepDive, setShowDeepDive] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);

  const update = (next: LessonProgress) => {
    setP(next);
    onProgress(next);
  };

  // Move focus to the top of each new card so screen readers and keyboard
  // users land on the new content rather than staying on the Next button.
  useEffect(() => {
    headingRef.current?.focus();
  }, [p.step]);

  const step = Math.min(p.step, cards.length - 1);
  const card = cards[step];
  const isLast = step === cards.length - 1;
  const onKnowledgeCheck = card.id === "knowledge-check";

  const back = () => step > 0 && update({ ...p, step: step - 1 });
  const next = () => !isLast && update({ ...p, step: step + 1 });

  if (showDeepDive) {
    return <DeepDive condition={c} onBack={() => setShowDeepDive(false)} />;
  }

  return (
    <div className="app lesson">
      <div className="progress-wrap">
        <button className="quit" onClick={onExit} aria-label="Leave this lesson — your progress is saved">
          ✕
        </button>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={cards.length}
          aria-label={progressLabel(cards, step)}
        >
          <div className="progress-fill" style={{ width: `${((step + 1) / cards.length) * 100}%` }} />
        </div>
      </div>

      <p className="lesson-step" aria-hidden="true">
        {progressLabel(cards, step)}
      </p>

      <div className="card lesson-card" key={card.id}>
        <div ref={headingRef} tabIndex={-1} className="lesson-focus">
          {card.id === "snapshot" && <SnapshotCard c={c} />}
          {card.id === "location" && <LocationCard c={c} hasInteraction={!!card.interaction} />}
          {card.id === "presentation" && <PresentationCard c={c} />}
          {card.id === "examination" && <ExaminationCard c={c} />}
          {card.id === "does-not-fit" && <DoesNotFitCard c={c} />}
          {card.id === "differentials" && <DifferentialsCard c={c} />}
          {card.id === "safety" && <SafetyCard c={c} />}
          {card.id === "summary" && <SummaryCard c={c} />}
          {onKnowledgeCheck && (
            <KnowledgeCheck
              c={c}
              onScored={(score, wrongIds) => {
                update({
                  ...p,
                  knowledgeScore: score,
                  completedOn: new Date().toISOString().slice(0, 10),
                  answered: [...new Set([...p.answered, "knowledge-check"])],
                });
                // Only wrong answers generate study material, capped so one
                // lesson cannot flood the queue.
                onReviewSeeds(reviewSeeds(c, wrongIds));
              }}
            />
          )}
        </div>

        {card.interaction && !onKnowledgeCheck && (
          <InteractionBlock
            interaction={card.interaction}
            condition={c}
            answered={p.answered.includes(card.id)}
            onAnswered={() => update(recordAnswer(p, card.id))}
          />
        )}
      </div>

      {!onKnowledgeCheck && (
        <div className="lesson-nav">
          <button className="big-btn ghost" onClick={back} disabled={step === 0}>
            Back
          </button>
          <button className="big-btn" onClick={next}>
            Next
          </button>
        </div>
      )}

      {onKnowledgeCheck && p.completedOn && (
        <div className="lesson-nav-stack">
          <button className="big-btn ghost" onClick={() => setShowDeepDive(true)}>
            Continue to Deep Dive
          </button>
          <button className="big-btn" onClick={onExit}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ── Knowledge check ───────────────────────────────────────────────────────

function KnowledgeCheck({
  c,
  onScored,
}: {
  c: Condition;
  onScored: (score: number, wrongIds: string[]) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const total = c.knowledgeCheck.length;
  const answeredCount = Object.keys(answers).length;
  const wrongIds = c.knowledgeCheck
    .filter((q) => answers[q.id] !== q.correctIndex)
    .map((q) => q.id);
  const score = Math.round(((total - wrongIds.length) / total) * 100);

  const finish = () => {
    setDone(true);
    onScored(score, wrongIds);
  };

  return (
    <>
      <h2 className="card-title">Test your knowledge</h2>
      {!done && (
        <p className="sub" style={{ marginBottom: 14 }}>
          {total} quick questions on what you just covered.
        </p>
      )}

      {c.knowledgeCheck.map((q, qi) => {
        const picked = answers[q.id];
        return (
          <fieldset className="kc-question" key={q.id}>
            <legend>
              {qi + 1}. {q.question}
            </legend>
            {q.options.map((opt, i) => {
              let cls = "option";
              if (done) {
                if (i === q.correctIndex) cls += " correct";
                else if (i === picked) cls += " wrong";
              } else if (i === picked) cls += " picked";
              return (
                <button
                  key={i}
                  className={cls}
                  disabled={done}
                  aria-pressed={i === picked}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                >
                  {opt}
                </button>
              );
            })}
            {done && <p className="kc-feedback">{q.feedback}</p>}
          </fieldset>
        );
      })}

      {!done ? (
        <button className="big-btn" disabled={answeredCount < total} onClick={finish}>
          {answeredCount < total ? `${total - answeredCount} left` : "Check answers"}
        </button>
      ) : (
        <div className="kc-result" role="status">
          <b>
            {total - wrongIds.length} of {total} correct
          </b>
          <p className="sub">
            {wrongIds.length === 0
              ? "You've got the pattern. Nothing scheduled for review."
              : `${wrongIds.length} concept${wrongIds.length === 1 ? "" : "s"} added to your review queue.`}
          </p>
        </div>
      )}
    </>
  );
}
