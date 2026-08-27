/** Maps a scoreEncounter() result onto a case_attempts row (see schema.sql). */
export function buildCaseAttemptRow(scored, clinicalCase, xp, attempts, isDaily) {
  return {
    case_id: clinicalCase.id,
    case_module: clinicalCase.module,
    case_subject: clinicalCase.subject ?? null,
    is_daily: !!isDaily,
    accuracy: Math.round(scored.accuracy),
    breakdown: scored.breakdown,
    errors: scored.errors,
    // Yellow-flag misses aren't a separate column — they're already in
    // `errors` as kind:"missed_yellow_flag".
    missed_red_flags: scored.missedRedFlags,
    false_positive_red_flags: scored.falsePositiveRedFlags,
    xp_earned: xp,
    attempt_number: attempts,
  };
}
