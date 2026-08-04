import { useState } from "react";
import type { Condition } from "../../conditions/schema";
import { LearnMore } from "./cards";

/**
 * Level 2 and Level 3 content. Reached only by choice, and every section is
 * collapsed on arrival — opening Deep Dive should not itself be a wall of
 * text. Sections can also be opened individually from the condition page.
 */
export default function DeepDive({
  condition: c,
  onBack,
  initialSection,
}: {
  condition: Condition;
  onBack: () => void;
  initialSection?: string;
}) {
  const [open, setOpen] = useState<string | null>(initialSection ?? null);
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="card dd-section">
      <button
        className="dd-section-head"
        onClick={() => toggle(id)}
        aria-expanded={open === id}
        aria-controls={`dd-${id}`}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open === id ? "▲" : "▼"}</span>
      </button>
      {open === id && (
        <div id={`dd-${id}`} className="dd-section-body">
          {children}
        </div>
      )}
    </div>
  );

  const dd = c.deepDive;

  return (
    <div className="app">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          ← Back to lesson
        </button>
      </div>

      <div className="card">
        <h2>Deep dive · {c.name}</h2>
        <p className="sub" style={{ marginTop: 6 }}>
          Optional detail. You have already completed the essential lesson — nothing here is
          required.
        </p>
      </div>

      {dd.diagnosticCriteria.length > 0 && (
        <Section id="criteria" title="Diagnostic criteria">
          <ul className="finding-list">
            {dd.diagnosticCriteria.map((t, i) => (
              <li key={i}>
                <span className="finding-text">{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {dd.prognosis && (
        <Section id="prognosis" title="Prognosis">
          <p>{dd.prognosis}</p>
        </Section>
      )}

      {dd.misconceptions.length > 0 && (
        <Section id="misconceptions" title="Common misconceptions">
          <ul className="finding-list">
            {dd.misconceptions.map((t, i) => (
              <li key={i}>
                <span className="finding-text">{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {dd.additionalFindings.length > 0 && (
        <Section id="findings" title="See all findings">
          <ul className="finding-list">
            {dd.additionalFindings.map((f) => (
              <li key={f.id}>
                <span className="finding-text">{f.text}</span>
                {f.detail && <LearnMore>{f.detail}</LearnMore>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {dd.managementDetail.length > 0 && (
        <Section id="management" title="Management detail">
          <ul className="finding-list">
            {dd.managementDetail.map((t, i) => (
              <li key={i}>
                <span className="finding-text">{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Level 3 — evidence lives at the bottom by design. A learner should
          never have to scroll past statistics to reach the lesson. */}
      <Section id="evidence" title="View evidence">
        <div className="lib-row">
          <b>Status</b>
          <span>
            {c.evidence.status === "verified"
              ? "✓ Clinician-verified"
              : c.evidence.status === "source-checked"
                ? "🔍 Figures checked against source, clinician sign-off pending"
                : c.evidence.status === "contested"
                  ? "⚖️ Evidence disputed"
                  : "⚠️ Not yet verified"}
          </span>
        </div>
        <div className="lib-row">
          <b>Reviewer</b>
          <span>{c.evidence.reviewer ?? "Not yet reviewed by a clinician"}</span>
        </div>
        <div className="lib-row">
          <b>Reviewed</b>
          <span>{c.evidence.reviewDate ?? "—"}</span>
        </div>
        {c.evidence.limitations && (
          <div className="lib-row">
            <b>Limitations</b>
            <span>{c.evidence.limitations}</span>
          </div>
        )}
        {c.evidence.statistics.map((s, i) => (
          <div className="lib-row" key={i}>
            <b>{s.test}</b>
            <span>
              {s.status === "placeholder" ? (
                <>
                  <span className="badge unverified">⚠️ no data entered</span> {s.source}
                </>
              ) : (
                <>
                  {s.sensitivity !== null && `Sn ${s.sensitivity}% `}
                  {s.specificity !== null && `Sp ${s.specificity}% `}
                  — {s.source}
                </>
              )}
            </span>
          </div>
        ))}
        {c.evidence.references.map((r, i) => (
          <div className="lib-row" key={`ref-${i}`}>
            <b>{i === 0 ? "References" : ""}</b>
            <span>{r}</span>
          </div>
        ))}
      </Section>

      <div className="footer-note">
        {c.contentStatus === "demonstration"
          ? "⚠️ Demonstration content — requires professional verification before clinical use"
          : "A study aid, not a diagnostic tool"}
      </div>
    </div>
  );
}
