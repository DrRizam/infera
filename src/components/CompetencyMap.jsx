import { Progress } from "@/components/ui/progress";
import { describeCompetencyBucket } from "@/lib/competency";
import { cn } from "@/lib/utils";

function colorFor(score) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-orange-500";
}

/** Sorted weakest-first, per module x skill-type — doubles as a study prompt. */
export default function CompetencyMap({ competency }) {
  const entries = Object.entries(competency || {}).sort((a, b) => a[1] - b[1]);

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">Complete a case or recall drill to start building your competency map.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, score]) => {
        const { label } = describeCompetencyBucket(key);
        return (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold">{label}</span>
              <span className="text-muted-foreground">{score}%</span>
            </div>
            <Progress value={score} indicatorClassName={cn(colorFor(score))} />
          </div>
        );
      })}
    </div>
  );
}
