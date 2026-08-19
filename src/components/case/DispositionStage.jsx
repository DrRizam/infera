import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONFIDENCE_LEVELS = [
  { value: 25, label: "Not sure" },
  { value: 60, label: "Fairly confident" },
  { value: 90, label: "Very confident" },
];

export default function DispositionStage({ clinicalCase, choice, confidence, onChoose, onSetConfidence, onSubmit }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">What happens to this patient now?</p>
      <div className="space-y-2">
        {clinicalCase.disposition.options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChoose(o.id)}
            className={cn(
              "block w-full rounded-md border px-3 py-2 text-left text-sm font-semibold",
              choice === o.id ? "border-primary bg-accent" : "border-border"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {choice && (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">How confident are you in that call?</p>
          <div className="flex gap-2">
            {CONFIDENCE_LEVELS.map((c) => (
              <button
                key={c.value}
                onClick={() => onSetConfidence(c.value)}
                className={cn(
                  "flex-1 rounded-md border px-2 py-2 text-center text-xs font-semibold",
                  confidence === c.value ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button className="w-full" disabled={!choice || !confidence} onClick={onSubmit}>
        See debrief
      </Button>
    </div>
  );
}
