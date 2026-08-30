import { useNavigate } from "react-router-dom";
import { ArrowRight, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getModule } from "@/lib/modules";
import { reasoningDimensions, recommendCasesFor, weakestDimension } from "@/lib/reasoningProfile";
import { todayStr } from "@/lib/gamification";
import { cn } from "@/lib/utils";

function barColor(score) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-orange-500";
}

/**
 * The weak-spot view — your five reasoning dimensions and the cases that
 * would move the weakest one. Replaced the linear locked case path: order
 * doesn't matter here, your reasoning profile does.
 */
export default function ReasoningPanel({ competency, cases, progressByCaseId, moduleFilter = [] }) {
  const navigate = useNavigate();
  const today = todayStr();
  const dims = reasoningDimensions(competency, moduleFilter);
  const weakest = weakestDimension(dims);
  const scoredCount = dims.filter((d) => d.score != null).length;

  const recs = weakest ? recommendCasesFor(weakest.type, cases, progressByCaseId, today, 3) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-wide text-primary">Your reasoning</h3>
        </div>

        {scoredCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Work a full case and this fills in — one bar for each part of the encounter, so you can see which kind of
            reasoning to sharpen.
          </p>
        ) : (
          <div className="space-y-3">
            {dims.map((d) => (
              <div key={d.type}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className={cn("font-semibold", weakest?.type === d.type && "text-orange-600")}>{d.label}</span>
                  <span className="text-xs text-muted-foreground">{d.score == null ? "—" : `${d.score}%`}</span>
                </div>
                <Progress value={d.score ?? 0} indicatorClassName={d.score == null ? "bg-muted-foreground/30" : barColor(d.score)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {weakest && (
        <div className="rounded-2xl border-2 border-orange-500/40 bg-orange-50/60 p-4 sm:p-5 dark:bg-orange-500/10">
          <p className="text-sm">
            <span className="font-bold">{weakest.label}</span> is your weakest at{" "}
            <span className="font-bold text-orange-600">{weakest.score}%</span>. {weakest.blurb}
          </p>
          {recs.length > 0 ? (
            <>
              <p className="mt-3 mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Drill it</p>
              <ul className="space-y-2">
                {recs.map((c) => {
                  const mod = getModule(c.module);
                  const p = progressByCaseId?.[c.id];
                  const due = p?.next_review_date && p.next_review_date <= today;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => navigate(`/case/${c.id}`)}
                        className="flex w-full items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary"
                      >
                        {mod && <mod.icon className="h-4 w-4 shrink-0 text-primary" />}
                        <span className="flex-1 truncate text-sm font-semibold">{c.title}</span>
                        {due && <span className="shrink-0 text-[10px] font-bold text-amber-600">REVIEW</span>}
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              You've worked every case that targets this — recall drills keep it sharp between new cases.
            </p>
          )}
        </div>
      )}

      {scoredCount >= 3 && (
        <button
          type="button"
          onClick={() => navigate("/osce")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Test all five at once — OSCE checkpoint
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
