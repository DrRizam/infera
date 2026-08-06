import { useEffect, useMemo, useState } from "react";
import type { ClinicalCase } from "../../cases/schema";
import type { Profile } from "../../types";
import {
  CASE_STAGES,
  STAGE_LABELS,
  canAdvance,
  clearEncounter,
  createEncounter,
  nextStage,
  saveEncounter,
  stageIndex,
  type EncounterState,
} from "../../engine/case/encounter";
import { scoreEncounter } from "../../engine/case/scoring";
import { generateReviewCards } from "../../engine/case/reviewCards";
import { fromCaseCards } from "../../engine/reviewQueue";
import { addXp, touchStreak } from "../../engine/store";
import DifferentialBuilder from "./DifferentialBuilder";
import Debrief from "./Debrief";
import {
  DiagnosisStage,
  DispositionStage,
  ExaminationStage,
  InterpretationStage,
  ManagementStage,
  PresentationStage,
  RedFlagStage,
  SubjectiveStage,
} from "./stages";

/**
 * Orchestrates one patient encounter. Holds the encounter state and routes to
 * the stage component; every decision about progression, scoring and feedback
 * is delegated to engine/case/ so this file stays a shell.
 */
export default function CaseEncounter({
  clinicalCase: c,
  profile,
  setProfile,
  resume,
  onExit,
}: {
  clinicalCase: ClinicalCase;
  profile: Profile;
  setProfile: (p: Profile) => void;
  resume?: EncounterState | null;
  onExit: () => void;
}) {
  const [s, setS] = useState<EncounterState>(
    () => resume ?? createEncounter(c.id)
  );
  const [committed, setCommitted] = useState(false);

  // Mirror to storage after every change — a 12-minute encounter will be
  // interrupted, and losing it would be worse than not offering it.
  useEffect(() => {
    if (!s.completedAt) saveEncounter(s);
  }, [s]);

  const update = (patch: Partial<EncounterState>) => setS((prev) => ({ ...prev, ...patch }));

  const score = useMemo(() => scoreEncounter(c, s), [c, s]);
  const cards = useMemo(
    () => (s.stage === "feedback" ? generateReviewCards(c, s, score) : []),
    [c, s, score]
  );

  const advance = () => {
    const target = nextStage(s.stage);
    // Seed the updated differential from the initial one so the learner edits
    // their own reasoning rather than rebuilding it from scratch.
    if (target === "differential-updated" && s.updatedDifferential.length === 0) {
      setS((p) => ({ ...p, stage: target, updatedDifferential: [...p.initialDifferential] }));
      return;
    }
    if (target === "feedback") {
      commit();
      return;
    }
    update({ stage: target });
  };

  const commit = () => {
    const finished: EncounterState = { ...s, stage: "feedback", completedAt: new Date().toISOString() };
    setS(finished);
    setCommitted(true);
    clearEncounter();

    const final = scoreEncounter(c, finished);
    const cards = generateReviewCards(c, finished, final);
    const xp = Math.round(final.overall / 2);
    let next = touchStreak(addXp(profile, xp));
    next = {
      ...next,
      caseResults: [
        ...next.caseResults.filter((r) => r.caseId !== c.id),
        {
          caseId: c.id,
          completedAt: finished.completedAt!,
          scores: {
            reasoning: final.dimensions.differential.score ?? 0,
            redFlag: final.dimensions.safety.score ?? 0,
            evidence: final.dimensions.interpretation.score ?? 0,
          },
          xp,
        },
      ],
      reviewItems: {
        ...next.reviewItems,
        ...Object.fromEntries(fromCaseCards(cards).map((item) => [item.id, item])),
      },
    };
    setProfile(next);
  };

  const idx = stageIndex(s.stage);
  const total = CASE_STAGES.length - 1;
  const ready = canAdvance(s, c);

  const stageProps = { c, s, update };

  return (
    <div className="app">
      <div className="progress-wrap">
        <button className="quit" onClick={onExit} aria-label="Leave this encounter — your progress is saved">
          ✕
        </button>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={idx}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`Encounter progress: ${STAGE_LABELS[s.stage]}`}
        >
          <div className="progress-fill" style={{ width: `${(idx / total) * 100}%` }} />
        </div>
        {/* The patient's complaint, never the diagnosis. */}
        <div className="progress-label">{STAGE_LABELS[s.stage]}</div>
      </div>

      {s.stage !== "feedback" && (
        <div className="encounter-banner">
          <span className="encounter-complaint">{c.presentingComplaint}</span>
          <span className="sub">
            {c.patient.age}
            {c.patient.sex[0]} · step {idx + 1} of {total}
          </span>
        </div>
      )}

      {s.stage === "presentation" && <PresentationStage {...stageProps} />}
      {s.stage === "subjective" && <SubjectiveStage {...stageProps} />}
      {s.stage === "red-flags" && <RedFlagStage {...stageProps} />}

      {s.stage === "differential-initial" && (
        <div className="card">
          <h2>What are you considering?</h2>
          <p className="sub" style={{ margin: "6px 0 14px" }}>
            List at least three diagnoses and say how likely you think each is. You will get to
            revise this after examining — the point is to commit to something first, so you can see
            whether the examination changed your mind.
          </p>
          <DifferentialBuilder
            options={c.differentials}
            value={s.initialDifferential}
            onChange={(initialDifferential) => update({ initialDifferential })}
          />
        </div>
      )}

      {s.stage === "examination" && <ExaminationStage {...stageProps} />}
      {s.stage === "interpretation" && <InterpretationStage {...stageProps} />}

      {s.stage === "differential-updated" && (
        <div className="card">
          <h2>Revise your differential</h2>
          <p className="sub" style={{ margin: "6px 0 14px" }}>
            Your findings should have moved something. Adjust the order and the percentages to match
            what you now believe — leaving it untouched is itself an answer, and it will be scored.
          </p>
          <DifferentialBuilder
            options={c.differentials}
            value={s.updatedDifferential}
            onChange={(updatedDifferential) => update({ updatedDifferential })}
          />
        </div>
      )}

      {s.stage === "diagnosis" && <DiagnosisStage {...stageProps} />}
      {s.stage === "disposition" && <DispositionStage {...stageProps} />}
      {s.stage === "management" && <ManagementStage {...stageProps} />}

      {s.stage === "feedback" && committed && (
        <Debrief c={c} s={s} score={score} cards={cards} onFinish={onExit} />
      )}

      {s.stage !== "feedback" && (
        <div className="stage-actions">
          <button className="big-btn" onClick={advance} disabled={!ready}>
            {nextStage(s.stage) === "feedback" ? "Commit and see the debrief" : "Continue"}
          </button>
          {!ready && (
            <p className="sub stage-hint" role="status">
              {hintFor(s, c)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function hintFor(s: EncounterState, c: ClinicalCase): string {
  switch (s.stage) {
    case "subjective":
      return "Ask at least one question before moving on.";
    case "differential-initial":
    case "differential-updated":
      return "You need at least three diagnoses, and your confidence percentages must total 100.";
    case "examination":
      return "Perform at least one examination, or you will have nothing to interpret.";
    case "diagnosis":
      return "Choose the diagnosis you are working to.";
    case "disposition":
      return "Decide what happens to this patient now.";
    case "management":
      return "Select at least one thing you would actually do.";
    default:
      return "";
  }
}
