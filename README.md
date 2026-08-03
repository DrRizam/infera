# Clinician

A spaced-repetition and deliberate-practice app for musculoskeletal assessment:
special tests, outcome measures, psychometrics, and medical screening. Built for
licensed physical therapists and DPT students.

**This is a study aid, not a diagnostic tool.** Every clinical value carries a
citation, and anything not yet checked against its source by a clinician is
visibly marked `unverified` in the app.

---

## Quick start

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Production build into `dist/` (this is what gets deployed) |
| `npm run typecheck` | `tsc --noEmit` — run before every commit |
| `npm run preview` | Serve the production build locally |
| `node scripts/make-review-doc.mjs <bank>` | Generate a clinician review doc for a content bank |
| `node scripts/make-icons.mjs` | Regenerate PWA icons from code (no design tool needed) |

---

## Why this stack

**Vite + React + TypeScript, shipped as an installable PWA.** Chosen against a
one-month solo timeline with no CI experience and no paid infrastructure:

- **PWA over native (for now).** No Apple developer account, no Mac, no build
  pipeline — testers install by opening a URL and tapping "Add to Home Screen".
  When the product earns it, the same codebase wraps in Capacitor for TestFlight
  without rewriting a single screen. The cost is push notifications, which are
  unreliable on iOS PWAs; the streak mechanic carries motivation instead.
- **Local-first, no backend.** Everything lives in `localStorage`. No accounts,
  no server bill, no privacy surface. The export format (below) is deliberately
  the future sync format.
- **No exotic dependencies.** React, Zod, and `vite-plugin-pwa`. A developer who
  has never seen this repo should be productive in an hour.

---

## Architecture

```
src/
  types.ts            Content schema + learner profile types (start here)
  content/
    banks/*.json      The content bank — plain JSON, edited without touching code
    schema.ts         Zod validation for banks; bad content fails loudly at startup
    index.ts          Loads and merges every bank via import.meta.glob
    cases.ts          Boss-case content (v1: hidden from nav, kept for v2)
    modules.ts        Module/track registry for the Learn screen
  engine/
    fsrs.ts           FSRS-4.5 scheduler — pure functions, no React, no storage
    srs.ts            Session building, mastery math, app-facing review API
    store.ts          Profile persistence, migrations, streaks/shields, export/import
    achievements.ts   Achievement definitions and unlock checks
  screens/            One file per screen; presentational, state lives in App.tsx
  styles.css          All styling: design tokens at the top, light + dark
scripts/              Content and asset tooling (Node, run by hand)
content-review/       Generated review docs for the clinician (git-tracked)
```

State flows one way: `App.tsx` owns the `Profile`, passes it down with a
`setProfile` that persists on every write. No state library, no context — the
tree is four levels deep and this stays readable.

### Spaced repetition (`engine/fsrs.ts`)

FSRS-4.5, chosen over SM-2 because these items are procedural and interpretive
rather than pure recall. FSRS models memory as two variables — **stability**
(how long the memory lasts) and **difficulty** (how hard the item is for this
learner) — which handles partial-credit answers far better than SM-2's single
ease factor.

Grades follow a rubric set by the project's clinician:

| Grade | Meaning |
| --- | --- |
| `Again` (1) | No idea, or wrong construct |
| `Hard` (2) | **Right construct, flawed execution** — never `Again` |
| `Good` (3) | Correct with effort |
| `Easy` (4) | Instant and certain |

Wrong or partial answers are auto-graded (`gradeFromScore`); fully correct
answers ask the learner to self-rate, because the scheduler cannot otherwise
tell "shaky" from "cold".

Scheduling state is stored per drill in `Profile.srs` and is fully portable —
every record carries complete memory state, so exports survive engine changes.

### Content model (`types.ts`, `content/schema.ts`)

Every item carries, in addition to its question data:

| Field | Purpose |
| --- | --- |
| `citation` | Source for **every** clinical value in the item |
| `evidenceReviewedOn` | ISO date a clinician checked it, or `null` |
| `verification` | `verified` \| `unverified` \| `contested` |
| `contestedNote` | For contested items: what the literature actually disputes |
| `category` | `recognition` \| `procedure` \| `interpretation` \| `psychometrics` \| `outcome-measure` |

Five render types exist (`mcq`, `rank`, `redflags`, `interpret`,
`discriminator`) and are orthogonal to `category` — e.g. a procedure item
renders as a `rank` (order the steps).

**Adding a specialty track is a content change, not a code change.** Drop a new
`src/content/banks/*.json` into the folder; `import.meta.glob` picks it up,
Zod validates it, and duplicate ids throw at startup.

### Content authoring workflow

1. Draft items into a new bank, e.g. `src/content/banks/lumbar-batch2.json`,
   every item starting as `unverified` (or `contested` where the literature
   genuinely disagrees).
2. `node scripts/make-review-doc.mjs lumbar-batch2` → writes
   `content-review/lumbar-batch2.md`: each claim beside its citation with
   approve / fix / reject boxes.
3. The clinician reviews. Approved items get `verification: "verified"` and
   today's date in `evidenceReviewedOn`.
4. Until then the app shows a visible ⚠️ badge on the item. Never silently
   present unreviewed clinical values as fact.

Rules for drafting, in priority order: cite every clinical value to a specific
source; mark anything uncertain `unverified` rather than guessing; **never**
invent a psychometric figure, cut score, or MCID; flag genuinely contested
evidence instead of presenting one confident number.

### Gamification

Streaks, XP, levels, a daily goal, a mastery map, and **streak shields**.

Shields replace the hearts/lives model on purpose: a clinician finishing a
12-hour clinic day should not be punished for skipping. Practising
`DAYS_PER_SHIELD` (7) days earns one banked rest day, capped at `MAX_SHIELDS`
(2). A missed day silently spends a shield instead of the streak, and shielded
days never increment the streak — so the number keeps meaning "days I actually
practised". Shields are earned, never bought, and never block a session.

### Data, backup, and privacy

Everything is local. `Profile` is one JSON blob in `localStorage` under
`clinician-profile-v1`, versioned by `profileVersion` with migrations in
`store.ts` (`migrateProfile`). Bump `PROFILE_VERSION` and add a migration
branch whenever the shape changes.

Users export a backup from the Stats screen (`exportProfile`) and restore it
with `importProfile`. This matters more than it looks: iOS can evict WebView
storage, and the export doubles as the pilot feedback channel — flagged items
ride along inside it.

---

## Testing the app

There are no automated tests yet — the highest-value additions would be unit
tests for `engine/fsrs.ts` (scheduling arithmetic) and `store.ts`
(migrations, shield reconciliation), both of which are pure functions.

Manual verification runs through the dev server with browser tooling; the
scheduling and streak logic can be driven directly from the console by seeding
`localStorage` and reloading.

---

## Deployment

`npm run build` emits a static `dist/` — deploy it to any static host
(Cloudflare Pages, Netlify, GitHub Pages). No server, no environment variables,
no secrets. Connect the host to this repo and every push redeploys; installed
PWAs update themselves on next launch (`registerType: "autoUpdate"`).

See [INSTALL.md](INSTALL.md) for the install guide written for testers.

---

## Scope

**In v1:** spaced repetition engine, content model and pipeline, a 150-item MSK
bank (lumbar spine + shoulder), gamification, local-first storage.

**Deliberately deferred to v2** — not built, but nothing here blocks them:
diagnostic imaging module, case-based patient vignettes (`CasePlayer` exists but
is out of the v1 nav), additional specialty tracks (sports, then geriatrics and
paediatrics), cloud sync, accounts, and leaderboards.

Nothing in the data model hardcodes US-only assumptions about units,
terminology, or scope of practice.
