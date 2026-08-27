import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getCase } from "@/data/cases";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { buildCaseStages, scoreEncounter } from "@/lib/caseEngine";
import { buildCaseAttemptRow } from "@/lib/caseAttempts";
import { BREAKDOWN_TO_BUCKET_TYPE, bucketKey } from "@/lib/competency";
import { createNotification } from "@/lib/notifications";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import {
  classifyCalibration,
  ensureDailyFresh,
  formatElapsedTime,
  levelFromXp,
  nextReviewDate,
  rollStreak,
  rollSurpriseChest,
  todayStr,
  updateCalibration,
  updateMastery,
  xpForCase,
} from "@/lib/gamification";
import { ensureDebriefPeriodFresh, hasFullDebriefsRemaining, isPremium } from "@/lib/subscription";
import { useRewardedAd } from "@/lib/useRewardedAd";
import { Capacitor } from "@capacitor/core";
import CaseStageHeader from "@/components/case/CaseStageHeader";
import PresentationStage from "@/components/case/PresentationStage";
import HistoryStage from "@/components/case/HistoryStage";
import RedFlagStage from "@/components/case/RedFlagStage";
import DifferentialStage from "@/components/case/DifferentialStage";
import ExaminationStage from "@/components/case/ExaminationStage";
import DispositionStage from "@/components/case/DispositionStage";
import CaseDebrief from "@/components/case/CaseDebrief";

const EMPTY_ANSWERS = {
  history: {},
  redFlags: [],
  differentialRanking: [],
  examinations: [],
  disposition: null,
  dispositionConfidence: null,
};

export default function CasePlay() {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const isDaily = searchParams.get("daily") === "1";
  // Condition-of-the-day flow: startedAt carries the timestamp from when
  // the user began reading the "Learn about X" screen, so the timer shown
  // here (and the total logged at the debrief) covers learning + practice.
  const isCotd = searchParams.get("cotd") === "1";
  const cotdStartedAt = searchParams.get("startedAt");
  const { profile, setProfile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const rewardedAd = useRewardedAd();

  const clinicalCase = useMemo(() => getCase(caseId), [caseId]);
  useDocumentTitle(clinicalCase?.title || "Case");

  const stages = useMemo(() => {
    if (!clinicalCase) return [];
    return [...buildCaseStages(clinicalCase), "debrief"];
  }, [clinicalCase]);

  const [stageIdx, setStageIdx] = useState(0);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [result, setResult] = useState(null);
  const [cotdElapsedMs, setCotdElapsedMs] = useState(0);

  useEffect(() => {
    if (!isCotd || !cotdStartedAt) return;
    const tick = () => setCotdElapsedMs(Date.now() - Number(cotdStartedAt));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [isCotd, cotdStartedAt]);

  if (!clinicalCase) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-sm text-muted-foreground">Case not found.</p>
      </div>
    );
  }

  const stage = stages[stageIdx];
  const advance = () => setStageIdx((i) => Math.min(i + 1, stages.length - 1));

  const finalize = (finalAnswers) => {
    const scored = scoreEncounter(finalAnswers, clinicalCase);
    const rawXp = xpForCase(clinicalCase.xp_reward || 40, scored.accuracy);
    const baseXp = Math.round(rawXp * (isDaily ? 1.5 : 1));
    const surpriseChest = rollSurpriseChest();
    const xp = baseXp + (surpriseChest?.bonusXp || 0);

    let next = ensureDailyFresh(profile, todayStr());
    const { profile: streaked, shieldUsed } = rollStreak(next, todayStr());
    next = streaked;
    next = ensureDebriefPeriodFresh(next);
    // Decided before the counter increments below, so hitting the cap on
    // THIS case still shows the limited debrief rather than the full one.
    const debriefAllowed = hasFullDebriefsRemaining(next, user);
    const prevLevel = levelFromXp(next.xp).level;

    const prevProgress = next.caseProgress?.[clinicalCase.id];
    const attempts = (prevProgress?.attempts || 0) + 1;

    let competency = next.competency || {};
    for (const [dim, pct] of Object.entries(scored.breakdown)) {
      const bucketType = BREAKDOWN_TO_BUCKET_TYPE[dim];
      if (bucketType) competency = updateMastery(competency, bucketKey(clinicalCase.module, bucketType), pct);
    }

    let calibration = next.calibration;
    if (finalAnswers.dispositionConfidence != null) {
      const wasCorrect = scored.breakdown.disposition === 100;
      calibration = updateCalibration(calibration, classifyCalibration(finalAnswers.dispositionConfidence, wasCorrect));
    }

    next = {
      ...next,
      xp: next.xp + xp,
      daily_xp: next.daily_xp + xp,
      mastery: updateMastery(next.mastery, clinicalCase.subject, scored.accuracy),
      competency,
      calibration,
      total_cases_completed: (next.total_cases_completed || 0) + 1,
      perfect_cases: (next.perfect_cases || 0) + (scored.accuracy >= 100 ? 1 : 0),
      debrief_count: (next.debrief_count || 0) + (debriefAllowed ? 1 : 0),
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

    if (leveledUp) {
      const { title } = levelFromXp(next.xp);
      createNotification(user.id, { type: "level_up", title: "Level up!", body: `You're now a ${title}.` });
    }

    const cotdElapsedLabel = isCotd && cotdStartedAt ? formatElapsedTime(Date.now() - Number(cotdStartedAt)) : null;
    setResult({ scored, xp, shieldUsed, leveledUp, streak: next.streak_count, debriefLimited: !debriefAllowed, surpriseChest, cotdElapsedLabel });
    setStageIdx(stages.length - 1);
  };

  // Rewarded-ad unlock for a limited debrief — grants +1 debrief for the
  // rest of the month (see debrief_bonus_count in subscription.js) and
  // unlocks the debrief already on screen immediately, no reload needed.
  const canWatchAdForDebrief = Capacitor.isNativePlatform() && !isPremium(profile);
  const handleWatchAdForDebrief = async () => {
    const earned = await rewardedAd.show();
    if (!earned) return;
    setProfile((prev) => ({ ...prev, debrief_bonus_count: (prev.debrief_bonus_count || 0) + 1 }));
    setResult((prev) => (prev ? { ...prev, debriefLimited: false } : prev));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {isCotd && (
        <div className="mb-2 flex justify-end">
          <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-primary">
            ⏱ {formatElapsedTime(cotdElapsedMs)}
          </span>
        </div>
      )}
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
          confidence={answers.dispositionConfidence}
          onChoose={(id) => setAnswers((a) => ({ ...a, disposition: id }))}
          onSetConfidence={(value) => setAnswers((a) => ({ ...a, dispositionConfidence: value }))}
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
          debriefLimited={result.debriefLimited}
          surpriseChest={result.surpriseChest}
          cotdElapsedLabel={result.cotdElapsedLabel}
          canWatchAdForDebrief={canWatchAdForDebrief && rewardedAd.ready}
          onWatchAd={handleWatchAdForDebrief}
          onDone={() => navigate("/home")}
          onUpgrade={() => navigate("/settings")}
        />
      )}
    </div>
  );
}
