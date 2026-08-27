import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { BODY_REGIONS } from "@/lib/modules";
import { CONDITION_REFERENCE } from "@/data/conditionReference";
import { CONDITION_ANNOTATIONS } from "@/data/conditionAnnotations";
import { referenceEntriesForRegion } from "@/lib/conditionReferenceRegions";
import { findAnnotation } from "@/lib/conditionAnnotations";
import { cn } from "@/lib/utils";
import Mascot from "@/components/Mascot";
import BodyFigure from "@/components/BodyFigure";
import { Input } from "@/components/ui/input";

// Percentages measured directly against src/assets/bodymap/figure.png
// (887×1515, cropped from the user's supplied anatomy illustration) by
// scanning the source image for contiguous non-transparent pixel segments
// at many heights — finds each body part's actual x-center/edges rather
// than eyeballing — then verified by rendering the computed dots back onto
// the image before shipping. One anterior view only; hotspots for
// paired/bilateral regions (shoulder, arm, hand, hip, knee, leg, ankle) sit
// on the figure's left side; spine has no real anterior landmark, so it's
// placed on the torso midline between neck and chest, same as the figure
// it replaced.
const HOTSPOTS = {
  head: { left: 49.7, top: 4.8 },
  neck: { left: 49.9, top: 13.4 },
  spine: { left: 49.9, top: 19.5 },
  shoulder: { left: 30.6, top: 20.7 },
  upper_limb: { left: 21.5, top: 36.5 },
  wrist_hand: { left: 6.9, top: 52.3 },
  chest: { left: 49.9, top: 25.9 },
  pelvis: { left: 49.9, top: 49.7 },
  // On the hip crease over the joint (anterior/lateral hip), not the upper
  // thigh — level with the groin, above the quadriceps mass.
  hip: { left: 35, top: 45 },
  knee: { left: 40.1, top: 68.8 },
  lower_leg: { left: 38.8, top: 75.8 },
  ankle_foot: { left: 39.2, top: 88.6 },
};

// Explore is a reference library, not a case browser — every row here is a
// condition from the taxonomy (src/data/conditionReference.js). Entries with
// an annotated write-up open the cited reference page; the rest show as
// "coming soon" so the full taxonomy stays visible.
function referenceEntries(regionId) {
  return referenceEntriesForRegion(regionId, CONDITION_REFERENCE)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

function regionHasAnnotatedEntry(regionId) {
  return referenceEntriesForRegion(regionId, CONDITION_REFERENCE).some((e) =>
    findAnnotation(e.name, CONDITION_ANNOTATIONS)
  );
}

function ConditionList({ entries, onOpenReference }) {
  if (entries.length === 0) return null;
  return (
    <ul className="space-y-2">
      {entries.map((e, i) => {
        const annotation = findAnnotation(e.name, CONDITION_ANNOTATIONS);
        if (annotation) {
          return (
            <li key={`ref-${i}`}>
              <button
                onClick={() => onOpenReference(annotation.slug)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-border bg-card px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-primary"
              >
                <span>
                  {e.name}
                  {e.redFlag && <span className="ml-1.5">🚩</span>}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          );
        }
        return (
          <li key={`ref-${i}`}>
            <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              <span>
                {e.name}
                {e.redFlag && <span className="ml-1.5">🚩</span>}
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">Coming soon</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function BodyMapExplorer() {
  const navigate = useNavigate();
  const onOpenReference = (slug) => navigate(`/reference/${slug}`);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [query, setQuery] = useState("");

  // A hotspot lights up when the reference library has an annotated entry
  // for it — signals "there's real content to read here."
  const activeRegionIds = new Set(
    BODY_REGIONS.filter((r) => regionHasAnnotatedEntry(r.id)).map((r) => r.id)
  );

  const region = BODY_REGIONS.find((r) => r.id === selectedRegion);
  const regionEntries = selectedRegion ? referenceEntries(selectedRegion) : [];

  const trimmedQuery = query.trim().toLowerCase();
  const searchEntries = trimmedQuery
    ? CONDITION_REFERENCE.filter((e) => e.name.toLowerCase().includes(trimmedQuery)).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    : [];

  return (
    <div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search conditions"
          placeholder="Search conditions…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary bg-primary/40" /> Has content
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary bg-muted-foreground/20" /> No content yet
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary bg-primary" /> Selected
        </span>
      </div>

      <div className="relative mx-auto aspect-[887/1515] w-full max-w-xs">
        <BodyFigure className="h-full w-full" />
        {BODY_REGIONS.map((r) => {
          const p = HOTSPOTS[r.id];
          if (!p) return null;
          const hasMatches = activeRegionIds.has(r.id);
          const isSelected = selectedRegion === r.id;
          return (
            <button
              key={r.id}
              type="button"
              aria-label={r.label}
              title={r.label}
              onClick={() => setSelectedRegion(r.id)}
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary shadow-sm transition-all",
                isSelected
                  ? "h-5 w-5 bg-primary"
                  : hasMatches
                  ? "h-4 w-4 bg-primary/40 hover:bg-primary/70"
                  : "h-4 w-4 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              )}
            />
          );
        })}
      </div>

      {trimmedQuery ? (
        <div className="mt-5">
          <h3 className="mb-2 text-lg font-black tracking-tight">Search results</h3>
          {searchEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Mascot mood="curious" animation="searching" className="h-20 w-20" />
              <p className="text-sm text-muted-foreground">No conditions match "{query.trim()}".</p>
            </div>
          ) : (
            <ConditionList entries={searchEntries} onOpenReference={onOpenReference} />
          )}
        </div>
      ) : (
        region && (
          <div className="mt-5">
            <h3 className="mb-2 text-lg font-black tracking-tight">{region.label}</h3>
            {regionEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Mascot mood="curious" animation="searching" className="h-20 w-20" />
                <p className="text-sm text-muted-foreground">No conditions here yet.</p>
              </div>
            ) : (
              <ConditionList entries={regionEntries} onOpenReference={onOpenReference} />
            )}
          </div>
        )
      )}
    </div>
  );
}
