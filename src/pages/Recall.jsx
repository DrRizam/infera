import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Brain, CheckCircle2, XCircle } from "lucide-react";
import { CASES } from "@/data/cases";
import { useProfile } from "@/lib/ProfileContext";
import { getModule } from "@/lib/modules";
import { nextReviewDate, todayStr, updateMastery } from "@/lib/gamification";
import { generateRecallItems, selectRecallSession } from "@/lib/recallItems";
import { bucketKey } from "@/lib/competency";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const SESSION_SIZE = 8;

export default function Recall() {
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleFilter = searchParams.get("module") || undefined;

  const [session] = useState(() => {
    const items = generateRecallItems(CASES);
    return selectRecallSession(items, profile.itemProgress, { today: todayStr(), size: SESSION_SIZE, moduleFilter });
  });
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);

  if (!session.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">No recall items available yet.</p>
        <Button className="mt-4" onClick={() => navigate("/")}>Back to Learn</Button>
      </div>
    );
  }

  if (idx >= session.length) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4 px-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Brain className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Session complete</h1>
        <p className="text-3xl font-extrabold text-primary">{correct}/{session.length} correct</p>
        <p className="text-sm text-muted-foreground">
          Items you missed will resurface sooner than the ones you nailed.
        </p>
        <Button size="lg" onClick={() => navigate("/")}>Done</Button>
      </div>
    );
  }

  const item = session[idx];
  const mod = getModule(item.module);
  const answered = picked !== null;
  const isCorrect = answered && picked === item.correctIndex;

  const answer = (optionIdx) => {
    if (answered) return;
    const correct = optionIdx === item.correctIndex;
    const today = todayStr();
    setProfile((prev) => {
      const prevItem = prev.itemProgress?.[item.id];
      const attempts = (prevItem?.attempts || 0) + 1;
      return {
        ...prev,
        itemProgress: {
          ...prev.itemProgress,
          [item.id]: {
            last_result: correct ? "correct" : "incorrect",
            attempts,
            module: item.module,
            next_review_date: nextReviewDate(correct ? 100 : 30, attempts, today),
            last_played_date: new Date().toISOString(),
          },
        },
        competency: updateMastery(prev.competency, bucketKey(item.module, item.type), correct ? 100 : 0),
      };
    });
    setPicked(optionIdx);
    setResults((r) => [...r, correct]);
  };

  const next = () => {
    setPicked(null);
    setIdx((i) => i + 1);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Progress value={((idx + (answered ? 1 : 0)) / session.length) * 100} className="flex-1" />
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">{idx + 1}/{session.length}</span>
      </div>

      <div className="flex items-center gap-2">
        {mod && <mod.icon className="h-4 w-4 text-primary" />}
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{mod?.name || item.module}</span>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm">{item.vignette}</p>
      </div>

      <p className="font-semibold">{item.prompt}</p>

      <div className="space-y-2">
        {item.options.map((opt, i) => (
          <button
            key={i}
            disabled={answered}
            onClick={() => answer(i)}
            className={cn(
              "block w-full rounded-xl border-2 px-4 py-3 text-left text-sm",
              answered && i === item.correctIndex && "border-emerald-500 bg-emerald-50",
              answered && i === picked && i !== item.correctIndex && "border-destructive bg-destructive/10",
              !answered && "border-border bg-card hover:border-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {answered && (
        <div className={cn("rounded-xl border-2 p-4", isCorrect ? "border-emerald-500 bg-emerald-50" : "border-destructive bg-destructive/10")}>
          <div className="mb-1 flex items-center gap-2 font-bold">
            {isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
            {isCorrect ? "Correct" : "Not quite"}
          </div>
          {item.evidence && <p className="text-sm text-muted-foreground">{item.evidence}</p>}
        </div>
      )}

      {answered && (
        <Button className="w-full" onClick={next}>
          {idx + 1 === session.length ? "Finish" : "Next"}
        </Button>
      )}
    </div>
  );
}
