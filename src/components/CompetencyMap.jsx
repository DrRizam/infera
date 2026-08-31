import { useState } from "react";
import { Trophy } from "lucide-react";
import { describeCompetencyBucket } from "@/lib/competency";
import { cn } from "@/lib/utils";

// Each module × skill-type bucket earns a tier by score. Kept as an
// achievement showcase (best first); the "what to work on next" prompt
// lives on the dashboard.
const TIERS = [
  { min: 80, name: "Gold", icon: "text-amber-500", card: "border-amber-500/30 bg-amber-500/10" },
  { min: 50, name: "Silver", icon: "text-slate-400", card: "border-slate-400/30 bg-slate-400/10" },
  { min: 0, name: "Bronze", icon: "text-orange-800/70", card: "border-orange-500/30 bg-orange-500/10" },
];
const tierFor = (score) => TIERS.find((t) => score >= t.min);

const PREVIEW_COUNT = 4;

export default function CompetencyMap({ competency }) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(competency || {}).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Complete a case or recall drill to start building your competency map.
      </p>
    );
  }

  const shown = expanded ? entries : entries.slice(0, PREVIEW_COUNT);

  return (
    <div className="space-y-2">
      {shown.map(([key, score]) => {
        const { label } = describeCompetencyBucket(key);
        const tier = tierFor(score);
        return (
          <div
            key={key}
            className={cn("flex items-center gap-3 rounded-xl border-2 px-3 py-2", tier.card)}
          >
            <Trophy className={cn("h-5 w-5 shrink-0", tier.icon)} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {tier.name}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
              {score}%
            </span>
          </div>
        );
      })}

      {entries.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full rounded-lg py-1.5 text-xs font-bold text-primary transition-colors hover:bg-muted"
        >
          {expanded ? "Show less" : `Show all ${entries.length}`}
        </button>
      )}
    </div>
  );
}
