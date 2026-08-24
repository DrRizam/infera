import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { shuffleSeed } from "@/lib/caseEngine";
import { playFeedback } from "@/lib/sound";
import { cn } from "@/lib/utils";

function HistoryQuestion({ caseId, question, picked, onPick }) {
  const order = useMemo(
    () => shuffleSeed(question.options.map((_, i) => i), `${caseId}:${question.id}`),
    [caseId, question]
  );
  const answered = picked !== undefined;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {question.context && (
        <div className="mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Your goal</p>
          <p className="text-sm">{question.context}</p>
        </div>
      )}
      <p className="mb-2 text-sm font-semibold text-muted-foreground">Pick the question that gets you there:</p>
      <div className="space-y-2">
        {order.map((origIdx) => (
          <button
            key={origIdx}
            disabled={answered}
            onClick={() => {
              playFeedback(origIdx === question.correct);
              onPick(origIdx);
            }}
            className={cn(
              "block w-full rounded-md border px-3 py-2 text-left text-sm",
              answered && origIdx === question.correct && "border-emerald-500 bg-emerald-50",
              answered && origIdx === picked && origIdx !== question.correct && "border-destructive bg-destructive/10",
              !answered && "border-border hover:border-primary"
            )}
          >
            {question.options[origIdx]}
          </button>
        ))}
      </div>
      {answered && (
        <div className="mt-3 space-y-1.5 rounded-md bg-muted p-2 text-sm">
          <p className="italic">"{question.answer}"</p>
          {question.rationale && <p className="text-xs text-muted-foreground">{question.rationale}</p>}
        </div>
      )}
    </div>
  );
}

export default function HistoryStage({ clinicalCase, answers, onPick, onContinue }) {
  const questions = clinicalCase.history_questions;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <HistoryQuestion
          key={q.id}
          caseId={clinicalCase.id}
          question={q}
          picked={answers[q.id]}
          onPick={(idx) => onPick(q.id, idx)}
        />
      ))}
      <Button className="w-full" disabled={!allAnswered} onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
