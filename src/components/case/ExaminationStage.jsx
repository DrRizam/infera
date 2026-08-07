import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ExaminationStage({ clinicalCase, selected, onToggle, onContinue }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose examinations to perform — findings reveal as you select them.
      </p>
      <div className="space-y-2">
        {clinicalCase.examinations.map((e) => {
          const picked = selected.includes(e.id);
          return (
            <div key={e.id} className={cn("rounded-md border px-3 py-2", picked ? "border-primary bg-accent" : "border-border")}>
              <button onClick={() => onToggle(e.id)} className="flex w-full items-center justify-between text-left">
                <span className="text-sm font-semibold">{e.label}</span>
                <span className="text-xs text-muted-foreground">{e.cost}</span>
              </button>
              {picked && <p className="mt-1 text-xs">{e.finding}</p>}
            </div>
          );
        })}
      </div>
      <Button className="w-full" disabled={!selected.length} onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
