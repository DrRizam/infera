import { useState } from "react";
import type { Condition, Finding, Interaction } from "../../conditions/schema";
import { essentialOnly } from "../../conditions/schema";
import BodyMap from "./BodyMap";

// One concept per card. Every card here fits a phone screen without scrolling
// in the common case; anything that would push past that belongs in Deep Dive.

/** Level 2 disclosure. Collapsed by default, never auto-opened. */
export function LearnMore({ label = "Why does this matter?", children }: { label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="learn-more">
      <button type="button" className="learn-more-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {label} {open ? "▲" : "▼"}
      </button>
      {open && <div className="learn-more-body">{children}</div>}
    </div>
  );
}

function FindingList({ items, tone }: { items: Finding[]; tone?: "good" | "bad" }) {
  return (
    <ul className={`finding-list ${tone ?? ""}`}>
      {items.map((f) => (
        <li key={f.id}>
          <span className="finding-text">{f.text}</span>
          {f.detail && <LearnMore>{f.detail}</LearnMore>}
        </li>
      ))}
    </ul>
  );
}

// ── Microlearning interaction ─────────────────────────────────────────────

export function InteractionBlock({
  interaction,
  condition,
  answered,
  onAnswered,
}: {
  interaction: Interaction;
  condition: Condition;
  answered: boolean;
  onAnswered: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(answered);

  const multi = interaction.kind === "pick-multiple";
  const correctSet = new Set(interaction.correct);
  const gotIt =
    picked.length > 0 &&
    picked.every((p) => correctSet.has(p)) &&
    (!multi || picked.length === interaction.correct.length);

  const toggle = (id: string) => {
    if (submitted) return;
    setPicked((p) => (multi ? (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]) : [id]));
  };

  const submit = () => {
    setSubmitted(true);
    onAnswered();
  };

  if (interaction.kind === "tap-zone") {
    return (
      <div className="interaction">
        <p className="interaction-prompt">{interaction.prompt}</p>
        <BodyMap
          diagram={condition.painMap.diagram}
          zones={condition.painMap.zones}
          selected={picked}
          onSelect={submitted ? undefined : toggle}
          revealed={submitted}
          caveat={condition.painMap.caveat}
        />
        {!submitted ? (
          <button className="big-btn ghost" disabled={picked.length === 0} onClick={submit}>
            Check
          </button>
        ) : (
          <p className={`interaction-feedback ${gotIt ? "good" : "bad"}`} role="status">
            {gotIt ? interaction.feedbackCorrect : interaction.feedbackIncorrect}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="interaction">
      <p className="interaction-prompt">{interaction.prompt}</p>
      {interaction.options.map((o) => {
        const isPicked = picked.includes(o.id);
        let cls = "option";
        if (submitted) {
          if (correctSet.has(o.id)) cls += " correct";
          else if (isPicked) cls += " wrong";
        } else if (isPicked) cls += " picked";
        return (
          <button key={o.id} className={cls} onClick={() => toggle(o.id)} disabled={submitted} aria-pressed={isPicked}>
            {multi && (
              <span className={`check ${isPicked ? "on" : ""}`} aria-hidden="true">
                {isPicked ? "✓" : ""}
              </span>
            )}
            {o.text}
          </button>
        );
      })}
      {!submitted ? (
        <button className="big-btn ghost" disabled={picked.length === 0} onClick={submit}>
          Check
        </button>
      ) : (
        <p className={`interaction-feedback ${gotIt ? "good" : "bad"}`} role="status">
          {gotIt ? interaction.feedbackCorrect : interaction.feedbackIncorrect}
        </p>
      )}
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────

export function SnapshotCard({ c }: { c: Condition }) {
  return (
    <>
      <h2 className="card-title">{c.name}</h2>
      {c.alsoKnownAs.length > 0 && <p className="also-known">Also called {c.alsoKnownAs.join(", ")}</p>}
      <p className="definition">{c.definition}</p>
      {c.typicalPopulation.length > 0 && (
        <>
          <h3 className="card-sub">Who gets it</h3>
          <FindingList items={essentialOnly(c.typicalPopulation)} />
        </>
      )}
      <p className="sub lesson-time">About {c.estimatedMinutes} minutes.</p>
    </>
  );
}

export function LocationCard({ c, hasInteraction }: { c: Condition; hasInteraction: boolean }) {
  return (
    <>
      <h2 className="card-title">Where does it hurt?</h2>
      {!hasInteraction && (
        <BodyMap
          diagram={c.painMap.diagram}
          zones={c.painMap.zones}
          selected={[]}
          revealed
          caveat={c.painMap.caveat}
        />
      )}
    </>
  );
}

export function PresentationCard({ c }: { c: Condition }) {
  return (
    <>
      <h2 className="card-title">What patients report</h2>
      <FindingList items={essentialOnly(c.symptoms)} />
    </>
  );
}

export function ExaminationCard({ c }: { c: Condition }) {
  const expected = essentialOnly(c.examination.expected);
  const supportive = essentialOnly(c.examination.supportive);
  return (
    <>
      <h2 className="card-title">What you'd expect to find</h2>
      {expected.length > 0 && (
        <>
          <h3 className="card-sub good-text">Expected</h3>
          <FindingList items={expected} tone="good" />
        </>
      )}
      {supportive.length > 0 && (
        <>
          <h3 className="card-sub">Supportive</h3>
          <FindingList items={supportive} />
        </>
      )}
    </>
  );
}

export function DoesNotFitCard({ c }: { c: Condition }) {
  return (
    <>
      <h2 className="card-title">What doesn't fit</h2>
      <p className="sub" style={{ marginBottom: 12 }}>
        Any of these should make you reconsider the diagnosis.
      </p>
      <FindingList items={essentialOnly(c.examination.doesNotFit)} tone="bad" />
    </>
  );
}

export function DifferentialsCard({ c }: { c: Condition }) {
  const [shown, setShown] = useState(0);
  const d = c.differentials[shown];
  return (
    <>
      <h2 className="card-title">What else could it be?</h2>
      {c.differentials.length > 1 && (
        <div className="dd-tabs" role="tablist">
          {c.differentials.map((alt, i) => (
            <button
              key={alt.id}
              role="tab"
              aria-selected={i === shown}
              className={`dd-tab ${i === shown ? "on" : ""}`}
              onClick={() => setShown(i)}
            >
              {alt.label}
            </button>
          ))}
        </div>
      )}
      <div className="compare-scroll">
        <table className="compare-table">
          <caption className="visually-hidden">
            Comparing {c.name} with {d.label}
          </caption>
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col">{c.name}</th>
              <th scope="col">{d.label}</th>
            </tr>
          </thead>
          <tbody>
            {d.discriminators.map((row, i) => (
              <tr key={i}>
                <th scope="row">{row.feature}</th>
                <td>{row.thisCondition}</td>
                <td>{row.alternative}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SafetyCard({ c }: { c: Condition }) {
  return (
    <>
      <h2 className="card-title">When to refer</h2>
      <ul className="finding-list safety">
        {c.redFlags.map((f) => (
          <li key={f.id}>
            <span className="finding-text">
              <span aria-hidden="true">🚩 </span>
              {f.text}
            </span>
            {f.detail && <LearnMore label="What to do">{f.detail}</LearnMore>}
          </li>
        ))}
      </ul>
    </>
  );
}

export function SummaryCard({ c }: { c: Condition }) {
  return (
    <>
      <h2 className="card-title">Remember this</h2>
      <ol className="takeaway-list">
        {c.takeaways.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ol>
    </>
  );
}
