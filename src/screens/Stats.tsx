import type { Profile } from "../types";
import { effectiveStreak, levelFor } from "../engine/store";
import { ACHIEVEMENTS } from "../engine/achievements";

// ── Awards ───────────────────────────────────────────────────────────────
// Milestones and lifetime numbers. The scheduling detail behind them — review
// forecast, per-topic accuracy — lives on Learn, next to the mastery data
// it's part of; this tab stays "what have I earned," not "what's due."

export default function Stats({
  profile,
}: {
  profile: Profile;
}) {
  const lvl = levelFor(profile.xp);
  const streak = effectiveStreak(profile);
  const unlockedSet = new Set(profile.achievements);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Clini<span>cian</span>
        </div>
        <div className="stats">
          <div className="chip flame">🔥 {streak}</div>
          {profile.shields > 0 && (
            <div className="chip shield" title="Banked rest days — a missed day spends one of these instead of your streak">
              🛡️ {profile.shields}
            </div>
          )}
          <div className="chip xp">⚡ {profile.xp} XP</div>
        </div>
      </div>

      <div className="card">
        <h2>📊 Your numbers</h2>
        <div className="score-row">
          <div className="score-box">
            <div className="val">{lvl.level}</div>
            <div className="lbl">level</div>
          </div>
          <div className="score-box">
            <div className="val">{profile.sessionsCompleted}</div>
            <div className="lbl">sessions</div>
          </div>
          <div className="score-box">
            <div className="val">{profile.caseResults.length}</div>
            <div className="lbl">cases</div>
          </div>
          <div className="score-box">
            <div className="val">{profile.speedBest}</div>
            <div className="lbl">speed best</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🏅 Achievements</h2>
          <span className="sub">
            {profile.achievements.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const on = unlockedSet.has(a.id);
            return (
              <div className={`ach ${on ? "on" : ""}`} key={a.id} title={a.description}>
                <div className="ach-icon">{on ? a.icon : "🔒"}</div>
                <div className="ach-title">{a.title}</div>
                <div className="ach-desc">{a.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="footer-note">
        Clinician · A study aid, not a diagnostic tool · Settings and backup live on the Profile tab
      </div>
    </div>
  );
}
