// ── Local profile persistence ───────────────────────────────────────────
// No accounts, no server — everything lives in this browser's localStorage,
// same philosophy the original app used: no login because there's nothing
// to log in to.

const KEY = "infera-profile-v1";

const DEFAULT_PROFILE = {
  xp: 0,
  level: 1,
  streak_count: 0,
  longest_streak: 0,
  last_active_date: null,
  rest_shields: 1,
  practice_days: 0,
  daily_xp: 0,
  daily_goal: 50,
  daily_goal_date: null,
  hearts: 5,
  mastery: {},
  total_cases_completed: 0,
  perfect_cases: 0,
  speed_rounds_played: 0,
  best_speed_score: 0,
  /** case id -> { status, accuracy, xp_earned, attempts, completed_date, next_review_date, last_played_date } */
  caseProgress: {},
  /** earned achievement codes */
  achievements: [],
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    // corrupt state, fall through to a fresh profile
  }
  return { ...DEFAULT_PROFILE };
}

export function saveProfile(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function resetProfile() {
  localStorage.removeItem(KEY);
}
