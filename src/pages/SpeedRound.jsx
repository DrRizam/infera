import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Timer, Trophy, Zap } from "lucide-react";
import { CASES } from "@/data/cases";
import { useProfile } from "@/lib/ProfileContext";
import { speedRoundTimerDelta } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROUND_SECONDS = 60;

export default function SpeedRound() {
  const { profile, setProfile } = useProfile();

  const pool = useMemo(
    () => CASES.flatMap((c) => (c.speed_questions || []).map((q) => ({ ...q, caseId: c.id }))),
    []
  );

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [order, setOrder] = useState([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (!started || finished) return;
    if (secondsLeft <= 0) {
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, finished, secondsLeft]);

  useEffect(() => {
    if (!finished) return;
    setProfile((prev) => ({
      ...prev,
      speed_rounds_played: (prev.speed_rounds_played || 0) + 1,
      best_speed_score: Math.max(prev.best_speed_score || 0, correct),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const start = () => {
    setOrder([...pool].sort(() => Math.random() - 0.5));
    setIdx(0);
    setCorrect(0);
    setCombo(0);
    setSecondsLeft(ROUND_SECONDS);
    setPicked(null);
    setFinished(false);
    setStarted(true);
  };

  const answer = (i) => {
    if (picked !== null) return;
    setPicked(i);
    const isCorrect = i === order[idx].correct;
    if (isCorrect) setCorrect((c) => c + 1);
    setCombo((prev) => {
      const next = isCorrect ? prev + 1 : 0;
      setSecondsLeft((s) => Math.max(0, s + speedRoundTimerDelta(isCorrect, next)));
      return next;
    });
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= order.length) setFinished(true);
      else setIdx((n) => n + 1);
    }, 500);
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center space-y-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Zap className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Speed round</h1>
        <p className="text-sm text-muted-foreground">Sixty seconds, as many as you can answer.</p>
        {pool.length ? (
          <Button size="lg" onClick={start}>
            Start
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">No speed questions available yet.</p>
        )}
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center space-y-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Time's up</h1>
        <p className="text-3xl font-extrabold text-primary">{correct} correct</p>
        <p className="text-sm text-muted-foreground">Best: {Math.max(profile.best_speed_score || 0, correct)}</p>
        <Button size="lg" onClick={start}>Play again</Button>
      </div>
    );
  }

  const q = order[idx];
  if (!q) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <span className="status-pill text-primary"><Timer className="h-3.5 w-3.5" />{secondsLeft}s</span>
        <span className="status-pill text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />{correct} correct</span>
      </div>
      <p className="font-semibold">{q.prompt}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => answer(i)}
            disabled={picked !== null}
            className={cn(
              "block w-full rounded-xl border-2 px-4 py-3 text-left text-sm",
              picked !== null && i === q.correct && "border-emerald-500 bg-emerald-50",
              picked === i && i !== q.correct && "border-destructive bg-destructive/10",
              picked === null && "border-border bg-card hover:border-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
