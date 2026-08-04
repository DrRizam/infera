import type { ClinicalCase } from "../../cases/schema";
import type { EncounterState } from "../../engine/case/encounter";
import { generateFeedback, missedInformation } from "../../engine/case/feedback";
import { DIMENSION_LABELS, dispositionLabel, type CaseScore, type ScoreDimension } from "../../engine/case/scoring";
import type { CaseReviewCard } from "../../engine/case/reviewCards";

/**
 * Debrief order is deliberate and matches how a supervisor would run it:
 * safety first, then the decision, then the reasoning, then the study plan.
 * The score is not the headline — what went wrong in the thinking is.
 */
export default function Debrief({
  c,
  s,
  score,
  cards,
  onFinish,
}: {
  c: ClinicalCase;
  s: EncounterState;
  score: CaseScore;
  cards: CaseReviewCard[];
  onFinish: () => void;
}) {
  const feedback = generateFeedback(c, s, score);
  const missed = missedInformation(c, s);
  const correctDx = c.differentials.find((d) => d.id === c.finalDiagnosisId);
  const chosenDx = c.differentials.find((d) => d.id === s.finalDiagnosisId);
  const dxCorrect = s.finalDiagnosisId === c.finalDiagnosisId;

  const dims = Object.values(score.dimensions).filter((d) => d.score !== null);

  return (
    <>
      {/* 1. Patient safety — always first, whatever the score */}
      <div className={`card safety-banner ${score.safetyBreach ? "breach" : "safe"}`}>
        <div className="safety-icon" aria-hidden="true">
          {score.safetyBreach ? "🚨" : "🛡️"}
        </div>
        <div>
          <h2>{score.safetyBreach ? "Patient safety: compromised" : "Patient safety: maintained"}</h2>
          <p className="sub">
            {score.safetyBreach
              ? "Something in this encounter would have put the patient at risk. Read the critical items below before anything else."
              : "You screened appropriately and your disposition kept the patient safe."}
          </p>
        </div>
      </div>

      {/* 2. The decision */}
      <div className="card">
        <div className="card-head">
          <h2>Your decision</h2>
          <span className={`comp-chip ${dxCorrect ? "sharp" : "shaky"}`}>
            {dxCorrect ? "Supported" : "Not supported"}
          </span>
        </div>
        <div className="decision-grid">
          <div>
            <span className="lbl">You concluded</span>
            <b>{chosenDx?.label ?? "—"}</b>
            <span className="sub">at {s.finalConfidence}% confidence</span>
          </div>
          <div>
            <span className="lbl">Best supported</span>
            <b>{correctDx?.label}</b>
          </div>
          <div>
            <span className="lbl">You chose</span>
            <b>{s.disposition ? dispositionLabel(s.disposition) : "—"}</b>
          </div>
          <div>
            <span className="lbl">Appropriate</span>
            <b>{dispositionLabel(c.correctDisposition)}</b>
          </div>
        </div>
        <p style={{ marginTop: 12 }}>{c.diagnosisExplanation}</p>
      </div>

      {/* 3. Reasoning feedback — the actual product */}
      <div className="card">
        <h2>How you reasoned</h2>
        {feedback.length === 0 ? (
          <p className="sub">No specific reasoning issues detected in this encounter.</p>
        ) : (
          feedback.map((f, i) => (
            <div className={`reasoning-item ${f.severity}`} key={i}>
              <div className="reasoning-head">
                <span className="reasoning-badge" aria-hidden="true">
                  {f.severity === "critical"
                    ? "🚨"
                    : f.severity === "warning"
                      ? "⚠️"
                      : f.severity === "praise"
                        ? "✓"
                        : "•"}
                </span>
                <b>{f.title}</b>
              </div>
              <p>{f.detail}</p>
            </div>
          ))
        )}
      </div>

      {/* 4. Competency breakdown */}
      <div className="card">
        <div className="card-head">
          <h2>Competency breakdown</h2>
          <span className="sub">overall {score.overall}%</span>
        </div>
        {dims.map((d) => (
          <div className="mastery-row" key={d.dimension}>
            <div className="mastery-label">
              <span>{DIMENSION_LABELS[d.dimension as ScoreDimension]}</span>
              <span className="sub">{d.score}%</span>
            </div>
            <div className="mastery-track">
              <div
                className={`mastery-fill ${d.score! >= 70 ? "strong" : d.score! >= 40 ? "mid" : ""}`}
                style={{ width: `${Math.max(d.score!, 2)}%` }}
              />
            </div>
          </div>
        ))}
        <p className="sub" style={{ marginTop: 10 }}>
          Safety and red flag detection are weighted most heavily. A high diagnostic score cannot
          offset an unsafe encounter.
        </p>
      </div>

      {/* 5. Information the learner never obtained */}
      {missed.length > 0 && (
        <div className="card">
          <h2>What you did not ask</h2>
          <p className="sub" style={{ marginBottom: 12 }}>
            These were available and would have changed the picture.
          </p>
          {missed.map((m, i) => (
            <div className="missed-item" key={i}>
              <b>{m.question}</b>
              <div className="qa-answer">“{m.answer}”</div>
              <p className="sub">{m.why}</p>
            </div>
          ))}
        </div>
      )}

      {/* 6. Scheduled review */}
      <div className="card">
        <div className="card-head">
          <h2>📅 Scheduled for review</h2>
          <span className="sub">{cards.length}</span>
        </div>
        {cards.length === 0 ? (
          <p className="sub">
            Nothing to schedule — this encounter did not surface an error worth drilling.
          </p>
        ) : (
          <>
            <p className="sub" style={{ marginBottom: 12 }}>
              These come from what you got wrong, not from a fixed curriculum. The more dangerous
              the error, the sooner it returns.
            </p>
            {cards.map((k) => (
              <div className="review-card-row" key={k.id}>
                <span className={`sev-chip ${k.severity}`}>{k.severity}</span>
                <div>
                  <b>{k.prompt}</b>
                  <p className="sub">
                    {k.because} Due {k.dueDate}.
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 7. Evidence and governance */}
      <div className="card">
        <h2>Evidence for this case</h2>
        <div className="lib-row">
          <b>Status</b>
          <span>
            {c.contentStatus === "demonstration"
              ? "⚠️ Demonstration content — requires professional verification before clinical use"
              : c.contentStatus}
          </span>
        </div>
        <div className="lib-row">
          <b>Reviewer</b>
          <span>{c.reviewer ?? "Not yet reviewed by a clinician"}</span>
        </div>
        <div className="lib-row">
          <b>Reviewed</b>
          <span>{c.reviewDate ?? "—"}</span>
        </div>
        {c.uncertainty && (
          <div className="lib-row">
            <b>Uncertainty</b>
            <span>{c.uncertainty}</span>
          </div>
        )}
        {c.references.length > 0 && (
          <div className="lib-row">
            <b>References</b>
            <span>
              {c.references.map((r, i) => (
                <span key={i} style={{ display: "block", marginBottom: 4 }}>
                  {r}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>

      <button className="big-btn" onClick={onFinish}>
        Finish
      </button>
    </>
  );
}
