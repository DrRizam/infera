import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { BODY_REGIONS, MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import Mascot from "@/components/Mascot";
import { Input } from "@/components/ui/input";
import muscularSystemImg from "@/assets/muscular-system.png";

// Percentages positioned against the real muscular-system photo (front
// view on the left, back view on the right). Everything sits on the front
// figure except spine, which reads far more naturally on the back view.
// Measured directly off the 740x740 source image's figure silhouette
// (per-row pixel spans) rather than eyeballed — the previous values put
// the leg dots in the gap between the legs instead of on a leg, and the
// arm-chain dots off to the side of the actual arm.
const HOTSPOTS = {
  head: { left: 27.7, top: 22.4 },
  neck: { left: 27.7, top: 28.1 },
  shoulder: { left: 18.6, top: 34.1 },
  upper_limb: { left: 14.6, top: 43.4 },
  wrist_hand: { left: 10.8, top: 49.9 },
  chest: { left: 27.8, top: 39.5 },
  abdomen: { left: 27.7, top: 45.0 },
  pelvis: { left: 27.9, top: 49.9 },
  hip: { left: 34.6, top: 49.9 },
  knee: { left: 24.1, top: 61.5 },
  lower_leg: { left: 23.5, top: 67.6 },
  ankle_foot: { left: 23.2, top: 77.0 },
  spine: { left: 71.1, top: 39.2 },
};

// A joint/region tap browses conditions, not cases — several cases can
// share a diagnosis, so this collapses to one row per distinct diagnosis
// (keeping the first case as the representative to open), alphabetized
// like a reference index rather than ordered by whatever the case data
// happens to be sorted by.
function toConditionList(cases) {
  const seen = new Set();
  const unique = [];
  for (const c of cases) {
    if (seen.has(c.diagnosis)) continue;
    seen.add(c.diagnosis);
    unique.push(c);
  }
  return unique.sort((a, b) => a.diagnosis.localeCompare(b.diagnosis));
}

function ConditionList({ cases, onOpenCase }) {
  return (
    <ul className="space-y-2">
      {toConditionList(cases).map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onOpenCase(c.id)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-border bg-card px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-primary"
          >
            {c.diagnosis}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function BodyMapExplorer({ cases, onOpenCase }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [query, setQuery] = useState("");

  const scoped = selectedSpecialty ? (cases || []).filter((c) => c.module === selectedSpecialty) : cases || [];
  const activeRegionIds = new Set(scoped.map((c) => c.body_region));

  const region = BODY_REGIONS.find((r) => r.id === selectedRegion);
  const regionMatches = selectedRegion ? scoped.filter((c) => c.body_region === selectedRegion) : [];

  const trimmedQuery = query.trim().toLowerCase();
  const searchMatches = trimmedQuery
    ? scoped.filter((c) => `${c.title} ${c.presenting_complaint}`.toLowerCase().includes(trimmedQuery))
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

      <div className="mb-3 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setSelectedSpecialty(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            !selectedSpecialty ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"
          )}
        >
          All specialties
        </button>
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedSpecialty(m.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              selectedSpecialty === m.id ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"
            )}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary bg-primary/40" /> Has cases
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary bg-muted-foreground/20" /> No cases yet
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary bg-primary" /> Selected
        </span>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-xl">
        {/* The source asset is a photorealistic render, a hard tonal clash
            against the app's flat/rounded UI — grayscale + a primary-tinted
            multiply overlay turns it into a duotone that reads as designed,
            without needing a new illustration asset. */}
        <img
          src={muscularSystemImg}
          alt="Muscular system diagram, front and back view"
          className="h-full w-full object-contain grayscale contrast-[1.05]"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-primary/20 mix-blend-multiply" />
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
          {searchMatches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Mascot mood="curious" className="h-20 w-20" />
              <p className="text-sm text-muted-foreground">No conditions match "{query.trim()}".</p>
            </div>
          ) : (
            <ConditionList cases={searchMatches} onOpenCase={onOpenCase} />
          )}
        </div>
      ) : (
        region && (
          <div className="mt-5">
            <h3 className="mb-2 text-lg font-black tracking-tight">{region.label}</h3>
            {regionMatches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Mascot mood="curious" className="h-20 w-20" />
                <p className="text-sm text-muted-foreground">No conditions here yet.</p>
              </div>
            ) : (
              <ConditionList cases={regionMatches} onOpenCase={onOpenCase} />
            )}
          </div>
        )
      )}
    </div>
  );
}
