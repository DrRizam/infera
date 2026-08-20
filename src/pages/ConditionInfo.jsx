import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCase } from "@/data/cases";
import { getModule } from "@/lib/modules";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Same tiering CaseDebrief uses — only a real clinician sign-off earns
// "verified", must never be set that from code.
const STATUS_BADGE = {
  demonstration: { label: "⚠️ Unverified demonstration content", className: "bg-amber-100 text-amber-800" },
  "source-checked": { label: "🔍 Source-checked, not clinician-reviewed", className: "bg-sky-100 text-sky-800" },
  verified: { label: "✓ Clinician-verified", className: "bg-emerald-100 text-emerald-800" },
};

/**
 * A read-only overview of a condition — reachable from Explore's body-map
 * matches without committing to the full diagnosis-last case. "Practice
 * this case" is the one path into the actual interactive encounter.
 */
export default function ConditionInfo() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [showSources, setShowSources] = useState(false);

  const clinicalCase = getCase(caseId);
  useDocumentTitle(clinicalCase?.diagnosis || "Condition");

  if (!clinicalCase) {
    return (
      <div className="space-y-4">
        <Link to="/explore" className="text-sm text-primary underline">
          ← Back
        </Link>
        <p className="text-sm text-muted-foreground">Condition not found.</p>
      </div>
    );
  }

  const module = getModule(clinicalCase.module);
  const status = STATUS_BADGE[clinicalCase.content_status] || STATUS_BADGE.demonstration;

  return (
    <div className="space-y-4">
      <Link to="/explore" className="text-sm text-primary underline">
        ← Back to Explore
      </Link>

      <div className="flex items-center gap-3">
        {module && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${module.color}`}>
            <module.icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-black tracking-tight sm:text-2xl">{clinicalCase.diagnosis}</h1>
          {module && <p className="text-xs font-semibold text-muted-foreground">{module.name}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{clinicalCase.title}</CardTitle>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <CardDescription>{clinicalCase.subject}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{clinicalCase.presenting_complaint}</p>
          {clinicalCase.key_takeaway && <p className="text-sm">{clinicalCase.key_takeaway}</p>}

          {clinicalCase.references?.length > 0 && (
            <div className="border-t border-border pt-3">
              <button className="text-xs font-semibold text-primary underline" onClick={() => setShowSources((s) => !s)}>
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
        </CardContent>
      </Card>

      <Button className="w-full" onClick={() => navigate(`/case/${clinicalCase.id}`)}>
        Practice this case
      </Button>
    </div>
  );
}
