import type { PainZone } from "../../conditions/schema";

// ── Body map ───────────────────────────────────────────────────────────────
// Schematic rather than anatomical: the job is "roughly where, and is it
// diffuse or pinpoint", which a simple diagram conveys faster than a drawing.
//
// Accessibility: every zone is a real <button> with an accessible name, so the
// map is fully operable by keyboard and screen reader. The zone list below the
// diagram is not a fallback — it is the same control, and taps on either work.

const DIAGRAMS: Record<string, { viewBox: string; outline: React.ReactNode; zones: Record<string, React.ReactNode> }> = {
  knee: {
    viewBox: "0 0 120 160",
    outline: (
      <>
        {/* thigh */}
        <path d="M35 5 h50 v55 q0 10 -6 16 h-38 q-6 -6 -6 -16 z" className="bm-limb" />
        {/* shank */}
        <path d="M41 100 h38 v55 h-38 z" className="bm-limb" />
        {/* joint */}
        <rect x="38" y="74" width="44" height="28" rx="8" className="bm-joint" />
      </>
    ),
    zones: {
      "z-peripatellar": <ellipse cx="60" cy="86" rx="24" ry="17" />,
      "z-retropatellar": <ellipse cx="60" cy="86" rx="11" ry="8" />,
      "z-inferior-pole": <ellipse cx="60" cy="101" rx="8" ry="5" />,
      "z-joint-line": <rect x="34" y="82" width="52" height="7" rx="3" />,
      "z-posterior": <rect x="46" y="104" width="28" height="10" rx="5" />,
    },
  },
  shoulder: {
    viewBox: "0 0 120 160",
    outline: (
      <>
        <path d="M20 40 q40 -22 80 0 v20 q-40 -16 -80 0 z" className="bm-limb" />
        <path d="M78 58 h26 v70 h-26 z" className="bm-limb" />
        <circle cx="91" cy="55" r="20" className="bm-joint" />
      </>
    ),
    zones: {
      "z-deltoid": <ellipse cx="91" cy="72" rx="16" ry="20" />,
      "z-acj": <ellipse cx="84" cy="42" rx="10" ry="7" />,
      "z-lateral": <ellipse cx="95" cy="60" rx="12" ry="12" />,
    },
  },
  lumbar: {
    viewBox: "0 0 120 160",
    outline: (
      <>
        <path d="M35 10 h50 v90 h-50 z" className="bm-limb" />
        <rect x="52" y="20" width="16" height="80" rx="7" className="bm-joint" />
      </>
    ),
    zones: {
      "z-central": <rect x="48" y="60" width="24" height="30" rx="8" />,
      "z-buttock": <ellipse cx="60" cy="104" rx="26" ry="12" />,
      "z-leg": <rect x="52" y="112" width="16" height="40" rx="7" />,
    },
  },
  generic: {
    viewBox: "0 0 120 160",
    outline: <rect x="30" y="20" width="60" height="120" rx="16" className="bm-limb" />,
    zones: { "z-area": <ellipse cx="60" cy="80" rx="26" ry="34" /> },
  },
};

export default function BodyMap({
  diagram,
  zones,
  selected,
  onSelect,
  revealed,
  caveat,
}: {
  diagram: string;
  zones: PainZone[];
  selected: string[];
  onSelect?: (zoneId: string) => void;
  /** After answering, primary zones are shown regardless of what was tapped. */
  revealed: boolean;
  caveat?: string;
}) {
  const spec = DIAGRAMS[diagram] ?? DIAGRAMS.generic;
  const interactive = !!onSelect;

  const classFor = (z: PainZone) => {
    const picked = selected.includes(z.id);
    if (revealed) {
      if (z.kind === "primary") return "bm-zone correct";
      return picked ? "bm-zone wrong" : "bm-zone";
    }
    return `bm-zone ${picked ? "picked" : ""}`;
  };

  return (
    <div className="body-map">
      <svg
        viewBox={spec.viewBox}
        role="group"
        aria-label={`Diagram of the ${diagram}. Symptom areas are listed below the diagram.`}
      >
        {spec.outline}
        {zones.map((z) => {
          const shape = spec.zones[z.id];
          if (!shape) return null;
          const g = (
            <g key={z.id} className={classFor(z)}>
              {shape}
            </g>
          );
          if (!interactive) return g;
          return (
            <g
              key={z.id}
              className={`${classFor(z)} tappable`}
              role="button"
              tabIndex={0}
              aria-label={z.label}
              aria-pressed={selected.includes(z.id)}
              onClick={() => onSelect?.(z.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(z.id);
                }
              }}
            >
              {shape}
            </g>
          );
        })}
      </svg>

      {/* Same controls as the diagram, in text. Not decorative — this is how
          the map works with a screen reader or a small touch target. */}
      <ul className="bm-legend">
        {zones.map((z) => {
          const picked = selected.includes(z.id);
          const show = revealed || picked;
          return (
            <li key={z.id}>
              <button
                type="button"
                className={`bm-legend-btn ${classFor(z)}`}
                onClick={() => onSelect?.(z.id)}
                disabled={!interactive}
                aria-pressed={interactive ? picked : undefined}
              >
                <span className="bm-swatch" aria-hidden="true" />
                <span>
                  {z.label}
                  {revealed && z.kind === "primary" && <b> · typical</b>}
                  {revealed && z.kind === "atypical" && <b> · not typical</b>}
                </span>
              </button>
              {show && z.note && <p className="bm-note">{z.note}</p>}
            </li>
          );
        })}
      </ul>

      {caveat && <p className="sub bm-caveat">{caveat}</p>}
    </div>
  );
}
