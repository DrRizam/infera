import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RedFlagStage({ clinicalCase, selected, onToggle, onContinue }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Select every red flag you believe is present.</p>
      <div className="space-y-2">
        {clinicalCase.red_flags.map((f) => {
          const picked = selected.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => onToggle(f.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm",
                picked ? "border-primary bg-accent" : "border-border"
              )}
            >
              <span className={cn("h-4 w-4 shrink-0 rounded border", picked ? "border-primary bg-primary" : "border-border")} />
              {f.label}
            </button>
          );
        })}
      </div>
      <Button className="w-full" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
