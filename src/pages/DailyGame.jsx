import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Flame, PenSquare, Search, Share2, Stethoscope, Users, X, XCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  ATTRIBUTE_KEYS,
  MAX_GUESSES,
  attributeMatches,
  buildDiagnosisOptions,
  buildShareGrid,
  currentCaseNumber,
  filterDiagnosisOptions,
  findMatchingCase,
  scoreForResult,
  updateGameStreak,
  visibleClueCount,
} from "@/lib/dailyGame";
import { fetchApprovedCases, fetchGameStats, fetchOrCreateAttempt, saveAttempt, saveGameStats } from "@/lib/dailyGameStore";
import { CONDITION_REFERENCE } from "@/data/conditionReference";
import { playFeedback } from "@/lib/sound";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { isBetaHidden } from "@/lib/beta";
import Mascot from "@/components/Mascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ATTRIBUTE_LABELS = { region: "Region", system: "System", tissue: "Tissue", chronicity: "Chronicity", mechanism: "Mechanism" };

/**
 * Full-screen diagnosis picker — search + the entire condition dictionary
 * (case bank + reference taxonomy) as one scrollable list. A body portal so
 * it's never trapped by the route-transition wrapper's transform, owns its
 * own scroll, and can't extend the page.
 */
function ConditionPicker({ options, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const CAP = 300;
  const results = useMemo(() => {
    const q = query.trim();
    return q ? filterDiagnosisOptions(options, q, CAP) : options.slice(0, CAP);
  }, [query, options]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a diagnosis"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-auto flex h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border-2 border-border bg-card sm:my-auto sm:h-[80dvh] sm:rounded-2xl"
      >
        <div className="flex items-center gap-2 border-b-2 border-border p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              className="pl-9"
              placeholder="Search all conditions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  e.preventDefault();
                  onPick(results[0].label);
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No conditions match "{query.trim()}".</p>
          ) : (
            results.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => onPick(o.label)}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted"
              >
                {o.label}
              </button>
            ))
          )}
          {results.length === CAP && (
            <p className="p-3 text-center text-xs text-muted-foreground">Showing the first {CAP} — keep typing to narrow it down.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const ATTRIBUTE_STATUS_CLASS = {
  match: "bg-emerald-500",
  mismatch: "bg-rose-500",
  unknown: "bg-muted-foreground/40",
};

function AttributeRow({ attributes }) {
  return (
    <div className="flex gap-1">
      {ATTRIBUTE_KEYS.map((key) => (
        <span
          key={key}
          title={ATTRIBUTE_LABELS[key]}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white",
            ATTRIBUTE_STATUS_CLASS[attributes[key]] || ATTRIBUTE_STATUS_CLASS.unknown
          )}
        >
          {ATTRIBUTE_LABELS[key][0]}
        </span>
      ))}
    </div>
  );
}

export default function DailyGame() {
  useDocumentTitle("Guess the Diagnosis");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [caseBank, setCaseBank] = useState([]);
  const [targetCase, setTargetCase] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [stats, setStats] = useState(null);
  const [guessText, setGuessText] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [bank, currentStats] = await Promise.all([fetchApprovedCases(), fetchGameStats(user.id)]);
      if (cancelled) return;
      setCaseBank(bank);
      setStats(currentStats);

      const caseNumber = currentCaseNumber();
      const target = bank.find((c) => c.case_number === caseNumber) || null;
      setTargetCase(target);

      if (target) {
        const a = await fetchOrCreateAttempt(user.id, target.id);
        if (!cancelled) setAttempt(a);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const diagnosisOptions = useMemo(
    () => buildDiagnosisOptions(caseBank, CONDITION_REFERENCE.map((e) => e.name)),
    [caseBank]
  );

  const handleGuess = async (e) => {
    e.preventDefault();
    if (!attempt || !targetCase) return;

    // Every submission counts now, recognized or not — an unrecognized
    // guess just can't show attribute matches (attributeMatches handles a
    // null guessedCase safely, all badges gray) but still uses up a guess
    // and advances the clue, same as a recognized-but-wrong one.
    const matched = findMatchingCase(guessText, caseBank, targetCase);
    const correct = !!matched && matched.id === targetCase.id;
    playFeedback(correct);
    const newGuess = {
      text: guessText.trim(),
      matched_diagnosis: matched?.diagnosis || null,
      correct,
      attributes: attributeMatches(matched, targetCase),
      at: new Date().toISOString(),
    };
    const guesses = [...(attempt.guesses || []), newGuess];
    let status = attempt.status;
    let completed_at = attempt.completed_at;
    let score = attempt.score || 0;
    if (correct) {
      status = "won";
      completed_at = new Date().toISOString();
      score = scoreForResult("won", guesses.length);
    } else if (guesses.length >= MAX_GUESSES) {
      status = "lost";
      completed_at = new Date().toISOString();
      score = 0;
    }

    const updated = { ...attempt, guesses, status, completed_at, score };
    setAttempt(updated);
    setGuessText("");
    await saveAttempt(attempt.id, { guesses, status, score, completed_at });

    if (status === "won" || status === "lost") {
      const newStats = updateGameStreak(stats, targetCase.case_number, status === "won");
      setStats(newStats);
      await saveGameStats(user.id, newStats);
    }
  };

  const handleShare = async () => {
    if (!attempt || !targetCase) return;
    const text = buildShareGrid(targetCase.case_number, attempt.guesses, attempt.status === "won");
    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions/non-secure context) — not worth surfacing as an error.
    }
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (!targetCase) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <Mascot mood="curious" className="mx-auto h-24 w-24" />
        <h1 className="text-2xl font-black tracking-tight">Guess the Diagnosis</h1>
        <p className="text-sm text-muted-foreground">No case is live for today yet — check back soon.</p>
      </div>
    );
  }

  const guesses = attempt?.guesses || [];
  const clueCount = visibleClueCount(guesses.length);
  const finished = attempt?.status === "won" || attempt?.status === "lost";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Guess the Diagnosis</h1>
          <p className="text-sm text-muted-foreground">Case #{targetCase.case_number} — {MAX_GUESSES - guesses.length} guesses left</p>
        </div>
        {(!isBetaHidden("groups") || !isBetaHidden("submit-case")) && (
          <div className="flex shrink-0 gap-1.5">
            {!isBetaHidden("groups") && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/groups")}>
                <Users className="h-3.5 w-3.5" />
                Groups
              </Button>
            )}
            {!isBetaHidden("submit-case") && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/submit-case")}>
                <PenSquare className="h-3.5 w-3.5" />
                Submit
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {targetCase.clues.slice(0, clueCount).map((clue, i) => (
            <p key={i} className="text-sm">
              <span className="font-bold text-primary">{i + 1}.</span> {clue}
            </p>
          ))}
        </CardContent>
      </Card>

      {guesses.length > 0 && (
        <div className="space-y-2">
          {guesses.map((g, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-2.5",
                g.correct ? "border-emerald-500 bg-emerald-50" : "border-border bg-card"
              )}
            >
              {g.correct ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 truncate text-sm font-semibold">{g.text}</span>
              <AttributeRow attributes={g.attributes} />
            </div>
          ))}
        </div>
      )}

      {!finished && (
        <form className="space-y-2" onSubmit={handleGuess}>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={cn(
              "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm",
              guessText ? "font-semibold" : "text-muted-foreground"
            )}
          >
            <span className="truncate">{guessText || "Choose a diagnosis…"}</span>
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          <Button type="submit" className="w-full" disabled={!guessText.trim()}>
            Guess
          </Button>
        </form>
      )}

      {pickerOpen && (
        <ConditionPicker
          options={diagnosisOptions}
          onPick={(label) => {
            setGuessText(label);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {finished && (
        <Card className={attempt.status === "won" ? "border-emerald-500" : "border-destructive/40"}>
          <CardHeader>
            {attempt.status === "won" && <Mascot mood="victorious" animation="complete" className="mx-auto h-20 w-20" />}
            <CardTitle>{attempt.status === "won" ? "Solved it!" : "Out of guesses"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-bold text-primary">{targetCase.diagnosis}</p>
            <p className="text-sm text-muted-foreground">{targetCase.explanation}</p>
            {stats && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                <Flame className="h-3.5 w-3.5" />
                {stats.current_streak}-day streak
                {stats.longest_streak > stats.current_streak ? ` · best ${stats.longest_streak}` : ""}
              </p>
            )}
            <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              {shareCopied ? "Copied!" : "Share results"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
