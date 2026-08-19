import { cn } from "@/lib/utils";

/** Row of 7 day-circles (Mon-Sun) — filled orange once that day's practice is done. */
export default function StreakWeek({ days }) {
  return (
    <div className="flex justify-center gap-2">
      {days.map((d) => (
        <div
          key={d.date}
          title={d.date}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-extrabold transition-colors",
            d.done ? "border-orange-500 bg-orange-500 text-white" : "border-border bg-card text-muted-foreground",
            d.isToday && "ring-2 ring-offset-2 ring-offset-background ring-primary"
          )}
        >
          {d.label}
        </div>
      ))}
    </div>
  );
}
