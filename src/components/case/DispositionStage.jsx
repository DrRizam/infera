import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DispositionStage({ clinicalCase, choice, onChoose, onSubmit }) {
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
      <Button className="w-full" disabled={!choice} onClick={onSubmit}>
        See debrief
      </Button>
    </div>
  );
}
