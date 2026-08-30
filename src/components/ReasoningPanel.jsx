import { useNavigate } from "react-router-dom";
import { ArrowRight, Target } from "lucide-react";
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
 * would move the weakest one. One card: bars, a rule, then the drill list.
 */
export default function ReasoningPanel({ competency, cases, progressByCaseId, moduleFilter = [] }) {
  const navigate = useNavigate();
  const today = todayStr();
  const dims = reasoningDimensions(competency, moduleFilter);
  const weakest = weakestDimension(dims);
  const scoredCount = dims.filter((d) => d.score != null).length;
  const recs = weakest ? recommendCasesFor(weakest.type, cases, progressByCaseId, today, 3) : [];

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-wide text-primary">Your reasoning</h3>
        {scoredCount >= 3 && (
          <button
            type="button"
            onClick={() => navigate("/osce")}
            className="ml-auto text-[11px] font-bold text-muted-foreground hover:text-primary"
          >
            OSCE checkpoint →
          </button>
        )}
      </div>

      {scoredCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          Work a full case and this fills in — one bar per part of the encounter, so you can see which kind of
          reasoning to sharpen.
        </p>
      ) : (
        <div className="space-y-2">
          {dims.map((d) => (
            <div key={d.type} className="flex items-center gap-3">
              <span className={cn("w-36 shrink-0 text-xs font-semibold", weakest?.type === d.type && "text-orange-600")}>
                {d.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", d.score == null ? "bg-muted-foreground/30" : barColor(d.score))}
                  style={{ width: `${d.score ?? 3}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                {d.score == null ? "—" : `${d.score}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {weakest && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-sm">
            Weakest: <span className="font-bold text-orange-600">{weakest.label}</span>{" "}
            <span className="text-muted-foreground">— {weakest.blurb}</span>
          </p>
          {recs.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {recs.map((c) => {
                const mod = getModule(c.module);
                const p = progressByCaseId?.[c.id];
                const due = p?.next_review_date && p.next_review_date <= today;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/case/${c.id}`)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
                    >
                      {mod && <mod.icon className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      <span className="flex-1 truncate text-sm font-medium">{c.title}</span>
                      {due && <span className="shrink-0 text-[10px] font-bold text-amber-600">REVIEW</span>}
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              You've worked every case that targets this — recall drills keep it sharp between new cases.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
