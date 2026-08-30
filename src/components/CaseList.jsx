import { useNavigate } from "react-router-dom";
import { Check, Star } from "lucide-react";
import { BODY_REGIONS, getModule } from "@/lib/modules";
import { todayStr } from "@/lib/gamification";
import { cn } from "@/lib/utils";

/**
 * Every case, browsable in any order — no locks. Grouped by specialty or
 * body region; each row shows its own state (done + accuracy, in progress,
 * review-due, or unplayed). Replaced the linear locked path.
 */
export default function CaseList({ cases, progressByCaseId, groupBy = "module" }) {
  const navigate = useNavigate();
  const today = todayStr();

  const groups = new Map();
  for (const c of cases) {
    const key = groupBy === "region" ? c.body_region || "other" : c.module;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }

  const groupLabel = (key) =>
    groupBy === "region"
      ? BODY_REGIONS.find((r) => r.id === key)?.label || "Other"
      : getModule(key)?.name || key;

  const orderedKeys = [...groups.keys()].sort((a, b) => groupLabel(a).localeCompare(groupLabel(b)));

  return (
    <div className="space-y-5">
      {orderedKeys.map((key) => {
        const list = [...groups.get(key)].sort((a, b) => (a.order || 0) - (b.order || 0));
        const doneCount = list.filter((c) => progressByCaseId?.[c.id]?.status === "completed").length;
        return (
          <div key={key}>
            <div className="mb-2 flex items-baseline justify-between">
              <h4 className="text-sm font-black tracking-tight">{groupLabel(key)}</h4>
              <span className="text-xs font-semibold text-muted-foreground">
                {doneCount}/{list.length}
              </span>
            </div>
            <ul className="space-y-2">
              {list.map((c) => {
                const p = progressByCaseId?.[c.id];
                const done = p?.status === "completed";
                const inProgress = p?.status === "in_progress";
                const due = done && p?.next_review_date && p.next_review_date <= today;
                const gold = done && p?.accuracy >= 90;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/case/${c.id}`)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors hover:border-primary",
                        done ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/5" : "border-border bg-card"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-black",
                          done
                            ? "border-emerald-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20"
                            : inProgress
                            ? "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-500/20"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : `${c.difficulty || 1}`}
                      </span>
                      <span className="flex-1 truncate text-sm font-semibold">{c.title}</span>
                      {gold && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />}
                      {due && <span className="shrink-0 text-[10px] font-bold text-amber-600">REVIEW</span>}
                      {done && !due && (
                        <span className="shrink-0 text-xs font-bold text-muted-foreground">{p.accuracy}%</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
