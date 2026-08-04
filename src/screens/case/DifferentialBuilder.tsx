import { useMemo } from "react";
import type { Differential } from "../../cases/schema";
import type { RankedDifferential } from "../../engine/case/encounter";
import { confidenceTotal, isConfidenceValid } from "../../engine/case/encounter";

/**
 * Cases author their differentials in expert-rank order, so presenting them in
 * file order would hand the learner the answer. Shuffled once per case with a
 * seed derived from the ids, which keeps the order stable across re-renders
 * and across the initial and revised stages of the same encounter.
 */
function useShuffledOptions(options: Differential[]): Differential[] {
  return useMemo(() => {
    const seed = options.map((o) => o.id).join("|");
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    return [...options].sort((a, b) => {
      const ha = hashWith(h, a.id);
      const hb = hashWith(h, b.id);
      return ha - hb;
    });
  }, [options]);
}

function hashWith(seed: number, id: string): number {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) | 0;
  return h;
}

/**
 * Ranked differential with confidence percentages.
 *
 * Ordering uses move-up/move-down buttons rather than drag-and-drop: it is
 * keyboard operable and screen-reader announceable by default, works on touch
 * without a long-press, and needs no pointer-event handling. Drag is a
 * possible enhancement, never the only route.
 */
export default function DifferentialBuilder({
  options,
  value,
  onChange,
  minimum = 3,
}: {
  options: Differential[];
  value: RankedDifferential[];
  onChange: (next: RankedDifferential[]) => void;
  minimum?: number;
}) {
  const shuffled = useShuffledOptions(options);
  const chosenIds = new Set(value.map((d) => d.differentialId));
  const available = shuffled.filter((o) => !chosenIds.has(o.id));
  const total = confidenceTotal(value);
  const valid = isConfidenceValid(value);
  const labelOf = (id: string) => options.find((o) => o.id === id)?.label ?? id;

  const add = (id: string) => {
    const share = value.length === 0 ? 100 : 0;
    onChange([...value, { differentialId: id, confidence: share }]);
  };

  const remove = (id: string) =>
    onChange(value.filter((d) => d.differentialId !== id));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const setConfidence = (id: string, confidence: number) =>
    onChange(
      value.map((d) =>
        d.differentialId === id ? { ...d, confidence: Math.max(0, Math.min(100, confidence)) } : d
      )
    );

  /** Even split, remainder to the top-ranked entry so the total is exactly 100. */
  const balance = () => {
    if (!value.length) return;
    const base = Math.floor(100 / value.length);
    const next = value.map((d) => ({ ...d, confidence: base }));
    next[0].confidence += 100 - base * value.length;
    onChange(next);
  };

  return (
    <div className="dx-builder">
      <ol className="dx-list">
        {value.map((d, i) => (
          <li key={d.differentialId} className="dx-row">
            <span className="dx-rank" aria-hidden="true">
              {i + 1}
            </span>
            <span className="dx-label">{labelOf(d.differentialId)}</span>

            <span className="dx-confidence">
              <label className="visually-hidden" htmlFor={`conf-${d.differentialId}`}>
                Confidence in {labelOf(d.differentialId)}, percent
              </label>
              <input
                id={`conf-${d.differentialId}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={d.confidence}
                onChange={(e) => setConfidence(d.differentialId, Number(e.target.value))}
              />
              <span aria-hidden="true">%</span>
            </span>

            <span className="dx-actions">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${labelOf(d.differentialId)} up to position ${i}`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label={`Move ${labelOf(d.differentialId)} down to position ${i + 2}`}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(d.differentialId)}
                aria-label={`Remove ${labelOf(d.differentialId)} from your differential`}
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ol>

      {value.length === 0 && (
        <p className="sub dx-empty">
          Nothing on your list yet. Add at least {minimum} diagnoses you are actively considering.
        </p>
      )}

      <div className={`dx-total ${valid ? "ok" : "off"}`} role="status">
        <span>
          Total confidence: <b>{total}%</b>
          {!valid && total !== 100 && (
            <> — needs to reach 100% ({total > 100 ? "over" : "under"} by {Math.abs(100 - total)})</>
          )}
          {valid && " ✓"}
        </span>
        {value.length > 0 && (
          <button type="button" className="dx-balance" onClick={balance}>
            Split evenly
          </button>
        )}
      </div>

      {available.length > 0 && (
        <div className="dx-add">
          <p className="sub">Add a diagnosis you are considering:</p>
          <div className="dx-chips">
            {available.map((o) => (
              <button key={o.id} type="button" className="dx-chip" onClick={() => add(o.id)}>
                + {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
