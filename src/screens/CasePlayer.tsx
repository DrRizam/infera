import { useMemo, useState } from "react";
import type { Achievement, ClinicalCase, Profile } from "../types";
import { addXp, touchStreak } from "../engine/store";
import { checkAchievements } from "../engine/achievements";

const STAGES = [
  "intro",
  "standout",
  "subjective",
  "differential",
  "objective",
  "tests",
  "redflags",
  "diagnosis",
  "reveal",
  "evidence",
  "results",
] as const;
type Stage = (typeof STAGES)[number];

function shuffleIdx(n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

function pairwiseOrderScore(order: number[]): number {
  // order: expertRank-sorted indices in the user's chosen sequence (0 = expert's top pick)
  let concordant = 0;
  let total = 0;
  for (let i = 0; i < order.length; i++)
    for (let j = i + 1; j < order.length; j++) {
      total++;
      if (order[i] < order[j]) concordant++;
    }
  return total ? concordant / total : 0;
}

export default function CasePlayer({
  clinicalCase: c,
  profile,
  setProfile,
  onExit,
}: {
  clinicalCase: ClinicalCase;
  profile: Profile;
  setProfile: (p: Profile) => void;
  onExit: () => void;
}) {
  const [stage, setStage] = useState<Stage>("intro");

  // Stage state
  const [standoutSel, setStandoutSel] = useState<Set<number>>(new Set());
  const [standoutDone, setStandoutDone] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const [subjectiveDone, setSubjectiveDone] = useState(false);
  const diffShuffle = useMemo(() => shuffleIdx(c.differentials.length), [c.id]);
  // Authored cases list the correct diagnosis first — never render in file order.
  const dxOrder = useMemo(() => shuffleIdx(c.finalDiagnosis.options.length), [c.id]);
  const [diffOrder, setDiffOrder] = useState<number[]>([]); // indices into c.differentials
  const [diffDone, setDiffDone] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [testsPicked, setTestsPicked] = useState<Set<number>>(new Set());
  const [testsDone, setTestsDone] = useState(false);
  const [rfSel, setRfSel] = useState<Set<number>>(new Set());
  const [rfDone, setRfDone] = useState(false);
  const [dxPick, setDxPick] = useState<number | null>(null);

  const stageIdx = STAGES.indexOf(stage);
  const next = () => setStage(STAGES[stageIdx + 1]);

  // ── Scores ─────────────────────────────────────────────────────────────
  const standoutScore =
    c.standoutOptions.filter((o, i) => o.isKey === standoutSel.has(i)).length /
    c.standoutOptions.length;

  const askedQs = c.subjective.questions.filter((q) => asked.includes(q.id));
  const bestPossible = [...c.subjective.questions]
    .sort((a, b) => b.value - a.value)
    .slice(0, c.subjective.budget)
    .reduce((a, q) => a + q.value, 0);
  const subjectiveScore = bestPossible
    ? askedQs.reduce((a, q) => a + q.value, 0) / bestPossible
    : 0;

  const diffScore = pairwiseOrderScore(
    diffOrder.map((i) => c.differentials[i].expertRank - 1)
  );

  const recommendedIdx = c.specialTests.tests
    .map((t, i) => (t.recommended ? i : -1))
    .filter((i) => i >= 0);
  const testScore = recommendedIdx.length
    ? recommendedIdx.filter((i) => testsPicked.has(i)).length / recommendedIdx.length
    : 0;

  const rfScore =
    c.redFlagCheck.items.filter((it, i) => it.correct === rfSel.has(i)).length /
    c.redFlagCheck.items.length;

  const dxScore = dxPick === c.finalDiagnosis.correctIndex ? 1 : 0;

  const reasoning = Math.round(((standoutScore + diffScore + dxScore) / 3) * 100);
  const redFlag = Math.round(((rfScore + subjectiveScore) / 2) * 100);
  const evidence = Math.round(testScore * 100);
  const caseXp = Math.round((reasoning + redFlag + evidence) / 3);

  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

  const finishCase = () => {
    const already = profile.caseResults.some((r) => r.caseId === c.id);
    const xpGain = already ? Math.round(caseXp / 4) : caseXp; // replays earn less
    const result = {
      caseId: c.id,
      completedAt: new Date().toISOString(),
      scores: { reasoning, redFlag, evidence },
      xp: xpGain,
    };
    let next = touchStreak(
      addXp(
        { ...profile, caseResults: [...profile.caseResults.filter((r) => r.caseId !== c.id), result] },
        xpGain
      )
    );
    const earned = checkAchievements(next, { caseScores: result.scores });
    if (earned.length)
      next = { ...next, achievements: [...next.achievements, ...earned.map((a) => a.id)] };
    setUnlocked(earned);
    setProfile(next);
    setStage("results");
  };

  // ── Chrome ─────────────────────────────────────────────────────────────
  const header = (
    <div className="progress-wrap">
      <button className="quit" onClick={onExit} title="Exit case">
        ✕
      </button>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${(stageIdx / (STAGES.length - 1)) * 100}%`, background: "var(--accent)" }}
        />
      </div>
      <div className="progress-label">{c.title}</div>
    </div>
  );

  const patientCard = (
    <div className="card patient-card">
      <div className="ptitle">Your patient</div>
      <h2>
        {c.patient.age}-year-old {c.patient.sex.toLowerCase()} · {c.patient.occupation}
      </h2>
      <div className="quote">“{c.patient.opening}”</div>
      <ul>
        {c.patient.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );

  // ── Stages ─────────────────────────────────────────────────────────────

  if (stage === "intro")
    return (
      <div className="app">
        {header}
        {patientCard}
        <div className="card">
          <div className="stage-title">Boss case</div>
          <p className="sub">
            You'll take this patient from first impression to diagnosis. Your question choices,
            exam picks, and differential ranking are all scored — just like they all matter in
            clinic.
          </p>
          <button className="big-btn" style={{ marginTop: 12 }} onClick={next}>
            Meet the patient
          </button>
        </div>
      </div>
    );

  if (stage === "standout")
    return (
      <div className="app">
        {header}
        {patientCard}
        <div className="card">
          <div className="stage-title">First impressions</div>
          <p className="stage-sub">
            Before asking anything: which features of this presentation genuinely shape your
            thinking? Select all that apply.
          </p>
          {c.standoutOptions.map((o, i) => {
            let cls = "option";
            if (standoutDone) {
              if (o.isKey) cls += standoutSel.has(i) ? " correct" : " wrong";
              else if (standoutSel.has(i)) cls += " wrong";
            } else if (standoutSel.has(i)) cls += " picked";
            return (
              <div key={i}>
                <button
                  className={cls}
                  disabled={standoutDone}
                  onClick={() =>
                    setStandoutSel((s) => {
                      const n = new Set(s);
                      n.has(i) ? n.delete(i) : n.add(i);
                      return n;
                    })
                  }
                >
                  <span className={`check ${standoutSel.has(i) ? "on" : ""}`}>
                    {standoutSel.has(i) ? "✓" : ""}
                  </span>
                  {o.text}
                </button>
                {standoutDone && (
                  <div className="qa-answer value-note" style={{ marginTop: -8 }}>
                    {o.note}
                  </div>
                )}
              </div>
            );
          })}
          {!standoutDone ? (
            <button className="big-btn teal" onClick={() => setStandoutDone(true)}>
              Check
            </button>
          ) : (
            <button className="big-btn" style={{ marginTop: 10 }} onClick={next}>
              Begin the interview
            </button>
          )}
        </div>
      </div>
    );

  if (stage === "subjective") {
    const remaining = c.subjective.budget - asked.length;
    return (
      <div className="app">
        {header}
        <div className="card">
          <div className="stage-title">Subjective assessment</div>
          <p className="stage-sub">
            Clinic time is finite. You may ask <span className="budget">{remaining}</span> more
            question{remaining === 1 ? "" : "s"} — choose the ones that discriminate between your
            differentials.
          </p>
          {c.subjective.questions.map((q) => {
            const wasAsked = asked.includes(q.id);
            return (
              <div key={q.id}>
                <button
                  className={`option ${wasAsked ? "picked" : ""}`}
                  disabled={wasAsked || remaining === 0}
                  onClick={() => setAsked((a) => [...a, q.id])}
                >
                  {q.question}
                </button>
                {wasAsked && (
                  <div className="qa-answer">
                    “{q.answer}”
                    {subjectiveDone && (
                      <div className="value-note">
                        <b className={`v${q.value}`}>
                          {q.value === 2
                            ? "High-value question."
                            : q.value === 1
                              ? "Reasonable question."
                              : "Low-yield question."}
                        </b>{" "}
                        {q.valueNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!subjectiveDone ? (
            <button
              className="big-btn teal"
              disabled={asked.length === 0}
              onClick={() => setSubjectiveDone(true)}
            >
              {remaining > 0 ? `End interview early (${remaining} left)` : "End interview"}
            </button>
          ) : (
            <>
              <div className="feedback neutral" style={{ marginTop: 10 }}>
                <div className="verdict">
                  Interview efficiency: {Math.round(subjectiveScore * 100)}%
                </div>
                Each asked question now shows its diagnostic value above. In real clinics the
                skill isn't asking everything — it's asking what changes your differential.
              </div>
              <button className="big-btn" style={{ marginTop: 12 }} onClick={next}>
                Rank your differentials
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (stage === "differential") {
    const toggle = (origIdx: number) => {
      if (diffDone) return;
      setDiffOrder((o) =>
        o.includes(origIdx) ? o.filter((x) => x !== origIdx) : [...o, origIdx]
      );
    };
    return (
      <div className="app">
        {header}
        <div className="card">
          <div className="stage-title">Differential diagnosis</div>
          <p className="stage-sub">
            Based on the history alone: rank ALL of these, most likely first. Tap in order.
          </p>
          {diffShuffle.map((origIdx) => {
            const d = c.differentials[origIdx];
            const pos = diffOrder.indexOf(origIdx);
            let cls = "option";
            if (diffDone) {
              cls += pos === d.expertRank - 1 ? " correct" : " wrong";
            } else if (pos >= 0) cls += " picked";
            return (
              <div key={origIdx}>
                <button className={cls} disabled={diffDone} onClick={() => toggle(origIdx)}>
                  <span className={`order-badge ${pos < 0 ? "ghost-badge" : ""}`}>
                    {pos >= 0 ? pos + 1 : "·"}
                  </span>
                  {d.name}
                  {diffDone && (
                    <span
                      style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: "var(--ink-soft)" }}
                    >
                      expert: #{d.expertRank}
                    </span>
                  )}
                </button>
                {diffDone && (
                  <div className="qa-answer value-note" style={{ marginTop: -8 }}>
                    {d.rationale}
                  </div>
                )}
              </div>
            );
          })}
          {!diffDone ? (
            <button
              className="big-btn teal"
              disabled={diffOrder.length !== c.differentials.length}
              onClick={() => setDiffDone(true)}
            >
              Lock in my ranking
            </button>
          ) : (
            <>
              <div className="feedback neutral" style={{ marginTop: 10 }}>
                <div className="verdict">
                  Ranking agreement with expert: {Math.round(diffScore * 100)}%
                </div>
                The expert rationale for each position is shown above. Now examine the patient and
                see if the findings move your rankings.
              </div>
              <button className="big-btn" style={{ marginTop: 12 }} onClick={next}>
                Examine the patient
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (stage === "objective")
    return (
      <div className="app">
        {header}
        <div className="card">
          <div className="stage-title">Objective examination</div>
          <p className="stage-sub">
            Choose what to examine. Each section reveals its findings — and how much that section
            was actually worth in this case.
          </p>
          {c.examSections.map((s, i) => {
            const open = openSections.has(i);
            return (
              <div className="exam-section" key={i}>
                <button
                  className="exam-head"
                  onClick={() =>
                    setOpenSections((prev) => {
                      const n = new Set(prev);
                      n.has(i) ? n.delete(i) : n.add(i);
                      return n;
                    })
                  }
                >
                  {s.name}
                  <span>{open ? "▾" : "▸ perform"}</span>
                </button>
                {open && (
                  <div className="exam-body">
                    <ul>
                      {s.findings.map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>
                    <div className={`relevance ${s.relevance}`}>
                      <b>
                        {s.relevance === "high"
                          ? "High yield."
                          : s.relevance === "medium"
                            ? "Moderate yield."
                            : "Low yield."}
                      </b>{" "}
                      {s.relevanceNote}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button
            className="big-btn"
            style={{ marginTop: 10 }}
            disabled={openSections.size === 0}
            onClick={next}
          >
            Move to special tests
          </button>
        </div>
      </div>
    );

  if (stage === "tests") {
    const remaining = c.specialTests.budget - testsPicked.size;
    return (
      <div className="app">
        {header}
        <div className="card">
          <div className="stage-title">Special tests</div>
          <p className="stage-sub">
            Pick <span className="budget">{c.specialTests.budget}</span> tests. Choose the ones
            whose RESULT would actually change your thinking.
          </p>
          {c.specialTests.tests.map((t, i) => {
            const picked = testsPicked.has(i);
            let cls = "option";
            if (testsDone && picked) cls += t.recommended ? " correct" : " wrong";
            else if (picked) cls += " picked";
            return (
              <div key={i}>
                <button
                  className={cls}
                  disabled={testsDone || (!picked && remaining === 0)}
                  onClick={() =>
                    setTestsPicked((s) => {
                      const n = new Set(s);
                      n.has(i) ? n.delete(i) : n.add(i);
                      return n;
                    })
                  }
                >
                  <span className={`check ${picked ? "on" : ""}`}>{picked ? "✓" : ""}</span>
                  <span>
                    {t.stats.name}
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600 }}>
                      {t.stats.target} · Sn {t.stats.sensitivity}% · Sp {t.stats.specificity}%
                      {t.stats.lrPlus != null ? ` · LR+ ${t.stats.lrPlus}` : ""}
                    </span>
                  </span>
                </button>
                {testsDone && picked && (
                  <div className="qa-answer">
                    <b>
                      Result:{" "}
                      <span style={{ color: t.resultInCase === "positive" ? "var(--accent-deep)" : "var(--ink-soft)" }}>
                        {t.resultInCase.toUpperCase()}
                      </span>
                    </b>
                    <div className="value-note">{t.interpretation}</div>
                  </div>
                )}
              </div>
            );
          })}
          {!testsDone ? (
            <button
              className="big-btn teal"
              disabled={testsPicked.size !== c.specialTests.budget}
              onClick={() => setTestsDone(true)}
            >
              Run my tests
            </button>
          ) : (
            <>
              <div className="feedback neutral" style={{ marginTop: 10 }}>
                <div className="verdict">
                  Test selection: {Math.round(testScore * 100)}% of the smart picks
                </div>
                A good test choice is one whose result changes management — not the one you
                learned most recently.
              </div>
              <button className="big-btn" style={{ marginTop: 12 }} onClick={next}>
                Red flag check
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (stage === "redflags")
    return (
      <div className="app">
        {header}
        <div className="card">
          <div className="stage-title">🚩 Red flag safety check</div>
          <p className="stage-sub">{c.redFlagCheck.prompt}</p>
          {c.redFlagCheck.items.map((it, i) => {
            let cls = "option";
            if (rfDone) {
              if (it.correct) cls += rfSel.has(i) ? " correct" : " wrong";
              else if (rfSel.has(i)) cls += " wrong";
            } else if (rfSel.has(i)) cls += " picked";
            return (
              <div key={i}>
                <button
                  className={cls}
                  disabled={rfDone}
                  onClick={() =>
                    setRfSel((s) => {
                      const n = new Set(s);
                      n.has(i) ? n.delete(i) : n.add(i);
                      return n;
                    })
                  }
                >
                  <span className={`check ${rfSel.has(i) ? "on" : ""}`}>
                    {rfSel.has(i) ? "✓" : ""}
                  </span>
                  {it.text}
                </button>
                {rfDone && (
                  <div className="qa-answer value-note" style={{ marginTop: -8 }}>
                    {it.note}
                  </div>
                )}
              </div>
            );
          })}
          {!rfDone ? (
            <button className="big-btn teal" onClick={() => setRfDone(true)}>
              Check
            </button>
          ) : (
            <button className="big-btn" style={{ marginTop: 10 }} onClick={next}>
              Commit to a diagnosis
            </button>
          )}
        </div>
      </div>
    );

  if (stage === "diagnosis")
    return (
      <div className="app">
        {header}
        <div className="card">
          <div className="stage-title">Your diagnosis</div>
          <p className="stage-sub">Everything considered — what is this?</p>
          {dxOrder.map((i) => {
            const o = c.finalDiagnosis.options[i];
            let cls = "option";
            if (dxPick !== null) {
              if (i === c.finalDiagnosis.correctIndex) cls += " correct";
              else if (i === dxPick) cls += " wrong";
            }
            return (
              <button key={i} className={cls} disabled={dxPick !== null} onClick={() => setDxPick(i)}>
                {o}
              </button>
            );
          })}
          {dxPick !== null && (
            <button className="big-btn" style={{ marginTop: 10 }} onClick={next}>
              {dxPick === c.finalDiagnosis.correctIndex ? "Correct — see the reasoning" : "See the reasoning"}
            </button>
          )}
        </div>
      </div>
    );

  if (stage === "reveal")
    return (
      <div className="app">
        {header}
        <div className="card">
          <span className="tag">Diagnosis</span>
          <div className="stage-title">{c.reveal.diagnosis}</div>
          <p className="stage-sub" style={{ marginTop: 10 }}>
            How an expert gets there:
          </p>
          {c.reveal.reasoning.map((r, i) => (
            <div className="reveal-step" key={i}>
              <div className="n">{i + 1}</div>
              <p>{r}</p>
            </div>
          ))}
          <p className="stage-sub" style={{ marginTop: 16, fontWeight: 700 }}>
            Why the others were excluded:
          </p>
          {c.reveal.excluded.map((e, i) => (
            <div className="excluded" key={i}>
              <b>{e.name}</b>
              <p>{e.why}</p>
            </div>
          ))}
          <button className="big-btn" style={{ marginTop: 10 }} onClick={next}>
            Evidence review
          </button>
        </div>
      </div>
    );

  if (stage === "evidence")
    return (
      <div className="app">
        {header}
        <div className="card">
          <div className="stage-title">📚 Evidence review</div>
          <h2 style={{ marginTop: 12 }}>What the evidence says</h2>
          <ul style={{ marginLeft: 18, fontSize: 14.5, marginTop: 6 }}>
            {c.evidence.guidelines.map((g, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{g}</li>
            ))}
          </ul>
          <h2 style={{ marginTop: 16 }}>💎 Clinical pearls</h2>
          <ul style={{ marginLeft: 18, fontSize: 14.5, marginTop: 6 }}>
            {c.evidence.pearls.map((g, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{g}</li>
            ))}
          </ul>
          <h2 style={{ marginTop: 16 }}>⚠️ Common mistakes</h2>
          <ul style={{ marginLeft: 18, fontSize: 14.5, marginTop: 6 }}>
            {c.evidence.mistakes.map((g, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{g}</li>
            ))}
          </ul>
          <button className="big-btn" style={{ marginTop: 16 }} onClick={finishCase}>
            Finish case
          </button>
        </div>
      </div>
    );

  // results
  return (
    <div className="app">
      <div className="card" style={{ textAlign: "center", paddingTop: 32 }}>
        <div style={{ fontSize: 48 }}>{reasoning >= 80 ? "🏆" : reasoning >= 55 ? "💪" : "📚"}</div>
        <h2 style={{ fontSize: 22, margin: "8px 0" }}>Case complete: {c.title}</h2>
        <div className="xp-burst">+{profile.caseResults.find((r) => r.caseId === c.id)?.xp ?? caseXp} XP</div>
        <div className="score-row">
          <div className="score-box">
            <div className="val">{reasoning}%</div>
            <div className="lbl">Reasoning</div>
          </div>
          <div className="score-box">
            <div className="val">{redFlag}%</div>
            <div className="lbl">Red flag safety</div>
          </div>
          <div className="score-box">
            <div className="val">{evidence}%</div>
            <div className="lbl">Test science</div>
          </div>
        </div>
        <p className="sub" style={{ marginBottom: 16 }}>
          Reasoning = impressions + differential + diagnosis · Safety = screening + red flags ·
          Test science = choosing tests that change decisions.
        </p>
        {unlocked.map((a) => (
          <div className="unlock-banner" key={a.id}>
            {a.icon} Achievement unlocked: <b>{a.title}</b>
          </div>
        ))}
        <button className="big-btn" style={{ marginTop: unlocked.length ? 12 : 0 }} onClick={onExit}>
          Back to home
        </button>
      </div>
    </div>
  );
}
