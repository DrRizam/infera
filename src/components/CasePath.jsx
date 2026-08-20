import { Check, Lock, Star } from "lucide-react";
import { getModule } from "@/lib/modules";
import { cn } from "@/lib/utils";

/**
 * Staggered vertical path of case nodes, strictly sequential: a case stays
 * locked until the one directly above it in the list is completed. When
 * called with cases from multiple modules at once (as Home does, showing
 * every module in one path), the chain still runs top to bottom across all
 * of them rather than per-module, so the lock state always matches what's
 * visually above/below a given node.
 */
// Demo padding: modules with only a couple of real cases still show a full
// path of locked nodes below them, so every module looks like it has a
// depth of content coming rather than visibly running out after one case.
// Purely cosmetic — these have no case behind them and never unlock.
const DEMO_MIN_NODES = 8;

export default function CasePath({ cases, progressByCaseId, onOpen }) {
  const sorted = [...cases].sort((a, b) => (a.order || 0) - (b.order || 0));
  const placeholderCount = Math.max(0, DEMO_MIN_NODES - sorted.length);
  let unlocked = true;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {sorted.map((c, i) => {
        const progress = progressByCaseId?.[c.id];
        const done = progress?.status === "completed";
        const inProgress = progress?.status === "in_progress";
        const locked = !unlocked;
        if (!done) unlocked = false;
        // Same icon the module uses everywhere else (dropdown, nav, header)
        // rather than an arbitrary cycling set unrelated to the category.
        const NodeIcon = getModule(c.module)?.icon || Star;

        return (
          <button
            key={c.id}
            disabled={locked}
            onClick={() => onOpen(c.id)}
            title={c.title}
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform active:translate-y-1",
              i % 2 === 0 ? "-translate-x-6" : "translate-x-6",
              done && "bg-emerald-100 border-emerald-500 border-b-[6px] text-emerald-700",
              inProgress && "bg-amber-100 border-amber-500 border-b-[6px] text-amber-700",
              locked && "bg-muted border-border text-muted-foreground cursor-not-allowed",
              !done && !inProgress && !locked && "bg-primary/10 border-primary border-b-[6px] text-primary"
            )}
          >
            {locked ? (
              <Lock className="h-5 w-5" />
            ) : done ? (
              <Check className="h-6 w-6" />
            ) : (
              <NodeIcon className="h-6 w-6" />
            )}
            {done && progress?.accuracy >= 90 && (
              <Star className="absolute -top-2 -right-1 h-5 w-5 fill-amber-400 text-amber-500" />
            )}
          </button>
        );
      })}
      {Array.from({ length: placeholderCount }).map((_, j) => {
        const i = sorted.length + j;
        return (
          <div
            key={`placeholder-${j}`}
            title="Coming soon"
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted text-muted-foreground",
              i % 2 === 0 ? "-translate-x-6" : "translate-x-6"
            )}
          >
            <Lock className="h-5 w-5" />
          </div>
        );
      })}
    </div>
  );
}
