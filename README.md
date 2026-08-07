# Infera

A gamified, diagnosis-last clinical-reasoning trainer for physical therapy
professionals and students. Patients are presented without a diagnosis — you
gather history, screen red flags, rank a differential, choose examinations,
and commit to a disposition before the diagnosis is ever revealed. Wrapped in
a Duolingo-style gamification layer (streaks, shields, XP, levels, hearts,
achievements) and organized into nine specialty modules.

**This is a study aid, not a diagnostic tool.** No content is `verified` —
every case is `source-checked` against a real reference (see below), but
that's not a substitute for an actual clinician's sign-off.

Everything runs locally in the browser — no account, no server, no setup.

---

## Quick start

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Production build into `dist/` |
| `npm run test` | Run the `lib/` unit tests (gamification + scoring engine) |
| `npm run lint` | ESLint |

---

## Stack

React + Vite + Tailwind CSS (JSX, no TypeScript). Routing via
`react-router-dom`. UI primitives in `src/components/ui/` (shadcn-style). All
progress persists to `localStorage` via `src/lib/store.js` — see
`src/lib/ProfileContext.jsx` for how it's threaded through the app. Import
everything via the `@/` alias, never relative `src/` paths.

## Where things live

- `src/lib/gamification.js` — leveling, streaks/shields, mastery, spaced
  repetition, XP math. Pure functions, fully unit tested.
- `src/lib/caseEngine.js` — the encounter scoring engine: per-dimension
  scoring, weighted total, and named reasoning-error detection (anchoring,
  under/over-escalation, over-investigation, etc). Pure, fully unit tested.
- `src/lib/modules.js` — the 9 specialty modules, body regions, and the daily
  hard-case picker.
- `src/lib/store.js` — localStorage persistence for the local profile.
- `src/pages/CasePlay.jsx` — the multi-stage encounter orchestrator; builds
  its stage list from whichever fields a case actually has, so incomplete
  cases don't render broken stages.
- `src/components/case/` — one component per encounter stage, plus the debrief.
- `src/data/cases.js` — the 12 cases, one per specialty module plus a few
  extra in MSK/Sports. All are `content_status: "source-checked"` — see
  each case's `references` array for exactly what was checked and where.
- `src/data/achievements.js` — the starter achievement set.

## Content conventions

- A case is written from the presentation, never the diagnosis — `title`,
  `presentation`, and `chief_complaint` must never name it. Only `diagnosis`
  does, and it's shown only in the debrief.
- `content_status` has three tiers: `demonstration` (nothing checked yet),
  `source-checked` (claims verified against a real textbook — see each
  case's `references` array for exactly which one and what it says), and
  `verified` (an actual clinician signed off). Only a human clinician can
  earn `verified` — never set it from code.
- Reference textbooks live outside this repo at `Physio Books/` (a sibling
  folder, not committed) — that's where `source-checked` citations come
  from. `pdftotext -layout <file.pdf> out.txt` extracts searchable text from
  any of them faster than reading PDFs page-by-page.
- The flagship teaching pattern is the masquerade: a common diagnosis
  behaving atypically, where anchoring on the familiar label and loading
  harder is the trap (see "The Runner's Persistent Knee" in `src/data/cases.js`).
- `disposition.options` should include the full 5-rung escalation ladder
  (`monitor` → `treat` → `refer_routine` → `investigate` → `refer_urgent`) so
  under- and over-escalation are both detectable, not just "right or wrong."
