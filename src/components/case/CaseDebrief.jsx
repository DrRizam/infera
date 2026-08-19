import { useState } from "react";
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

export default function CaseDebrief({ clinicalCase, result, xpEarned, dailyBonus, shieldUsed, leveledUp, streak, onDone }) {
  const [showSources, setShowSources] = useState(false);
  const status = STATUS_BADGE[clinicalCase.content_status] || STATUS_BADGE.demonstration;

  return (
    <div className="space-y-4">
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
                <span className="font-semibold">{err.label}</span>
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

      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <div className="text-2xl font-extrabold text-primary">+{xpEarned} XP</div>
        {dailyBonus && <p className="text-xs text-amber-600">Daily hard case bonus applied (+50%)</p>}
        {shieldUsed && <p className="text-xs text-sky-600">A rest-day shield covered your gap — streak kept alive.</p>}
        {leveledUp && <p className="mt-1 text-sm font-bold text-primary">Level up!</p>}
        <p className="mt-1 text-sm text-muted-foreground">🔥 {streak}-day streak</p>
      </div>

      <Button className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
