import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bone, CheckCircle2, Lock, Trophy } from "lucide-react";
import { MUSCLES } from "@/data/muscles";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { buildAnatomyPool, pickQuiz } from "@/lib/anatomyQuiz";
import { todayStr } from "@/lib/gamification";
import { ensureDrillPeriodFresh, hasDrillsRemaining } from "@/lib/subscription";
import { playFeedback } from "@/lib/sound";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUIZ_LENGTH = 10;

function MuscleImage({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted text-center text-xs font-semibold text-muted-foreground">
        Muscle image pending
        <br />
        (add public/anatomy/{src || "…"})
      </div>
    );
  }
  return (
    <img
      src={`/anatomy/${src}`}
      alt="Muscle to identify"
      onError={() => setFailed(true)}
      className="mx-auto max-h-64 w-full rounded-xl border-2 border-border object-contain"
    />
  );
}

export default function AnatomyQuiz() {
  useDocumentTitle("Anatomy quiz");
  const { profile, setProfile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const pool = useMemo(() => buildAnatomyPool(MUSCLES), []);
  const drillAllowed = hasDrillsRemaining(ensureDrillPeriodFresh(profile, todayStr()), user);

  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const start = () => {
    if (!drillAllowed) return;
    setProfile((prev) => {
      const fresh = ensureDrillPeriodFresh(prev, todayStr());
      return { ...fresh, drill_count: (fresh.drill_count || 0) + 1 };
    });
    setQuestions(pickQuiz(pool, { count: QUIZ_LENGTH }));
    setIdx(0);
    setPicked(null);
    setCorrect(0);
    setFinished(false);
    setStarted(true);
  };

  const answer = (i) => {
    if (picked !== null) return;
    setPicked(i);
    const isCorrect = i === questions[idx].correct;
    playFeedback(isCorrect);
    if (isCorrect) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (idx + 1 >= questions.length) setFinished(true);
    else {
      setIdx((n) => n + 1);
      setPicked(null);
    }
  };

  if (!started && !drillAllowed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Lock className="mx-auto mb-2 h-6 w-6 text-primary" />
        <h1 className="text-xl font-black tracking-tight">Daily drills used up</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The anatomy quiz shares the daily drill limit with Recall and Speed round — Premium unlocks unlimited.
          Cases and the daily game stay free.
        </p>
        <Button className="mt-4" onClick={() => navigate("/settings")}>
          See upgrade options
        </Button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center space-y-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Bone className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Anatomy quiz</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {QUIZ_LENGTH} questions on the muscles that matter clinically — identify it, its action, its nerve, its
          spinal levels.
        </p>
        <Button size="lg" onClick={start}>
          Start
        </Button>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="flex flex-col items-center space-y-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          {correct} / {questions.length}
        </h1>
        <p className="text-sm text-muted-foreground">{pct}% this round</p>
        {drillAllowed ? (
          <Button size="lg" onClick={start}>
            Play again
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">That was your last free drill for today.</p>
            <Button size="lg" onClick={() => navigate("/settings")}>
              See upgrade options
            </Button>
          </div>
        )}
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>
          Question {idx + 1} of {questions.length}
        </span>
        <span className="status-pill text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {correct}
        </span>
      </div>

      {q.type === "identify" && <MuscleImage src={q.image} />}

      <p className="font-semibold">{q.prompt}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => answer(i)}
            disabled={picked !== null}
            className={cn(
              "block w-full rounded-xl border-2 px-4 py-3 text-left text-sm",
              picked !== null && i === q.correct && "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
              picked === i && i !== q.correct && "border-destructive bg-destructive/10",
              picked === null && "border-border bg-card hover:border-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {picked !== null && (
        <div className="rounded-xl border border-border bg-muted p-3 text-sm">
          <p className="text-xs text-muted-foreground">{q.explain}</p>
          <Button className="mt-3 w-full" onClick={next}>
            {idx + 1 >= questions.length ? "See score" : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}
