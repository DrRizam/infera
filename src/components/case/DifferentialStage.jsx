import { useMemo } from "react";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shuffleSeed } from "@/lib/caseEngine";

export default function DifferentialStage({ clinicalCase, ranking, onSetRanking, onContinue }) {
  const shuffled = useMemo(
    () => shuffleSeed(clinicalCase.differentials, clinicalCase.id).map((d) => d.id),
    [clinicalCase]
  );
  const order = ranking.length ? ranking : shuffled;

  const move = (id, dir) => {
    const idx = order.indexOf(id);
    const swap = idx + dir;
    if (swap < 0 || swap >= order.length) return;
    const next = [...order];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onSetRanking(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Rank these, most likely first.</p>
      <div className="space-y-2">
        {order.map((id, i) => {
          const d = clinicalCase.differentials.find((x) => x.id === id);
          return (
            <div key={id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm font-semibold">
                {i + 1}. {d.label}
              </span>
              <div className="flex gap-1">
                <button onClick={() => move(id, -1)} disabled={i === 0} className="rounded border px-2 disabled:opacity-30">
                  ↑
                </button>
                <button
                  onClick={() => move(id, 1)}
                  disabled={i === order.length - 1}
                  className="rounded border px-2 disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Button className="w-full" onClick={() => onContinue(order)}>
        Continue
      </Button>
    </div>
  );
}
