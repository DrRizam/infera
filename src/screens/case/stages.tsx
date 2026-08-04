import { useState } from "react";
import type { ClinicalCase, DispositionOption, Examination } from "../../cases/schema";
import type { EncounterState } from "../../engine/case/encounter";
import { remainingExaminationBudget, remainingSubjectiveBudget } from "../../engine/case/encounter";
import { derivedLikelihoodRatios, describeLikelihoodRatio } from "../../engine/case/probability";
import { dispositionLabel } from "../../engine/case/scoring";

// Stage components are deliberately dumb: they render what they are given and
// report what the learner did. All progression, scoring and feedback logic
// lives in engine/case/.

interface StageProps {
  c: ClinicalCase;
  s: EncounterState;
  update: (patch: Partial<EncounterState>) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  "mechanism-onset": "Mechanism & onset",
  "symptom-location": "Location",
  "symptom-behaviour": "Behaviour",
  "24-hour-pattern": "24-hour pattern",
  "aggravating-easing": "Aggravating & easing",
  neurological: "Neurological",
  systemic: "Systemic",
  "previous-episodes": "Previous episodes",
  "past-medical": "Past medical",
  medication: "Medication",
  function: "Function",
  "training-load": "Training load",
  "work-lifestyle": "Work & lifestyle",
  psychosocial: "Psychosocial",
  expectations: "Expectations",
  observation: "Observation",
  "active-rom": "Active ROM",
  "passive-rom": "Passive ROM",
  resisted: "Resisted testing",
  functional: "Functional",
  palpation: "Palpation",
  "special-test": "Special test",
  "adjacent-screen": "Adjacent region",
  vitals: "Vital signs",
  "outcome-measure": "Outcome measure",
};

// ── Presentation ──────────────────────────────────────────────────────────

export function PresentationStage({ c }: StageProps) {
  return (
    <>
      <div className="card patient-card">
        <div className="ptitle">Your patient</div>
        <h2>
          {c.patient.age}-year-old {c.patient.sex.toLowerCase()} · {c.patient.occupation}
        </h2>
        <div className="quote">“{c.patient.opening}”</div>
        {c.patient.context.length > 0 && (
          <ul>
            {c.patient.context.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <h2>Before you begin</h2>
        <p className="sub" style={{ marginTop: 6 }}>
          You will take a history, screen for serious pathology, build a differential, examine, and
          then commit to a decision. You will not be told the diagnosis until you have committed to
          one — that is the point.
        </p>
        <p className="sub" style={{ marginTop: 10 }}>
          You have a limited number of questions and examinations, so choose what would actually
          change your management.
        </p>
      </div>
    </>
  );
}

// ── Subjective history ────────────────────────────────────────────────────

export function SubjectiveStage({ c, s, update }: StageProps) {
  const remaining = remainingSubjectiveBudget(s, c);
  const grouped = new Map<string, typeof c.subjectiveQuestions>();
  for (const q of c.subjectiveQuestions) {
    const list = grouped.get(q.category) ?? [];
    list.push(q);
    grouped.set(q.category, list);
  }

  const ask = (id: string) => {
    if (s.askedQuestionIds.includes(id) || remaining === 0) return;
    update({ askedQuestionIds: [...s.askedQuestionIds, id] });
  };

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>Subjective history</h2>
          <span className={`budget-chip ${remaining === 0 ? "spent" : ""}`}>
            {remaining} question{remaining === 1 ? "" : "s"} left
          </span>
        </div>
        <p className="sub">
          Ask what would change your thinking. You cannot ask everything — that constraint is the
          exercise.
        </p>
      </div>

      {[...grouped.entries()].map(([category, questions]) => (
        <div className="card" key={category}>
          <div className="module-head">{CATEGORY_LABELS[category] ?? category}</div>
          {questions.map((q) => {
            const asked = s.askedQuestionIds.includes(q.id);
            return (
              <div key={q.id}>
                <button
                  className={`option ${asked ? "picked" : ""}`}
                  onClick={() => ask(q.id)}
                  disabled={asked || remaining === 0}
                  aria-pressed={asked}
                >
                  {q.question}
                </button>
                {asked && (
                  <div className="qa-answer" role="region" aria-label="Patient response">
                    “{q.answer}”
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ── Red flag screening ────────────────────────────────────────────────────

export function RedFlagStage({ c, s, update }: StageProps) {
  const toggle = (id: string) => {
    const on = s.flaggedRedFlagIds.includes(id);
    update({
      flaggedRedFlagIds: on
        ? s.flaggedRedFlagIds.filter((f) => f !== id)
        : [...s.flaggedRedFlagIds, id],
    });
  };

  return (
    <div className="card">
      <h2>🚩 Screening</h2>
      <p className="sub" style={{ margin: "6px 0 14px" }}>
        Based on what this patient has told you, select any findings you believe are present. Select
        none if you think none apply — that is a valid answer.
      </p>
      {c.redFlags.map((f) => {
        const on = s.flaggedRedFlagIds.includes(f.id);
        return (
          <button
            key={f.id}
            className={`option ${on ? "picked" : ""}`}
            onClick={() => toggle(f.id)}
            aria-pressed={on}
          >
            <span className={`check ${on ? "on" : ""}`} aria-hidden="true">
              {on ? "✓" : ""}
            </span>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Examination ───────────────────────────────────────────────────────────

function ProbabilityNote({ ex }: { ex: Examination }) {
  const stats = ex.statistics;
  if (!stats) return null;

  if (stats.status === "placeholder") {
    return (
      <div className="prob-panel placeholder">
        <span className="badge unverified">⚠️ no accuracy data entered</span>
        <p className="sub">{stats.source}</p>
      </div>
    );
  }

  const { lrPositive, lrNegative } = derivedLikelihoodRatios(stats);
  const lr = ex.result === "positive" ? lrPositive : ex.result === "negative" ? lrNegative : null;

  return (
    <div className="prob-panel">
      <div className="stats-line">
        {stats.sensitivity !== null && <span className="stat-pill">Sn {stats.sensitivity}%</span>}
        {stats.specificity !== null && <span className="stat-pill">Sp {stats.specificity}%</span>}
        {lr !== null && (
          <span className="stat-pill hot">
            LR{ex.result === "positive" ? "+" : "−"} {lr.toFixed(1)}
          </span>
        )}
        {stats.status === "contested" && (
          <span className="badge contested">⚖️ contested</span>
        )}
      </div>
      {lr !== null && (
        <p className="prob-reading">
          <b>{describeLikelihoodRatio(lr)}.</b> A test result moves probability — it does not settle
          it. Where you land depends on how likely the diagnosis was before you tested.
        </p>
      )}
      {stats.limitations && <p className="sub">{stats.limitations}</p>}
      <p className="sub citation-source">📚 {stats.source}</p>
    </div>
  );
}

export function ExaminationStage({ c, s, update }: StageProps) {
  const remaining = remainingExaminationBudget(s, c);
  const perform = (id: string) => {
    if (s.performedExaminationIds.includes(id) || remaining === 0) return;
    update({ performedExaminationIds: [...s.performedExaminationIds, id] });
  };

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>Physical examination</h2>
          <span className={`budget-chip ${remaining === 0 ? "spent" : ""}`}>
            {remaining} test{remaining === 1 ? "" : "s"} left
          </span>
        </div>
        <p className="sub">
          Choose tests whose result would change what you do next. Performing everything is not
          thoroughness — it costs time and adds false positives.
        </p>
      </div>

      {c.examinations.map((ex) => {
        const done = s.performedExaminationIds.includes(ex.id);
        return (
          <div className="card exam-card" key={ex.id}>
            <div className="card-head">
              <h3 className="exam-name">{ex.name}</h3>
              <span className="exam-cost">
                {CATEGORY_LABELS[ex.category] ?? ex.category} · ~{ex.timeCost} min
              </span>
            </div>
            <p className="sub">{ex.rationale}</p>
            {!done ? (
              <button
                className="big-btn ghost"
                style={{ marginTop: 10 }}
                onClick={() => perform(ex.id)}
                disabled={remaining === 0}
              >
                Perform this test
              </button>
            ) : (
              <div className="exam-result">
                <div className="finding">
                  <b>Finding:</b> {ex.finding}
                </div>
                <ProbabilityNote ex={ex} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── Interpretation ────────────────────────────────────────────────────────

export function InterpretationStage({ c, s }: StageProps) {
  const performed = c.examinations.filter((e) => s.performedExaminationIds.includes(e.id));
  return (
    <>
      <div className="card">
        <h2>What your findings mean</h2>
        <p className="sub" style={{ marginTop: 6 }}>
          Read these before revising your differential. Each one should push a diagnosis up or down
          — if a finding changes nothing, ask why you performed it.
        </p>
      </div>
      {performed.map((ex) => (
        <div className="card" key={ex.id}>
          <div className="module-head">{ex.name}</div>
          <p className="finding">
            <b>Finding:</b> {ex.finding}
          </p>
          <p style={{ marginTop: 8 }}>{ex.interpretation}</p>
          {ex.effects.length > 0 && (
            <div className="effect-row">
              {ex.effects.map((eff, i) => {
                const label =
                  c.differentials.find((d) => d.id === eff.differentialId)?.label ??
                  eff.differentialId;
                const up = eff.direction.includes("up");
                const neutral = eff.direction === "neutral";
                return (
                  <span
                    key={i}
                    className={`effect-chip ${neutral ? "flat" : up ? "up" : "down"}`}
                  >
                    {neutral ? "→" : up ? "↑" : "↓"} {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {performed.length === 0 && (
        <div className="card">
          <p className="sub">You did not perform any examination, so there is nothing to interpret.</p>
        </div>
      )}
    </>
  );
}

// ── Final diagnosis and confidence ────────────────────────────────────────

export function DiagnosisStage({ c, s, update }: StageProps) {
  const list = s.updatedDifferential.length ? s.updatedDifferential : s.initialDifferential;
  return (
    <div className="card">
      <h2>Commit to a diagnosis</h2>
      <p className="sub" style={{ margin: "6px 0 14px" }}>
        Choose the single diagnosis you are working to, then say how confident you actually are.
        Confidence is scored — being certain and wrong costs more than being unsure and wrong.
      </p>
      {list.map((d) => {
        const label = c.differentials.find((x) => x.id === d.differentialId)?.label ?? d.differentialId;
        const on = s.finalDiagnosisId === d.differentialId;
        return (
          <button
            key={d.differentialId}
            className={`option ${on ? "picked" : ""}`}
            onClick={() => update({ finalDiagnosisId: d.differentialId })}
            aria-pressed={on}
          >
            {label}
          </button>
        );
      })}

      <div className="confidence-block">
        <label htmlFor="final-confidence">
          How confident are you? <b>{s.finalConfidence}%</b>
        </label>
        <input
          id="final-confidence"
          type="range"
          min={10}
          max={95}
          step={5}
          value={s.finalConfidence}
          onChange={(e) => update({ finalConfidence: Number(e.target.value) })}
        />
        <div className="confidence-scale" aria-hidden="true">
          <span>Uncertain</span>
          <span>Fairly sure</span>
          <span>Very confident</span>
        </div>
      </div>
    </div>
  );
}

// ── Disposition ───────────────────────────────────────────────────────────

const DISPOSITIONS: { id: DispositionOption; blurb: string }[] = [
  { id: "treat", blurb: "Begin management today — no further information needed first." },
  { id: "investigate", blurb: "Something must be confirmed or excluded before you commit." },
  { id: "refer-urgent", blurb: "Needs to be seen by someone else quickly — today or tomorrow." },
  { id: "refer-routine", blurb: "Needs another opinion, but not urgently." },
  { id: "monitor", blurb: "Reasonable to reassess after a defined interval without acting now." },
];

export function DispositionStage({ s, update }: StageProps) {
  return (
    <div className="card">
      <h2>What happens to this patient now?</h2>
      <p className="sub" style={{ margin: "6px 0 14px" }}>
        This is the decision that carries the patient's safety. It is weighted most heavily of
        anything you have done in this encounter.
      </p>
      {DISPOSITIONS.map((d) => {
        const on = s.disposition === d.id;
        return (
          <button
            key={d.id}
            className={`option disposition ${on ? "picked" : ""}`}
            onClick={() => update({ disposition: d.id })}
            aria-pressed={on}
          >
            <span>
              <b>{dispositionLabel(d.id)}</b>
              <span className="sub disposition-blurb">{d.blurb}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Management ────────────────────────────────────────────────────────────

export function ManagementStage({ c, s, update }: StageProps) {
  const toggle = (id: string) => {
    const on = s.managementIds.includes(id);
    update({
      managementIds: on ? s.managementIds.filter((m) => m !== id) : [...s.managementIds, id],
    });
  };
  const [order] = useState(() =>
    [...c.managementOptions].sort(() => Math.random() - 0.5)
  );

  return (
    <div className="card">
      <h2>Your initial plan</h2>
      <p className="sub" style={{ margin: "6px 0 14px" }}>
        Select what you would actually do first. Two patients with the same diagnosis do not get the
        same plan — this one told you what she wants.
      </p>
      {order.map((m) => {
        const on = s.managementIds.includes(m.id);
        return (
          <button
            key={m.id}
            className={`option ${on ? "picked" : ""}`}
            onClick={() => toggle(m.id)}
            aria-pressed={on}
          >
            <span className={`check ${on ? "on" : ""}`} aria-hidden="true">
              {on ? "✓" : ""}
            </span>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
