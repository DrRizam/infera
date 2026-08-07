import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function colorFor(score) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-orange-500";
}

/** Sorted subject -> mastery bars, weakest first so it doubles as a study prompt. */
export default function MasteryBars({ mastery }) {
  const entries = Object.entries(mastery || {}).sort((a, b) => a[1] - b[1]);

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">Complete a case to start building mastery.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([subject, score]) => (
        <div key={subject}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold">{subject}</span>
            <span className="text-muted-foreground">{score}%</span>
          </div>
          <Progress value={score} indicatorClassName={cn(colorFor(score))} />
        </div>
      ))}
    </div>
  );
}
