import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import { CASES } from "@/data/cases";
import { todayStr, weekStreakDays } from "@/lib/gamification";
import { conditionOfTheDay } from "@/lib/modules";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StreakWeek from "@/components/StreakWeek";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function ConditionOfTheDay() {
  useDocumentTitle("Condition of the day");
  const { profile } = useProfile();
  const navigate = useNavigate();

  const cotd = conditionOfTheDay(CASES, profile.focus_module, todayStr());
  const weekDays = weekStreakDays(profile);

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

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-primary underline">
        ← Back
      </Link>

      <StreakWeek days={weekDays} />

      <Card>
        <CardHeader>
          <CardTitle>{cotd.diagnosis}</CardTitle>
          <CardDescription>{cotd.subject}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{cotd.presenting_complaint}</p>
          <p className="text-sm">{cotd.key_takeaway}</p>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={() => navigate(`/case/${cotd.id}`)}>
        Practice this case
      </Button>
    </div>
  );
}
