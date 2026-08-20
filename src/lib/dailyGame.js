// ── Daily diagnosis game ("Guess the Diagnosis") ────────────────────────
// Wordle-style: one shared case per day, 6 free-text guesses, progressive
// clinical clues, attribute-badge feedback instead of letter tiles. Pure
// functions only — no storage access here, matching caseEngine.js/
// gamification.js. src/lib/dailyGameStore.js owns persistence.

export const MAX_GUESSES = 6;
export const ATTRIBUTE_KEYS = ["region", "system", "tissue", "chronicity", "mechanism"];

// Case #1's date. The client resolves "today's case number" from its own
// local Date — no server-side timezone coordination needed, so every
// player's case rolls over at their own local midnight for free.
export const LAUNCH_DATE = "2026-08-20";

function localMidnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetweenLocal(a, b) {
  return Math.round((localMidnight(b) - localMidnight(a)) / 86400000);
}

/** Which case_number is "today," purely from the player's own local clock. */
export function currentCaseNumber(now = new Date(), launchDate = LAUNCH_DATE) {
  const [y, m, d] = launchDate.split("-").map(Number);
  const launch = new Date(y, m - 1, d);
  return daysBetweenLocal(launch, now) + 1;
}

export function normalizeGuess(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

/** Levenshtein edit distance — small and dependency-free, fine at this string length. */
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Typo-tolerant term equality — too-short strings skip fuzzy matching since it's unsafe there. */
function fuzzyEquals(a, b) {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 4) return false;
  const tolerance = maxLen <= 8 ? 1 : 2;
  return editDistance(a, b) <= tolerance;
}

/**
 * Resolves a free-text guess to a known case in the bank (today's case or
 * any other approved case), so an unrecognized/gibberish guess can be
 * rejected without consuming an attempt, and a recognized-but-wrong guess
 * still carries real attribute tags to compare against the target.
 */
export function findMatchingCase(guess, caseBank) {
  const norm = normalizeGuess(guess);
  if (!norm) return null;
  for (const c of caseBank || []) {
    const candidates = [c.diagnosis, ...(c.synonyms || [])];
    if (candidates.some((term) => fuzzyEquals(norm, normalizeGuess(term)))) return c;
  }
  return null;
}

/** 5 green/gray booleans — the actual signal, shown even on a wrong guess. */
export function attributeMatches(guessedCase, targetCase) {
  const result = {};
  for (const key of ATTRIBUTE_KEYS) {
    result[key] = !!guessedCase && !!targetCase && guessedCase[key] === targetCase[key];
  }
  return result;
}

/** How many clues (1-6) should be visible given how many guesses have been made so far. */
export function visibleClueCount(guessesMade) {
  return Math.min(MAX_GUESSES, guessesMade + 1);
}

/** Guesses-weighted score; 0 if not solved. Fewer guesses used = more points. */
export function scoreForResult(status, guessesUsed) {
  if (status !== "won") return 0;
  return Math.max(10, (MAX_GUESSES - guessesUsed + 1) * 15);
}

/** Spoiler-safe share text: attribute badges only, never the diagnosis name. */
export function buildShareGrid(caseNumber, guesses, won) {
  const rows = (guesses || []).map((g) => ATTRIBUTE_KEYS.map((k) => (g.attributes?.[k] ? "🟢" : "⚪")).join("")).join("\n");
  const result = won ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  return `Infera Daily #${caseNumber} ${result}\n${rows}`;
}

const REQUIRED_TEXT_FIELDS = ["diagnosis", "region", "system", "tissue", "chronicity", "mechanism", "explanation"];

/**
 * Validates a case-submission form before it's sent to the store — pure so
 * it's testable and reusable if a review UI ever needs the same checks.
 * Returns a field -> message map; empty means the submission is valid.
 */
export function validateCaseSubmission(fields) {
  const errors = {};
  const f = fields || {};

  for (const key of REQUIRED_TEXT_FIELDS) {
    if (!(f[key] || "").trim()) errors[key] = "Required.";
  }

  const clues = (f.clues || []).map((c) => (c || "").trim());
  if (clues.length !== 6 || clues.some((c) => !c)) {
    errors.clues = "All 6 clues are required.";
  }

  return errors;
}

const EMPTY_STATS = { current_streak: 0, longest_streak: 0, total_played: 0, total_won: 0, last_completed_case_number: null };

/**
 * Streak continuation is checked against case_number, not a calendar date —
 * consistent with the rest of the game treating case_number as the fair,
 * per-player day index. Only a WIN extends the streak (a loss breaks it,
 * same convention Wordle itself uses); replaying an already-completed case
 * number is a no-op so this stays safe to call more than once.
 */
export function updateGameStreak(stats, caseNumber, won) {
  const s = stats || EMPTY_STATS;
  if (s.last_completed_case_number === caseNumber) return s;

  const isConsecutive = s.last_completed_case_number === caseNumber - 1;
  const current_streak = won ? (isConsecutive ? s.current_streak + 1 : 1) : 0;

  return {
    current_streak,
    longest_streak: Math.max(s.longest_streak, current_streak),
    total_played: s.total_played + 1,
    total_won: s.total_won + (won ? 1 : 0),
    last_completed_case_number: caseNumber,
  };
}
