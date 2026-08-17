import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import { CASES } from "@/data/cases";
import { MODULES, selectBaselineQuestions } from "@/lib/modules";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STAGES = ["intro", "quiz", "focus", "done"];

export default function Onboarding() {
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();

  const questions = useMemo(() => selectBaselineQuestions(CASES, 10), []);

  const [stageIdx, setStageIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [focusModule, setFocusModule] = useState(null);

  if (profile.baseline_completed) return <Navigate to="/" replace />;

  const stage = STAGES[stageIdx];
  const advance = () => setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));

  const answerQuestion = (optionIdx) => {
    if (optionIdx === questions[qIdx].correct) setCorrectCount((c) => c + 1);
    if (qIdx + 1 >= questions.length) advance();
    else setQIdx((i) => i + 1);
  };

  const finish = () => {
    setProfile((prev) => ({
      ...prev,
      baseline_completed: true,
      baseline_score: correctCount,
      focus_module: focusModule,
    }));
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        {stage === "intro" && (
          <>
            <CardHeader>
              <CardTitle>Welcome to Infera</CardTitle>
              <CardDescription>
                First, 10 quick questions to see where you're starting from. No pressure, no feedback as you go —
                this is just a baseline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={advance}>
                Start
              </Button>
            </CardContent>
          </>
        )}

        {stage === "quiz" && questions[qIdx] && (
          <>
            <CardHeader>
              <CardTitle>
                Question {qIdx + 1} of {questions.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="mb-2 font-semibold">{questions[qIdx].prompt}</p>
              {questions[qIdx].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => answerQuestion(i)}
                  className="block w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:border-primary"
                >
                  {opt}
                </button>
              ))}
            </CardContent>
          </>
        )}

        {stage === "focus" && (
          <>
            <CardHeader>
              <CardTitle>Pick a focus area</CardTitle>
              <CardDescription>You can change this later. Choose Mixed if you'd rather not narrow it down.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {MODULES.map((m) => {
                  const Icon = m.icon;
                  const selected = focusModule === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setFocusModule(m.id)}
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
                variant={focusModule === null ? "default" : "outline"}
                className="w-full"
                onClick={() => setFocusModule(null)}
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
            <CardHeader>
              <CardTitle>You're all set</CardTitle>
              <CardDescription>
                Baseline: {correctCount} of {questions.length}. That's just your starting point — it'll only go up from here.
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
