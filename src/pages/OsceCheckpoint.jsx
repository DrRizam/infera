import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Lock } from "lucide-react";
import { CASES } from "@/data/cases";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { buildCaseStages, scoreEncounter } from "@/lib/caseEngine";
import { levelFromXp } from "@/lib/gamification";
import { MODULES } from "@/lib/modules";
import { isAdmin, isPremium } from "@/lib/subscription";
import { OSCE_TIME_BUDGET_SECONDS, scoreOsceSession, selectOsceCases, xpForOsceSession } from "@/lib/osce";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import CaseStageHeader from "@/components/case/CaseStageHeader";
import PresentationStage from "@/components/case/PresentationStage";
import HistoryStage from "@/components/case/HistoryStage";
import RedFlagStage from "@/components/case/RedFlagStage";
import DifferentialStage from "@/components/case/DifferentialStage";
import ExaminationStage from "@/components/case/ExaminationStage";
import DispositionStage from "@/components/case/DispositionStage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMPTY_ANSWERS = {
  history: {},
  redFlags: [],
  differentialRanking: [],
  examinations: [],
  disposition: null,
  dispositionConfidence: null,
};

function formatClock(totalSeconds) {
  const over = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${over ? "+" : ""}${m}:${String(s).padStart(2, "0")}`;
}

export default function OsceCheckpoint() {
  useDocumentTitle("OSCE Checkpoint");
  const { profile, setProfile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const hasAccess = isAdmin(user) || isPremium(profile);

  const [stage, setStage] = useState("picker"); // "picker" | "running" | "results"
  const [moduleId, setModuleId] = useState(null);
  const [osceCases, setOsceCases] = useState([]);
  const [caseIdx, setCaseIdx] = useState(0);
  const [caseStageIdx, setCaseStageIdx] = useState(0);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [caseResults, setCaseResults] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(OSCE_TIME_BUDGET_SECONDS);
  const [awardedXp, setAwardedXp] = useState(0);

  // Non-punitive: keeps ticking past zero into "+" overtime instead of
  // ending the session — the timer is for exam-realism, not a hard cutoff.
  useEffect(() => {
    if (stage !== "running") return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, secondsLeft]);

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-primary" />
        <h1 className="text-2xl font-black tracking-tight">OSCE Checkpoint</h1>
        <p className="text-sm text-muted-foreground">
          Bundle a few cases into one timed, graded assessment, scored as a whole instead of one at a time — a
          Premium feature.
        </p>
        <Button onClick={() => navigate("/settings")}>See upgrade options</Button>
      </div>
    );
  }

  const startCheckpoint = () => {
    const picked = selectOsceCases(CASES, moduleId);
    setOsceCases(picked);
    setCaseIdx(0);
    setCaseStageIdx(0);
    setAnswers(EMPTY_ANSWERS);
    setCaseResults([]);
    setSecondsLeft(OSCE_TIME_BUDGET_SECONDS);
    setStage("running");
  };

  const clinicalCase = osceCases[caseIdx];
  const caseStageList = clinicalCase ? buildCaseStages(clinicalCase) : [];
  const caseStageName = caseStageList[caseStageIdx];
  const isLastCase = caseIdx + 1 >= osceCases.length;
  const advanceCaseStage = () => setCaseStageIdx((i) => Math.min(i + 1, caseStageList.length - 1));

  const finalizeCase = () => {
    const scored = scoreEncounter(answers, clinicalCase);
    const nextResults = [...caseResults, { caseId: clinicalCase.id, diagnosis: clinicalCase.diagnosis, accuracy: scored.accuracy }];
    setCaseResults(nextResults);

    if (isLastCase) {
      const { overallAccuracy } = scoreOsceSession(nextResults);
      const xp = xpForOsceSession(overallAccuracy);
      setAwardedXp(xp);
      setProfile((prev) => {
        const xpTotal = (prev.xp || 0) + xp;
        return { ...prev, xp: xpTotal, daily_xp: (prev.daily_xp || 0) + xp, level: levelFromXp(xpTotal).level };
      });
      setStage("results");
    } else {
      setCaseIdx((i) => i + 1);
      setCaseStageIdx(0);
      setAnswers(EMPTY_ANSWERS);
    }
  };

  if (stage === "picker") {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">OSCE Checkpoint</h1>
            <p className="text-sm text-muted-foreground">3 cases, back to back, one graded result at the end.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pick a focus</CardTitle>
            <CardDescription>Mixed pulls from every module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {MODULES.map((m) => {
                const Icon = m.icon;
                const selected = moduleId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModuleId(m.id)}
                    className={cn(
                      `flex flex-col items-center gap-1 rounded-lg bg-gradient-to-br ${m.color} p-3 text-white`,
                      selected && "ring-2 ring-offset-2 ring-primary"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-center text-[11px] font-bold leading-tight">{m.name}</span>
                  </button>
                );
              })}
            </div>
            <Button variant={moduleId === null ? "default" : "outline"} className="w-full" onClick={() => setModuleId(null)}>
              Mixed
            </Button>
            <Button className="w-full" onClick={startCheckpoint}>
              Start checkpoint
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "results") {
    const { overallAccuracy, passed } = scoreOsceSession(caseResults);
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Card className={passed ? "border-emerald-500" : "border-destructive/40"}>
          <CardHeader>
            <CardTitle>{passed ? "Checkpoint passed" : "Checkpoint complete"}</CardTitle>
            <CardDescription>{overallAccuracy}% overall, averaged across {caseResults.length} cases.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {caseResults.map((r) => (
              <div key={r.caseId} className="flex items-center justify-between rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm">
                <span className="font-semibold">{r.diagnosis}</span>
                <span className="font-bold text-primary">{r.accuracy}%</span>
              </div>
            ))}
            <div className="pt-2 text-center text-sm font-bold text-primary">+{awardedXp} XP</div>
            <Button className="w-full" onClick={() => navigate("/")}>
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // stage === "running"
  return (
    <div className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>
          Case {caseIdx + 1} of {osceCases.length}
        </span>
        <span className={cn(secondsLeft < 0 && "text-amber-600")}>{formatClock(secondsLeft)}</span>
      </div>

      <CaseStageHeader clinicalCase={clinicalCase} stageIndex={caseStageIdx} stageCount={caseStageList.length} />

      {caseStageName === "presentation" && <PresentationStage clinicalCase={clinicalCase} onContinue={advanceCaseStage} />}

      {caseStageName === "history" && (
        <HistoryStage
          clinicalCase={clinicalCase}
          answers={answers.history}
          onPick={(qId, idx) => setAnswers((a) => ({ ...a, history: { ...a.history, [qId]: idx } }))}
          onContinue={advanceCaseStage}
        />
      )}

      {caseStageName === "red_flags" && (
        <RedFlagStage
          clinicalCase={clinicalCase}
          selected={answers.redFlags}
          onToggle={(id) =>
            setAnswers((a) => ({
              ...a,
              redFlags: a.redFlags.includes(id) ? a.redFlags.filter((x) => x !== id) : [...a.redFlags, id],
            }))
          }
          onContinue={advanceCaseStage}
        />
      )}

      {caseStageName === "differential" && (
        <DifferentialStage
          clinicalCase={clinicalCase}
          ranking={answers.differentialRanking}
          onSetRanking={(order) => setAnswers((a) => ({ ...a, differentialRanking: order }))}
          onContinue={(order) => {
            setAnswers((a) => ({ ...a, differentialRanking: order }));
            advanceCaseStage();
          }}
        />
      )}

      {caseStageName === "examination" && (
        <ExaminationStage
          clinicalCase={clinicalCase}
          selected={answers.examinations}
          onToggle={(id) =>
            setAnswers((a) => ({
              ...a,
              examinations: a.examinations.includes(id) ? a.examinations.filter((x) => x !== id) : [...a.examinations, id],
            }))
          }
          onContinue={advanceCaseStage}
        />
      )}

      {caseStageName === "disposition" && (
        <DispositionStage
          clinicalCase={clinicalCase}
          choice={answers.disposition}
          confidence={answers.dispositionConfidence}
          onChoose={(id) => setAnswers((a) => ({ ...a, disposition: id }))}
          onSetConfidence={(value) => setAnswers((a) => ({ ...a, dispositionConfidence: value }))}
          onSubmit={finalizeCase}
          submitLabel={isLastCase ? "Finish checkpoint" : "Next case"}
        />
      )}
    </div>
  );
}
