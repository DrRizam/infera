import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Check, ChevronDown, Lightbulb, RotateCcw, Zap } from "lucide-react";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { CASES, getCase } from "@/data/cases";
import { retentionStats, todayStr } from "@/lib/gamification";
import { conditionOfTheDay, getModule, MODULES } from "@/lib/modules";
import { countDueRecallItems, generateRecallItems } from "@/lib/recallItems";
import { suggestModuleFocus } from "@/lib/contextPrompt";
import { currentCaseNumber } from "@/lib/dailyGame";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import CasePath from "@/components/CasePath";
import Mascot from "@/components/Mascot";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  useDocumentTitle("Learn");
  const { profile, setProfile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);

  const firstName = (user?.user_metadata?.full_name || "").split(" ")[0] || "there";
  const progressByCaseId = profile.caseProgress || {};
  const cotd = conditionOfTheDay(CASES, profile.focus_modules, todayStr());
  const cotdModule = cotd && getModule(cotd.module);

  const today = todayStr();
  const retention = retentionStats(profile, today);
  const dailyGoalExceeded = (profile.daily_xp ?? 0) > (profile.daily_goal ?? 50);
  const dueReviews = Object.entries(progressByCaseId)
    .filter(([, p]) => p.next_review_date && p.next_review_date <= today)
    .map(([id, p]) => ({ case: getCase(id), dueDate: p.next_review_date }))
    .filter((r) => r.case)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const recallDue = useMemo(
    () => countDueRecallItems(generateRecallItems(CASES), profile.itemProgress, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.itemProgress]
  );

  const focusSuggestion = useMemo(
    () => suggestModuleFocus(profile, CASES, { today }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.caseProgress, profile.itemProgress]
  );
  const focusSuggestionModule = focusSuggestion && getModule(focusSuggestion.moduleId);

  const dailyGameCaseNumber = currentCaseNumber();

  const focusModules = profile.focus_modules || [];
  const moduleCases = focusModules.length ? CASES.filter((c) => focusModules.includes(c.module)) : CASES;
  const pathHeading =
    focusModules.length === 1
      ? getModule(focusModules[0])?.name || "Reasoning path"
      : focusModules.length > 1
      ? `${focusModules.length} focus areas`
      : "Reasoning path";

  const toggleModule = (id) => {
    setProfile((prev) => {
      const current = prev.focus_modules || [];
      const next = current.includes(id) ? current.filter((m) => m !== id) : [...current, id];
      return { ...prev, focus_modules: next };
    });
  };
  const clearModules = () => {
    setProfile((prev) => ({ ...prev, focus_modules: [] }));
    setModuleMenuOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border-2 border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">Your learning space</p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Good {new Date().getHours() < 12 ? "morning" : "day"}, {firstName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {retention.percent != null
                ? `You've retained ${retention.percent}% of what you've learned so far.`
                : "Keep your reasoning sharp with one focused session today."}
            </p>
          </div>
          <Mascot mood="cheerful" className="h-14 w-14 shrink-0" />
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span>Daily goal</span>
            <span className={dailyGoalExceeded ? "text-emerald-600" : "text-primary"}>
              {profile.daily_xp ?? 0}/{profile.daily_goal ?? 50} XP{dailyGoalExceeded ? " · goal smashed 🎉" : ""}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-[width] duration-500", dailyGoalExceeded ? "bg-emerald-500" : "bg-primary")}
              style={{ width: `${Math.min(100, ((profile.daily_xp ?? 0) / (profile.daily_goal ?? 50)) * 100)}%` }}
            />
          </div>
        </div>
        {retention.overdue > 0 && (
          <p className="mt-3 text-xs font-semibold text-amber-600">
            Skipping days piles up forgetting debt — {retention.overdue} thing{retention.overdue === 1 ? "" : "s"} slipping right now.
          </p>
        )}
      </div>

      <Card
        className="group cursor-pointer overflow-hidden border-0 text-white shadow-md transition-transform hover:-translate-y-0.5"
        onClick={() => navigate("/daily-game")}
      >
        <CardContent className="flex min-h-32 flex-col justify-between bg-gradient-to-br from-violet-600 to-fuchsia-600 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">Guess the Diagnosis</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">Case #{dailyGameCaseNumber}</span>
          </div>
          <div>
            <p className="text-lg font-extrabold">One case, six guesses.</p>
            <p className="mt-1 text-sm opacity-80 transition-opacity group-hover:opacity-100">
              Everyone plays the same case today — 🔥{profile.streak_count ?? 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {cotd && (
        <Card
          className="group cursor-pointer overflow-hidden border-0 text-white shadow-md transition-transform hover:-translate-y-0.5"
          onClick={() => navigate("/condition-of-the-day")}
        >
          <CardContent className={`flex min-h-32 flex-col justify-between bg-gradient-to-br ${cotdModule?.color || "from-primary to-primary"} p-5`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide opacity-90">Condition of the day</span>
              <span className="flex items-center gap-1 text-sm font-bold">🔥{profile.streak_count ?? 0}</span>
            </div>
            <div>
              <p className="text-lg font-extrabold">Tap to reveal today's case</p>
              <p className="mt-1 text-sm opacity-80 transition-opacity group-hover:opacity-100">A fresh challenge is waiting.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {focusSuggestionModule && (
        <button
          onClick={() => navigate(`/recall?module=${focusSuggestion.moduleId}`)}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-primary/40 bg-accent px-4 py-3 text-left transition-colors hover:border-primary"
        >
          <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 text-sm">
            <span className="font-bold">You've been drilling {focusSuggestionModule.name} recall lately.</span>{" "}
            <span className="text-muted-foreground">Keep it going?</span>
          </span>
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" className="w-full justify-start gap-2 bg-card" onClick={() => navigate("/recall")}>
          <Brain className="h-4 w-4" />
          Recall drill
          {recallDue > 0 && (
            <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary">{recallDue} due</span>
          )}
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2 bg-card" onClick={() => navigate("/speed")}>
          <Zap className="h-4 w-4" />
          Speed round
        </Button>
      </div>

      {dueReviews.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-black tracking-tight">Due for review</h2>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary">{dueReviews.length}</span>
          </div>
          <div className="space-y-2">
            {dueReviews.map(({ case: c }) => {
              const mod = getModule(c.module);
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/case/${c.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary"
                >
                  {mod && <mod.icon className="h-4 w-4 shrink-0 text-primary" />}
                  <span className="flex-1 truncate text-sm font-semibold">{c.title}</span>
                  <span className="text-xs font-bold text-muted-foreground">Review</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="relative mb-3 flex items-end justify-between gap-3">
          <button
            type="button"
            title="Switch specialty"
            aria-haspopup="true"
            aria-expanded={moduleMenuOpen}
            onClick={() => setModuleMenuOpen((o) => !o)}
            className="flex items-center gap-1 rounded-xl py-1 pl-0 pr-2 text-lg font-black tracking-tight hover:bg-muted"
          >
            {pathHeading}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", moduleMenuOpen && "rotate-180")} />
          </button>
          <span className="text-xs font-semibold text-muted-foreground">Your progress</span>

          {moduleMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setModuleMenuOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl border-2 border-border bg-card p-2 shadow-elevated">
                <p className="px-3 pb-1 pt-1 text-[11px] font-semibold text-muted-foreground">Tap to select any number</p>
                {MODULES.map((m) => {
                  const selected = focusModules.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModule(m.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-muted",
                        selected && "bg-accent text-primary"
                      )}
                    >
                      <m.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{m.name}</span>
                      {selected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
                <div className="mt-1 border-t border-border pt-1">
                  <button
                    type="button"
                    onClick={clearModules}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-bold text-muted-foreground hover:bg-muted"
                  >
                    Mixed (clear all)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <CasePath
          cases={moduleCases}
          progressByCaseId={progressByCaseId}
          bossRoundsCompleted={profile.bossRoundsCompleted}
          onOpen={(id) => navigate(`/case/${id}`)}
        />
      </div>
    </div>
  );
}
