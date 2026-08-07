import { Check, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Staggered vertical path of case nodes. A case unlocks once the previous
 * one *in the same module* is completed — locking is per-module, not
 * across the whole list, so an unrelated module (e.g. cardio) isn't gated
 * behind finishing an earlier one (e.g. spine) just because both happen to
 * be rendered in one path (as Home does, showing every module at once).
 */
export default function CasePath({ cases, progressByCaseId, onOpen }) {
  const sorted = [...cases].sort((a, b) => (a.order || 0) - (b.order || 0));
  const unlockedByModule = {};

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {sorted.map((c, i) => {
        const progress = progressByCaseId?.[c.id];
        const done = progress?.status === "completed";
        const inProgress = progress?.status === "in_progress";
        const moduleKey = c.module || "_";
        if (!(moduleKey in unlockedByModule)) unlockedByModule[moduleKey] = true;
        const locked = !unlockedByModule[moduleKey];
        if (!done) unlockedByModule[moduleKey] = false;

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
