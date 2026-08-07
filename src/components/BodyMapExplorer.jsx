import { useState } from "react";
import { BODY_REGIONS } from "@/lib/modules";
import { cn } from "@/lib/utils";

// Schematic, not anatomical — the job is "roughly where," which simple
// shapes convey faster than a detailed drawing.
const HOTSPOTS = {
  head: { cx: 100, cy: 24 },
  neck: { cx: 100, cy: 46 },
  shoulder: { cx: 65, cy: 62 },
  upper_limb: { cx: 50, cy: 100 },
  wrist_hand: { cx: 42, cy: 150 },
  chest: { cx: 100, cy: 80 },
  abdomen: { cx: 100, cy: 112 },
  spine: { cx: 100, cy: 95 },
  pelvis: { cx: 100, cy: 140 },
  hip: { cx: 118, cy: 150 },
  knee: { cx: 100, cy: 230 },
  lower_leg: { cx: 100, cy: 270 },
  ankle_foot: { cx: 100, cy: 320 },
};

export default function BodyMapExplorer({ cases, onOpenCase }) {
  const [selected, setSelected] = useState(null);
  const region = BODY_REGIONS.find((r) => r.id === selected);
  const matches = selected ? (cases || []).filter((c) => c.body_region === selected) : [];

  return (
    <div>
      <svg viewBox="0 0 200 340" className="mx-auto w-full max-w-[220px]" role="group" aria-label="Body diagram">
        <ellipse cx="100" cy="24" rx="18" ry="22" className="fill-muted stroke-border" strokeWidth="2" />
        <rect x="72" y="46" width="56" height="110" rx="18" className="fill-muted stroke-border" strokeWidth="2" />
        <rect x="88" y="156" width="24" height="150" rx="10" className="fill-muted stroke-border" strokeWidth="2" />
        {BODY_REGIONS.map((r) => {
          const p = HOTSPOTS[r.id];
          if (!p) return null;
          return (
            <circle
              key={r.id}
              cx={p.cx}
              cy={p.cy}
              r={selected === r.id ? 10 : 8}
              strokeWidth="1.5"
              role="button"
              tabIndex={0}
              aria-label={r.label}
              className={cn(
                "cursor-pointer stroke-primary transition-all",
                selected === r.id ? "fill-primary" : "fill-primary/30 hover:fill-primary/60"
              )}
              onClick={() => setSelected(r.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(r.id)}
            />
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {BODY_REGIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              selected === r.id ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {region && (
        <div className="mt-4">
          <h3 className="mb-2 font-bold">{region.label}</h3>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cases here yet.</p>
          ) : (
            <ul className="space-y-2">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onOpenCase(c.id)}
                    className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:border-primary"
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
