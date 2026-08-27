import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONDITION_ANNOTATIONS } from "@/data/conditionAnnotations";
import { getAnnotationBySlug } from "@/lib/conditionAnnotations";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * A read-only reference entry — the citation-backed write-up for a
 * condition, reachable from Explore's body-map and search. Explore is a
 * reference library, so there's no "Practice" path here.
 */
export default function ConditionReferenceInfo() {
  const { slug } = useParams();
  const [showSources, setShowSources] = useState(false);

  const entry = getAnnotationBySlug(slug, CONDITION_ANNOTATIONS);
  useDocumentTitle(entry?.name || "Condition reference");

  if (!entry) {
    return (
      <div className="space-y-4">
        <Link to="/explore" className="text-sm text-primary underline">
          ← Back
        </Link>
        <p className="text-sm text-muted-foreground">Reference entry not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/explore" className="text-sm text-primary underline">
        ← Back to Explore
      </Link>

      <div>
        <h1 className="text-xl font-black tracking-tight sm:text-2xl">
          {entry.name}
          {entry.redFlag && <span className="ml-1.5">🚩</span>}
          {entry.comorbidity && <span className="ml-1.5">⚕️</span>}
        </h1>
        {entry.section && <p className="text-xs font-semibold text-muted-foreground">{entry.section}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Background reading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}

          {entry.details.map((d, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold">{d.label}: </span>
              <span className="text-muted-foreground">{d.text}</span>
            </div>
          ))}

          {entry.references.length > 0 && (
            <div className="border-t border-border pt-3">
              <button className="text-xs font-semibold text-primary underline" onClick={() => setShowSources((s) => !s)}>
                📚 Sources ({entry.references.length}) {showSources ? "▲" : "▼"}
              </button>
              {showSources && (
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  {entry.references.map((ref, i) => (
                    <li key={i}>{ref}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
