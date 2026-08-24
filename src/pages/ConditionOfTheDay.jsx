import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import { CASES } from "@/data/cases";
import { formatElapsedTime, todayStr, weekStreakDays } from "@/lib/gamification";
import { conditionOfTheDay } from "@/lib/modules";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StreakWeek from "@/components/StreakWeek";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

export default function ConditionOfTheDay() {
  useDocumentTitle("Condition of the day");
  const { profile } = useProfile();
  const navigate = useNavigate();

  const cotd = conditionOfTheDay(CASES, profile.focus_modules, todayStr());
  const weekDays = weekStreakDays(profile);

  // Starts the moment this page mounts and keeps running through the
  // practice case (see the ?startedAt= param passed to CasePlay) — the
  // point is total time to actually learn + apply, not just the quiz part.
  const [startedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  if (!cotd) {
    return (
      <div className="space-y-4">
        <Link to="/" className="text-sm text-primary underline">
          ← Back
        </Link>
        <StreakWeek days={weekDays} />
        <p className="text-sm text-muted-foreground">No condition to show today.</p>
      </div>
    );
  }

  // Alphabetical, not by correct_rank — the practice case's differential
  // stage asks the learner to rank these same options themselves, so
  // showing them here in answer order would just hand over the answer.
  const differentials = [...(cotd.differentials || [])].sort((a, b) => a.label.localeCompare(b.label));
  // Split once so nothing appears in both cards — "useful" tests move
  // entirely into Special tests instead of also repeating in the general list.
  const specialTests = (cotd.examinations || []).filter((e) => e.useful);
  const generalTests = (cotd.examinations || []).filter((e) => !e.useful);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="text-sm text-primary underline">
          ← Back
        </Link>
        <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-primary">
          ⏱ {formatElapsedTime(elapsedMs)}
        </span>
      </div>

      <StreakWeek days={weekDays} />

      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Learn about</p>
        <h1 className="text-2xl font-black tracking-tight">{cotd.diagnosis}</h1>
        {cotd.subject && <p className="mt-1 text-sm text-muted-foreground">{cotd.subject}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What it is</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{cotd.key_takeaway}</p>
        </CardContent>
      </Card>

      {generalTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tests used for it</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {generalTests.map((ex) => (
              <div key={ex.id}>
                <p className="text-sm font-semibold">{ex.label}</p>
                <p className="text-xs text-muted-foreground">{ex.rationale}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {specialTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Special tests</CardTitle>
            <CardDescription>The ones that actually discriminate this diagnosis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {specialTests.map((ex) => (
              <div key={ex.id}>
                <p className="text-sm font-semibold text-primary">{ex.label}</p>
                <p className="text-xs text-muted-foreground">{ex.rationale}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {differentials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Differential diagnosis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {differentials.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn("text-sm font-semibold", d.must_not_miss && "text-destructive")}>
                    {d.label}
                    {d.must_not_miss && " — must not miss"}
                  </p>
                  <p className="text-xs text-muted-foreground">{d.notes}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button className="w-full" onClick={() => navigate(`/case/${cotd.id}?cotd=1&startedAt=${startedAt}`)}>
        Start practice case
      </Button>
    </div>
  );
}
