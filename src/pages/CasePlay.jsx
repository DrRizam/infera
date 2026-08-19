import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { HeartCrack } from "lucide-react";
import { getCase } from "@/data/cases";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { scoreEncounter } from "@/lib/caseEngine";
import { buildCaseAttemptRow } from "@/lib/caseAttempts";
import { BREAKDOWN_TO_BUCKET_TYPE, bucketKey } from "@/lib/competency";
import { Button } from "@/components/ui/button";
import {
  ensureDailyFresh,
  heartsAfterCase,
  levelFromXp,
  nextReviewDate,
  rollStreak,
  todayStr,
  updateMastery,
  xpForCase,
} from "@/lib/gamification";
import CaseStageHeader from "@/components/case/CaseStageHeader";
import PresentationStage from "@/components/case/PresentationStage";
import HistoryStage from "@/components/case/HistoryStage";
import RedFlagStage from "@/components/case/RedFlagStage";
import DifferentialStage from "@/components/case/DifferentialStage";
import ExaminationStage from "@/components/case/ExaminationStage";
import DispositionStage from "@/components/case/DispositionStage";
import CaseDebrief from "@/components/case/CaseDebrief";

const EMPTY_ANSWERS = { history: {}, redFlags: [], differentialRanking: [], examinations: [], disposition: null };

export default function CasePlay() {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const isDaily = searchParams.get("daily") === "1";
  const { profile, setProfile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const clinicalCase = useMemo(() => getCase(caseId), [caseId]);

  // Skip stages a case has no content for.
  const stages = useMemo(() => {
    if (!clinicalCase) return [];
    const list = ["presentation"];
    if (clinicalCase.history_questions?.length) list.push("history");
    if (clinicalCase.red_flags?.length) list.push("red_flags");
    if (clinicalCase.differentials?.length) list.push("differential");
    if (clinicalCase.examinations?.length) list.push("examination");
    if (clinicalCase.disposition?.options?.length) list.push("disposition");
    list.push("debrief");
    return list;
  }, [clinicalCase]);

  const [stageIdx, setStageIdx] = useState(0);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [result, setResult] = useState(null);

  if (!clinicalCase) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-sm text-muted-foreground">Case not found.</p>
      </div>
    );
  }

  if ((profile.hearts ?? 5) <= 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4 px-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-rose-600">
          <HeartCrack className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Out of hearts</h1>
        <p className="text-sm text-muted-foreground">
          You're out of hearts for today — they refill tomorrow. The speed round doesn't cost hearts if you want to keep practicing.
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" className="sm:w-auto" onClick={() => navigate("/")}>
            Back to Learn
          </Button>
          <Button className="sm:w-auto" onClick={() => navigate("/speed")}>
            Speed round
          </Button>
        </div>
      </div>
    );
  }

  const stage = stages[stageIdx];
  const advance = () => setStageIdx((i) => Math.min(i + 1, stages.length - 1));

  const finalize = (finalAnswers) => {
    const scored = scoreEncounter(finalAnswers, clinicalCase);
    const rawXp = xpForCase(clinicalCase.xp_reward || 40, scored.accuracy);
    const xp = Math.round(rawXp * (isDaily ? 1.5 : 1));

    let next = ensureDailyFresh(profile, todayStr());
    const { profile: streaked, shieldUsed } = rollStreak(next, todayStr());
    next = streaked;
    const prevLevel = levelFromXp(next.xp).level;

    const prevProgress = next.caseProgress?.[clinicalCase.id];
    const attempts = (prevProgress?.attempts || 0) + 1;

    let competency = next.competency || {};
    for (const [dim, pct] of Object.entries(scored.breakdown)) {
      const bucketType = BREAKDOWN_TO_BUCKET_TYPE[dim];
      if (bucketType) competency = updateMastery(competency, bucketKey(clinicalCase.module, bucketType), pct);
    }

    next = {
      ...next,
      xp: next.xp + xp,
      daily_xp: next.daily_xp + xp,
      mastery: updateMastery(next.mastery, clinicalCase.subject, scored.accuracy),
      competency,
      total_cases_completed: (next.total_cases_completed || 0) + 1,
      perfect_cases: (next.perfect_cases || 0) + (scored.accuracy >= 100 ? 1 : 0),
      hearts: heartsAfterCase(next.hearts ?? 5, scored.accuracy),
      caseProgress: {
        ...next.caseProgress,
        [clinicalCase.id]: {
          status: "completed",
          accuracy: scored.accuracy,
          xp_earned: xp,
          attempts,
          completed_date: todayStr(),
          next_review_date: nextReviewDate(scored.accuracy, attempts),
          last_played_date: new Date().toISOString(),
        },
      },
    };
    next.level = levelFromXp(next.xp).level;
    const leveledUp = next.level > prevLevel;

    setProfile(next);

    // Dashboard telemetry only — never block or fail the debrief on this.
    supabase
      .from("case_attempts")
      .insert({ user_id: user.id, ...buildCaseAttemptRow(scored, clinicalCase, xp, attempts, isDaily) })
      .then(({ error }) => {
        if (error) console.error("Failed to record case attempt", error);
      });

    setResult({ scored, xp, shieldUsed, leveledUp, streak: next.streak_count });
    setStageIdx(stages.length - 1);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <CaseStageHeader clinicalCase={clinicalCase} stageIndex={stageIdx} stageCount={stages.length} />

      {stage === "presentation" && <PresentationStage clinicalCase={clinicalCase} onContinue={advance} />}

      {stage === "history" && (
        <HistoryStage
          clinicalCase={clinicalCase}
          answers={answers.history}
          onPick={(qId, idx) => setAnswers((a) => ({ ...a, history: { ...a.history, [qId]: idx } }))}
          onContinue={advance}
        />
      )}

      {stage === "red_flags" && (
        <RedFlagStage
          clinicalCase={clinicalCase}
          selected={answers.redFlags}
          onToggle={(id) =>
            setAnswers((a) => ({
              ...a,
              redFlags: a.redFlags.includes(id) ? a.redFlags.filter((x) => x !== id) : [...a.redFlags, id],
            }))
          }
          onContinue={advance}
        />
      )}

      {stage === "differential" && (
        <DifferentialStage
          clinicalCase={clinicalCase}
          ranking={answers.differentialRanking}
          onSetRanking={(order) => setAnswers((a) => ({ ...a, differentialRanking: order }))}
          onContinue={(order) => {
            setAnswers((a) => ({ ...a, differentialRanking: order }));
            advance();
          }}
        />
      )}

      {stage === "examination" && (
        <ExaminationStage
          clinicalCase={clinicalCase}
          selected={answers.examinations}
          onToggle={(id) =>
            setAnswers((a) => ({
              ...a,
              examinations: a.examinations.includes(id) ? a.examinations.filter((x) => x !== id) : [...a.examinations, id],
            }))
          }
          onContinue={advance}
        />
      )}

      {stage === "disposition" && (
        <DispositionStage
          clinicalCase={clinicalCase}
          choice={answers.disposition}
          onChoose={(id) => setAnswers((a) => ({ ...a, disposition: id }))}
          onSubmit={() => finalize(answers)}
        />
      )}

      {stage === "debrief" && result && (
        <CaseDebrief
          clinicalCase={clinicalCase}
          result={result.scored}
          xpEarned={result.xp}
          dailyBonus={isDaily}
          shieldUsed={result.shieldUsed}
          leveledUp={result.leveledUp}
          streak={result.streak}
          onDone={() => navigate("/")}
        />
      )}
    </div>
  );
}
