import { useState } from "react";
import { BODY_REGIONS, MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
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

export default function BodyMapExplorer({ cases, onOpenCase }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  const scoped = selectedSpecialty ? (cases || []).filter((c) => c.module === selectedSpecialty) : cases || [];
  const activeRegionIds = new Set(scoped.map((c) => c.body_region));

  const region = BODY_REGIONS.find((r) => r.id === selectedRegion);
  const matches = selectedRegion ? scoped.filter((c) => c.body_region === selectedRegion) : [];

  return (
    <div>
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

      <div className="relative mx-auto aspect-square w-full max-w-sm">
        <img src={muscularSystemImg} alt="Muscular system diagram, front and back view" className="h-full w-full object-contain" draggable={false} />
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

      {region && (
        <div className="mt-5">
          <h3 className="mb-2 text-lg font-black tracking-tight">{region.label}</h3>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cases here yet.</p>
          ) : (
            <ul className="space-y-2">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onOpenCase(c.id)}
                    className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary"
                  >
                    <span className="font-semibold">{c.title}</span>
                    <span className="ml-2 text-muted-foreground">{c.presenting_complaint}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
