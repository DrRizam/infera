import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import { MODULES } from "@/lib/modules";
import Mascot from "@/components/Mascot";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STAGES = ["intro", "assess", "focus", "done"];

const EXPERIENCE_LEVELS = [
  { id: "student", label: "Student / new grad", blurb: "Still building the fundamentals." },
  { id: "some", label: "Some clinical experience", blurb: "Comfortable with the basics, sharpening judgment." },
  { id: "experienced", label: "Experienced clinician", blurb: "Confident day-to-day, here to stay sharp." },
];

export default function Onboarding() {
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();

  const [stageIdx, setStageIdx] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState(null);
  const [focusModules, setFocusModules] = useState([]);

  if (profile.baseline_completed) return <Navigate to="/home" replace />;

  const stage = STAGES[stageIdx];
  const advance = () => setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));

  const toggleFocusModule = (id) =>
    setFocusModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const finish = () => {
    setProfile((prev) => ({
      ...prev,
      baseline_completed: true,
      experience_level: experienceLevel,
      focus_modules: focusModules,
    }));
    navigate("/home", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        {stage === "intro" && (
          <>
            <CardHeader className="items-center text-center">
              <Mascot mood="cheerful" className="mb-1 h-20 w-20" />
              <CardTitle>Hi, I'm Flex 👋</CardTitle>
              <CardDescription>
                Welcome to Infera. Before we jump in, two quick questions about where you're coming
                from — not a test, no wrong answers. It just helps us point you toward the right
                starting content instead of guessing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={advance}>
                Let's go
              </Button>
            </CardContent>
          </>
        )}

        {stage === "assess" && (
          <>
            <CardHeader className="items-center text-center">
              <Mascot mood="curious" className="mb-1 h-14 w-14" />
              <CardTitle>How would you describe your experience?</CardTitle>
              <CardDescription>Be honest — this only shapes your starting point, not what you can access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => {
                    setExperienceLevel(lvl.id);
                    advance();
                  }}
                  className="block w-full rounded-xl border-2 border-border px-4 py-3 text-left transition-colors hover:border-primary"
                >
                  <span className="block text-sm font-semibold">{lvl.label}</span>
                  <span className="block text-xs text-muted-foreground">{lvl.blurb}</span>
                </button>
              ))}
            </CardContent>
          </>
        )}

        {stage === "focus" && (
          <>
            <CardHeader className="items-center text-center">
              <Mascot mood="cheerful" className="mb-1 h-14 w-14" />
              <CardTitle>Pick your focus areas</CardTitle>
              <CardDescription>Tap as many as you like. You can change these later. Choose Mixed if you'd rather not narrow it down.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {MODULES.map((m) => {
                  const Icon = m.icon;
                  const selected = focusModules.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleFocusModule(m.id)}
                      className={`flex flex-col items-center gap-1 rounded-lg bg-gradient-to-br ${m.color} p-3 text-white ${
                        selected ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-center text-[11px] font-bold leading-tight">{m.name}</span>
                    </button>
                  );
                })}
              </div>
              <Button
                variant={focusModules.length === 0 ? "default" : "outline"}
                className="w-full"
                onClick={() => setFocusModules([])}
              >
                Mixed (no focus)
              </Button>
              <Button className="w-full" onClick={advance}>
                Continue
              </Button>
            </CardContent>
          </>
        )}

        {stage === "done" && (
          <>
            <CardHeader className="items-center text-center">
              <Mascot mood="cheerful" className="mb-1 h-20 w-20" />
              <CardTitle>You're all set</CardTitle>
              <CardDescription>
                We'll start you off around a {EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel)?.label.toLowerCase()}{" "}
                level{focusModules.length > 0
                  ? `, focused on ${focusModules.map((id) => MODULES.find((m) => m.id === id)?.name).filter(Boolean).join(", ")}`
                  : ""}. You can change your focus areas any time from Home. Flex will be around if you need him.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={finish}>
                Enter Infera
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
