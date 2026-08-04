import type { Profile, Topic } from "../types";
import { drills, moduleOfTopic } from "../content";
import { effectiveStreak, levelFor } from "../engine/store";
import { ACHIEVEMENTS } from "../engine/achievements";
import { liveRecords, todayISO } from "../engine/srs";

function nextSevenDays(): { iso: string; label: string }[] {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label: i === 0 ? "Today" : i === 1 ? "Tmrw" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
    });
  }
  return out;
}

export default function Stats({
  profile,
}: {
  profile: Profile;
}) {
  const lvl = levelFor(profile.xp);
  const streak = effectiveStreak(profile);

  // Review forecast: due counts over next 7 days (overdue counts as today)
  const days = nextSevenDays();
  const today = todayISO();
  const live = liveRecords(profile);
  const counts = days.map(({ iso }, i) =>
    live.filter((r) => (i === 0 ? r.dueDate <= today : r.dueDate === iso)).length
  );
  const maxCount = Math.max(...counts, 1);

  // Accuracy by topic (lifetime)
  const topics = Object.entries(profile.topicAgg) as [Topic, { n: number; sum: number }][];
  topics.sort((a, b) => a[1].sum / a[1].n - b[1].sum / b[1].n);

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
          <h2>📅 Review forecast</h2>
          <span className="sub">what spaced repetition has queued</span>
        </div>
        <div className="forecast">
          {days.map((d, i) => (
            <div className="forecast-col" key={d.iso}>
              <div className="forecast-n">{counts[i] || ""}</div>
              <div
                className={`forecast-bar ${i === 0 && counts[0] > 0 ? "due-now" : ""}`}
                style={{ height: `${Math.max((counts[i] / maxCount) * 64, 4)}px` }}
              />
              <div className="forecast-label">{d.label}</div>
            </div>
          ))}
        </div>
        <p className="sub" style={{ marginTop: 8 }}>
          {counts[0] > 0
            ? `${counts[0]} drill${counts[0] === 1 ? "" : "s"} due now — clearing reviews daily is what makes them stick.`
            : "Nothing due right now. Reviews accumulate as drills fall due."}
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🎯 Accuracy by topic</h2>
          <span className="sub">lifetime</span>
        </div>
        {topics.length === 0 ? (
          <p className="sub">Answer some drills and your per-topic accuracy will appear here.</p>
        ) : (
          topics.map(([topic, agg]) => {
            const pct = Math.round((agg.sum / agg.n) * 100);
            return (
              <div className="mastery-row" key={topic}>
                <div className="mastery-label">
                  <span>
                    {topic}
                    <span className="sub" style={{ fontWeight: 600 }}> · {moduleOfTopic[topic]}</span>
                  </span>
                  <span className="sub">
                    {pct}% · {agg.n} answered
                  </span>
                </div>
                <div className="mastery-track">
                  <div
                    className={`mastery-fill ${pct >= 75 ? "strong" : pct >= 50 ? "mid" : ""}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
        {topics.length > 0 && (
          <p className="sub" style={{ marginTop: 8 }}>
            Your weakest topics sit at the top — the session builder already prioritizes them for review.
          </p>
        )}
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
        Clinician · A study aid, not a diagnostic tool · Settings and backup live on the You tab
      </div>
    </div>
  );
}
