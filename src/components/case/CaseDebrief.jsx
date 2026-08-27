import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import Mascot from "@/components/Mascot";
import XpFloater from "@/components/XpFloater";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DIMENSION_LABELS = {
  history: "History",
  redFlags: "Red flags",
  differential: "Differential",
  examinations: "Examinations",
  disposition: "Disposition",
};

// Same tiering the drill content used before this rebuild: only a real
// clinician sign-off earns "verified" — content_status must never be set to
// that from code. "source-checked" means claims were checked against a real
// reference; "demonstration" means neither has happened yet.
const STATUS_BADGE = {
  demonstration: { label: "⚠️ Unverified demonstration content", className: "bg-amber-100 text-amber-800" },
  "source-checked": { label: "🔍 Source-checked, not clinician-reviewed", className: "bg-sky-100 text-sky-800" },
  verified: { label: "✓ Clinician-verified", className: "bg-emerald-100 text-emerald-800" },
};

export default function CaseDebrief({
  clinicalCase,
  result,
  xpEarned,
  dailyBonus,
  shieldUsed,
  leveledUp,
  streak,
  debriefLimited,
  surpriseChest,
  cotdElapsedLabel,
  onDone,
  onUpgrade,
  canWatchAdForDebrief,
  onWatchAd,
}) {
  const [showSources, setShowSources] = useState(false);
  const status = STATUS_BADGE[clinicalCase.content_status] || STATUS_BADGE.demonstration;
  const bigWin = surpriseChest || result.accuracy >= 80;
  const reactionMood = bigWin ? "victorious" : result.accuracy >= 50 ? "cheerful" : "curious";
  // "complete"/"success" are celebratory jumps; a low-accuracy debrief gets
  // the gentle "incorrect" tilt instead — reassuring, not a failure state.
  const reactionAnimation = bigWin ? "complete" : result.accuracy >= 50 ? "success" : "incorrect";

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-16 w-16">
        <Mascot mood={reactionMood} animation={reactionAnimation} className="h-16 w-16" />
        <XpFloater
          amount={xpEarned}
          trigger={clinicalCase.id}
          className="left-1/2 top-0 -translate-x-1/2 -translate-y-3"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Diagnosis</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
        </div>
        <h2 className="text-xl font-extrabold">{clinicalCase.diagnosis}</h2>
        {clinicalCase.key_takeaway && <p className="mt-2 text-sm">{clinicalCase.key_takeaway}</p>}
        {clinicalCase.references?.length > 0 && (
          <div className="mt-3 border-t border-border pt-2">
            <button
              className="text-xs font-semibold text-primary underline"
              onClick={() => setShowSources((s) => !s)}
            >
              📚 Sources ({clinicalCase.references.length}) {showSources ? "▲" : "▼"}
            </button>
            {showSources && (
              <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                {clinicalCase.references.map((ref, i) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {debriefLimited ? (
        <div className="rounded-lg border-2 border-dashed border-primary/40 bg-accent p-5 text-center">
          <Lock className="mx-auto mb-2 h-5 w-5 text-primary" />
          <p className="font-bold text-primary">Full breakdown locked</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You've used your free debriefs for this month — the accuracy breakdown, reasoning review, and
            evidence citations are part of Premium. Practicing cases stays unlimited either way.
          </p>
          <Button className="mt-3 w-full" onClick={onUpgrade}>
            See upgrade options
          </Button>
          {canWatchAdForDebrief && (
            <Button variant="outline" className="mt-2 w-full" onClick={onWatchAd}>
              Watch an ad for this debrief
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">Accuracy</span>
              <span className="text-lg font-extrabold text-primary">{result.accuracy}%</span>
            </div>
            {Object.entries(result.breakdown).map(([k, v]) => (
              <div key={k} className="mb-2">
                <div className="mb-1 flex justify-between text-xs">
                  <span>{DIMENSION_LABELS[k]}</span>
                  <span>{v}%</span>
                </div>
                <Progress value={v} />
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 font-bold">How you reasoned</h3>
            {result.errors.length === 0 ? (
              <p className="text-sm text-emerald-600">Clean reasoning.</p>
            ) : (
              <ul className="space-y-2">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-sm">
                    <span
                      className={cn(
                        "font-semibold",
                        err.kind === "missed_red_flag" && "text-destructive",
                        err.kind === "missed_yellow_flag" && "text-amber-600"
                      )}
                    >
                      {err.label}
                    </span>
                    {err.detail && <p className="text-xs text-muted-foreground">{err.detail}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {result.citations?.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 font-bold">Evidence for what you got right</h3>
              <ul className="space-y-2">
                {result.citations.map((c, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold text-emerald-700">{c.label}</span>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="rounded-lg border border-border bg-card p-4 text-center">
        {surpriseChest && (
          <p className="mb-1 text-sm font-bold text-amber-600">🎁 Surprise chest! +{surpriseChest.bonusXp} bonus XP</p>
        )}
        <div className="text-2xl font-extrabold text-primary">+{xpEarned} XP</div>
        {dailyBonus && <p className="text-xs text-amber-600">Daily hard case bonus applied (+50%)</p>}
        {shieldUsed && <p className="text-xs text-sky-600">A rest-day shield covered your gap — streak kept alive.</p>}
        {leveledUp && <p className="mt-1 text-sm font-bold text-primary">Level up!</p>}
        <p className="mt-1 text-sm text-muted-foreground">🔥 {streak}-day streak</p>
        {cotdElapsedLabel && <p className="mt-1 text-xs text-muted-foreground">⏱ Learned and practiced this one in {cotdElapsedLabel}</p>}
      </div>

      <Button className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
