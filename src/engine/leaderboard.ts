// ── Sample leaderboard ──────────────────────────────────────────────────────
// There is no backend and no accounts, so there is no real leaderboard to
// show. This generates deterministic SAMPLE standings per specialty — same
// output every time for a given specialty, not random on every render — so
// the concept is demoable without ever being mistaken for real data. Callers
// must pair this with a visible "sample, not live" label; nothing here does
// that on its own.

const SAMPLE_NAMES = [
  "J. Alvarez, DPT",
  "R. Okafor, PT",
  "M. Sato, DPT",
  "L. Bergström, PT",
  "A. Khoury, DPT",
  "S. Novak, PT",
  "T. Nakamura, DPT",
  "P. Singh, PT",
];

export interface LeaderboardEntry {
  name: string;
  score: number;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic sample standings for a specialty — same id, same list. */
export function sampleLeaderboard(specialtyId: string): LeaderboardEntry[] {
  const seed = hash(specialtyId);
  return SAMPLE_NAMES.map((name, i) => ({
    name,
    score: 400 + ((seed + i * 137) % 600),
  })).sort((a, b) => b.score - a.score);
}
