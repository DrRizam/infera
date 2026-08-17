import { Check, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Staggered vertical path of case nodes, strictly sequential: a case stays
 * locked until the one directly above it in the list is completed. When
 * called with cases from multiple modules at once (as Home does, showing
 * every module in one path), the chain still runs top to bottom across all
 * of them rather than per-module, so the lock state always matches what's
 * visually above/below a given node.
 */
export default function CasePath({ cases, progressByCaseId, onOpen }) {
  const sorted = [...cases].sort((a, b) => (a.order || 0) - (b.order || 0));
  let unlocked = true;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {sorted.map((c, i) => {
        const progress = progressByCaseId?.[c.id];
        const done = progress?.status === "completed";
        const inProgress = progress?.status === "in_progress";
        const locked = !unlocked;
        if (!done) unlocked = false;

        return (
          <button
            key={c.id}
            disabled={locked}
            onClick={() => onOpen(c.id)}
            title={c.title}
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-sm transition-transform hover:scale-105",
              i % 2 === 0 ? "-translate-x-6" : "translate-x-6",
              done && "bg-emerald-100 border-emerald-500 text-emerald-700",
              inProgress && "bg-amber-100 border-amber-500 text-amber-700",
              locked && "bg-muted border-border text-muted-foreground cursor-not-allowed hover:scale-100",
              !done && !inProgress && !locked && "bg-primary/10 border-primary text-primary"
            )}
          >
            {locked ? (
              <Lock className="h-5 w-5" />
            ) : done ? (
              <Check className="h-6 w-6" />
            ) : (
              <span className="text-sm font-extrabold">{i + 1}</span>
            )}
            {done && progress?.accuracy >= 90 && (
              <Star className="absolute -top-2 -right-1 h-5 w-5 fill-amber-400 text-amber-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
