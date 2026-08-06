import { useState } from "react";
import { cases } from "../cases";
import { conditions } from "../conditions";
import { SPECIALTIES, specialtyStatus } from "../specialties";

/**
 * Schematic, not anatomical — same philosophy as the per-condition body map
 * (screens/conditions/BodyMap.tsx): the job is "roughly where," which simple
 * shapes convey faster than a detailed drawing. This is the global version —
 * tap a region, see what's clinically relevant there across every specialty,
 * not just one condition's lesson.
 */
interface BodyRegion {
  id: string;
  label: string;
  /** Matched against ClinicalCase/Condition.bodyRegion. */
  query: string;
  specialtyIds: string[];
  shape: { cx: number; cy: number; rx: number; ry: number };
}

const REGIONS: BodyRegion[] = [
  { id: "head-neck", label: "Head & neck", query: "Neck", specialtyIds: ["msk-ortho", "neuro", "vestibular"], shape: { cx: 100, cy: 30, rx: 20, ry: 24 } },
  { id: "shoulder", label: "Shoulder", query: "Shoulder", specialtyIds: ["msk-ortho", "sports-physio"], shape: { cx: 60, cy: 78, rx: 16, ry: 14 } },
  { id: "chest", label: "Chest", query: "Chest", specialtyIds: ["cardiovascular"], shape: { cx: 100, cy: 90, rx: 22, ry: 20 } },
  { id: "spine", label: "Back", query: "Low back", specialtyIds: ["msk-ortho"], shape: { cx: 100, cy: 130, rx: 18, ry: 22 } },
  { id: "abdomen-pelvis", label: "Abdomen & pelvis", query: "Pelvis", specialtyIds: ["pelvic-floor", "oncology"], shape: { cx: 100, cy: 165, rx: 20, ry: 18 } },
  { id: "hip", label: "Hip", query: "Hip", specialtyIds: ["msk-ortho", "geriatrics"], shape: { cx: 100, cy: 195, rx: 22, ry: 14 } },
  { id: "knee", label: "Knee", query: "Knee", specialtyIds: ["msk-ortho", "sports-physio"], shape: { cx: 100, cy: 250, rx: 16, ry: 14 } },
  { id: "foot-ankle", label: "Foot & ankle", query: "Foot", specialtyIds: ["msk-ortho", "sports-physio"], shape: { cx: 100, cy: 330, rx: 14, ry: 12 } },
];

export default function BodyExplorer({
  onOpenSpecialty,
  onStartEncounter,
  onOpenCondition,
  onBack,
}: {
  onOpenSpecialty: (specialtyId: string) => void;
  onStartEncounter: (caseId: string, resume?: boolean) => void;
  onOpenCondition: (conditionId: string) => void;
  onBack: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = REGIONS.find((r) => r.id === selectedId) ?? null;

  const matchedCases = selected
    ? cases.filter((c) => c.bodyRegion.toLowerCase() === selected.query.toLowerCase())
    : [];
  const matchedConditions = selected
    ? conditions.filter((c) => c.bodyRegion.toLowerCase() === selected.query.toLowerCase())
    : [];

  return (
    <div className="app">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="card">
        <h2>🫀 Body explorer</h2>
        <p className="sub" style={{ marginTop: 6 }}>
          Tap a region to see what's clinically relevant there.
        </p>
      </div>

      <div className="card">
        <svg
          className="body-explorer-map"
          viewBox="0 0 200 360"
          role="group"
          aria-label="Whole-body diagram. Regions are also listed below the diagram."
        >
          {/* Schematic outline only — not anatomical. */}
          <ellipse cx="100" cy="30" rx="20" ry="24" className="be-outline" />
          <rect x="70" y="54" width="60" height="130" rx="20" className="be-outline" />
          <rect x="86" y="180" width="28" height="150" rx="12" className="be-outline" />

          {REGIONS.map((r) => (
            <ellipse
              key={r.id}
              cx={r.shape.cx}
              cy={r.shape.cy}
              rx={r.shape.rx}
              ry={r.shape.ry}
              className={`be-region ${selectedId === r.id ? "current" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={r.label}
              aria-pressed={selectedId === r.id}
              onClick={() => setSelectedId(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(r.id);
                }
              }}
            />
          ))}
        </svg>

        <ul className="be-legend">
          {REGIONS.map((r) => (
            <li key={r.id}>
              <button
                className={`be-legend-btn ${selectedId === r.id ? "current" : ""}`}
                onClick={() => setSelectedId(r.id)}
                aria-pressed={selectedId === r.id}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selected && (
        <div className="card">
          <div className="card-head">
            <h2>{selected.label}</h2>
          </div>

          {matchedCases.length === 0 && matchedConditions.length === 0 ? (
            <p className="sub">
              No case or condition here yet. Relevant specialt{selected.specialtyIds.length === 1 ? "y" : "ies"}:{" "}
              {selected.specialtyIds
                .map((id) => SPECIALTIES.find((s) => s.id === id))
                .filter((s): s is NonNullable<typeof s> => !!s)
                .map((s) => `${s.name}${specialtyStatus(s) === "development" ? " (in development)" : ""}`)
                .join(", ")}
              .
            </p>
          ) : (
            <>
              {matchedCases.map((c) => (
                <button key={c.id} className="condition-row" onClick={() => onStartEncounter(c.id)}>
                  <span className="condition-meta">
                    <b>{c.title}</b>
                    <span className="sub">Case · {c.estimatedMinutes} min</span>
                  </span>
                  <span className="condition-status">›</span>
                </button>
              ))}
              {matchedConditions.map((c) => (
                <button key={c.id} className="condition-row" onClick={() => onOpenCondition(c.id)}>
                  <span className="condition-meta">
                    <b>{c.name}</b>
                    <span className="sub">Condition · {c.estimatedMinutes} min</span>
                  </span>
                  <span className="condition-status">›</span>
                </button>
              ))}
            </>
          )}

          <div className="be-specialty-links">
            {selected.specialtyIds.map((id) => {
              const s = SPECIALTIES.find((x) => x.id === id);
              if (!s) return null;
              return (
                <button key={id} className="mini-btn ghost-mini" onClick={() => onOpenSpecialty(id)}>
                  {s.icon} {s.name} →
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
