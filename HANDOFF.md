# Clinician — session handoff

Paste this whole file as the first message of a new chat to continue where this session left off. Everything below is verified against the repo as of the last commit, not recalled from memory.

## What this is

**Clinician** — a Duolingo-style spaced-repetition and clinical-reasoning app for physical therapists and DPT students, focused on musculoskeletal assessment. Solo non-technical founder (a DPT, not an engineer) + me as technical co-founder, building toward a 2-week pilot with 5–10 PT colleagues on their own phones.

**Core product promise:** *learn how to think clinically, not memorize conditions.* The app deliberately does not open a case by naming the diagnosis — the learner gathers history, screens for red flags, ranks a differential, chooses examinations, and only sees the diagnosis after committing to a decision.

## Stack

Vite + React 18 + TypeScript, no router (screen switching via a discriminated union in `App.tsx`), Zod-validated JSON content, `localStorage` persistence with versioned migrations, installable PWA (`vite-plugin-pwa`), Vitest for logic tests. Deployed to Netlify: **https://whimsical-taiyaki-e74b8b.netlify.app/** — the live build may be a commit or two behind; redeploy `dist/` after `npm run build` when picking this back up.

No backend, no accounts — everything lives in one `Profile` object in `localStorage`, versioned (`profileVersion`, currently **7**) with sequential migration functions in `src/engine/store.ts`.

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm test              # vitest run — 87 tests, 3 files, all passing
npm run build
```

## Repository shape (verified file list)

```
src/
  App.tsx                  screen router (discriminated union, no react-router)
  types.ts                 Profile type, Drill types, legacy ClinicalCase type (see below)
  config.ts                v1 scope flags (SHOW_BOSS_CASES=false, session presets, etc.)
  main.tsx                 mounts <ErrorBoundary><App/></ErrorBoundary>

  engine/
    fsrs.ts                FSRS-4.5 scheduler (Again/Hard/Good/Easy), pure functions
    srs.ts                 session building, mastery %, due counts — drill-bank specific
    store.ts                Profile persistence, migrations v1→v7, streak/shield logic,
                             export/import. NOW HAS TESTS: __tests__/store.test.ts (35 tests)
    achievements.ts
    case/                   logic for the full patient-encounter loop (Phase 1 build)
      encounter.ts          11-stage state machine, confidence validation, save/resume
      probability.ts        Bayesian likelihood-ratio updates
      scoring.ts             10 weighted dimensions, event-based (not just a number)
      feedback.ts            reasoning-error detection (anchoring, overconfidence, etc.)
      reviewCards.ts          error-derived review cards — SCHEDULED BUT NOT WIRED IN (see gaps)
      __tests__/caseLogic.test.ts   33 tests

  content/                  the DRILL bank (flashcard-style items), separate from cases/conditions
    schema.ts               Zod schema for drills; verification: verified|source-checked|unverified|contested
    index.ts                loader: import.meta.glob over banks/*.json, derives topic→module map
    roadmap.json             planned-but-empty tracks (Neck pain, Dizziness) shown as "in development"
    banks/
      shoulder-batch1.json   25 items
      lumbar-batch2.json     25 items
      knee-batch3.json       25 items
    archive/                 OLD prototype content (50 items), EXCLUDED from the app (not globbed) —
                              kept for reference only, has fake "citation pending" placeholder citations
    cases.ts                 LEGACY hardcoded boss-case content (358 lines) — dead code, see gaps below

  cases/                    the full-encounter CASE system (Phase 1, NEW this "session")
    schema.ts                Zod schema: subjective Qs, red flags, ranked differentials w/
                              must-not-miss status, examinations w/ test statistics, disposition,
                              management options, feedback rules, evidence/reviewer fields
    index.ts                 loader, indexes by presentingComplaint (never by diagnosis name)
    data/
      knee-anterior-runner.json   1 case: bone-stress-injury-masquerading-as-PFP in a runner.
                                   contentStatus: demonstration, evidenceStatus: unverified

  conditions/                the CONDITIONS mini-lesson system (NEW this session)
    schema.ts                 Zod schema with hard LIMITS enforced at parse time: max 5 symptoms,
                               max 5 takeaways, definition ≤220 chars, lesson ≤10 min, etc.
                               ContentPriority (essential/supportive/advanced) controls Quick View
                               vs Deep Dive. Store comprehensively, teach selectively.
    lesson.ts                  assembles 9 single-concept cards, review-seed generation (capped at 4,
                                safety-ranked, only from WRONG knowledge-check answers)
    data/
      patellofemoral-pain.json   1 condition, demonstration/unverified
    __tests__/conditions.test.ts  19 tests, including deliberate tripwires on the schema limits

  screens/
    Home.tsx                 ONE primary CTA (due drills/reviews — hero), secondary "Also today"
                              list (Daily case, disabled Challenge case). Just fixed a regression
                              where this had TWO competing primary-styled buttons.
    Learn.tsx                 mastery map by topic + entry points to Library and Conditions
    Session.tsx / SpeedRound.tsx   drill-bank practice screens
    Stats.tsx / You.tsx        progress dashboard / settings+backup+flags
    Library.tsx                 evidence library — every drill, its citation, verification badge
    Onboarding.tsx / CasePlayer.tsx (LEGACY, dead code, see gaps)
    case/                       CaseEncounter.tsx (orchestrator), stages.tsx, DifferentialBuilder.tsx,
                                 Debrief.tsx — the Phase 1 encounter UI
    conditions/                 ConditionsList.tsx, ConditionLesson.tsx, DeepDive.tsx, BodyMap.tsx,
                                 cards.tsx — the Conditions lesson UI

  components/
    ErrorBoundary.tsx           catches render crashes, offers reload / discard-encounter-and-reload
    Tour.tsx                    first-launch spotlight tour (6 steps)
    FlagControl.tsx              "something wrong with this item?" — shared by drills + conditions
```

## Content status (exact counts, just verified)

**Drill bank** (`src/content/banks/*.json`, 75 items total):
```
verified: 37   source-checked: 13   contested: 16   unverified: 9
```
`verified` = the human co-founder has personally reviewed and signed off. `source-checked` = I independently re-verified the citation/figures but no clinical sign-off yet. Both batches 1 (shoulder) and 2 (lumbar) are user-reviewed; batch 3 (knee) is not yet reviewed by the user.

**Cases** (full patient encounters): 1 case, `knee-anterior-runner`, **demonstration/unverified**.
**Conditions** (mini-lessons): 1 condition, `patellofemoral-pain`, **demonstration/unverified**.

The old prototype drill content (50 items, fake "citation pending" placeholders) is archived at `src/content/archive/*.json` and deliberately excluded from the glob loader — confirmed zero placeholder citations ship in the built bundle.

## Key architectural decisions made this session (in order)

1. **Topics/modules became content-driven, not hardcoded.** `Topic`/`Complaint` are now `string` in `types.ts`; the loader in `content/index.ts` derives the topic→module map from what banks declare and throws if two banks claim the same topic name. This was necessary before adding the knee track — previously "add a new track" was a lie, it required code edits in 5 files.

2. **Built a full clinical-encounter engine from scratch** (`src/cases/` + `src/engine/case/` + `src/screens/case/`), replacing the old `CasePlayer.tsx`/`content/cases.ts` boss-case system (which is now dead code — see gaps). Key design choices:
   - Scoring is **event-based**: every point gained/lost is a `ScoreEvent` with a label and detail, not just a number, so feedback can cite the actual decision.
   - **Escalation is ranked** (`monitor < treat < refer-routine < investigate < refer-urgent`), not just "urgent referral = safety-critical." Two tests caught that under-escalating on a *non-urgent* must-not-miss diagnosis (e.g. choosing "treat" when the case needs "investigate") is just as unsafe as missing an urgent referral — the original scoring only penalized the urgent-referral case.
   - Differential options are **shuffled with a per-case stable seed** — cases are authored with the correct diagnosis first (expert-rank order), so naive rendering would leak the answer. Same bug, same fix pattern, was independently found and fixed in the drill-bank topic **tag** (topic names like "Knee OA" are diagnoses — the tag now shows the presenting complaint pre-answer and reveals the topic only after).
   - Review cards from case mistakes are generated (`generateReviewCards`) and **scored/scheduled through the existing FSRS engine** (not a second scheduler) — but see gaps, they aren't wired into the actual review queue yet.

3. **Built the Conditions system** with schema-enforced conciseness — the user's explicit brief was "concise and interactive, not a textbook chapter," and the decision was to make the length limits **Zod validation failures**, not author guidelines, because good intentions don't survive a subject-matter expert with one more useful fact. Verified live: card 1 of the patellofemoral-pain lesson renders in exactly 812px on a 375×812 mobile viewport — zero scroll.

4. **This session's cleanup** (most recent commit):
   - Fixed a regression I introduced: Home had two visually-competing primary CTAs (hero "Start" button + a `.mode-card.primary` "Daily case" row) plus a genuinely redundant "Quick review" button that duplicated the hero's existing "only have a minute?" shortcut. Now one primary CTA; secondary options live in an un-emphasized "Also today" list.
   - Wrote 35 tests for `engine/store.ts` (profile migration v1→v7, SM-2→FSRS conversion arithmetic, migration idempotency, streak/shield reconciliation, export/import round-trip) — this code runs on every app load and had zero prior test coverage despite being the code most likely to silently corrupt a user's only copy of their progress.

## Known gaps / what's next (I was asked "what would you improve" and gave this list; #1 and #3 are now done)

1. ~~Home's competing CTAs~~ **DONE.**
2. **Delete dead code**: `src/screens/CasePlayer.tsx` (706 lines) and `src/content/cases.ts` (358 lines) are the pre-Phase-1 boss-case system, permanently disabled via `SHOW_BOSS_CASES=false` in `config.ts`, but **still shipping in the production bundle** (verified: the built JS contains "The Hairdresser" and `standoutOptions` strings). Safe, mechanical deletion — not yet done.
3. ~~Test the store migrations~~ **DONE** (35 tests).
4. **Unify the review-queue systems** — the biggest remaining architectural gap. Three separate systems generate spaced-repetition material (drill FSRS records, `CaseReviewCard[]` from case mistakes, `ConditionReviewSeed[]` from condition knowledge-check misses) but only the drill-bank one actually feeds a review queue the user sees again. Case and condition review material is generated, scored, and then either shown once in the debrief or `console.info`'d and discarded. This means the app's central retention promise doesn't yet hold end-to-end for the case/condition experiences. This is real work (~a day), not cleanup.
5. **Clinical review needed**: the one case and the one condition are both `demonstration`/`unverified` — the user has not reviewed them yet, unlike the 37 verified drills.
6. **No pilot analytics** — nothing measures whether testers actually return on day 7/14, which is the entire point of the 2-week pilot. Not built.
7. Only one case and one condition exist. The user has expressed interest in expanding cases toward differential-diagnosis / medical-screening scenarios (e.g., a Parkinson's-presenting-as-frozen-shoulder case was discussed and design-explored but not built — the reasoning was: PT's job is recognition + referral, not diagnosing Parkinson's, so the "correct answer" in such a case should be "requires medical referral," not the disease name itself; also flagged the risk of teaching over-referral if every screening case is sinister — a good screening track needs cases where "treat, it's mechanical" is correct despite a scary-sounding feature).

## Things the user has said they want next / open threads

- Continue building out **Conditions** — frozen shoulder was sketched as the next condition (exercises the shoulder body-map diagram + a movement-pattern comparison the knee case doesn't).
- Possibly wire `reviewSeeds`/`generateReviewCards` into the real FSRS queue (gap #4 above).
- Was asked "what would you improve" and gave a 6-item list; items 1 and 3 are done, 2/4/5/6 are open. The user may want to continue down that list (item 2, deleting dead code, was explicitly queued as "next" when this session ended).
- Netlify hosting is live; user uploads `dist/` manually (no CI). Remind to rebuild before redeploying after any change.

## Working conventions established with this user

- User is a DPT (clinician), not a software engineer — explain technical decisions in plain terms, but they can read code and run commands.
- **Never mark drill/case/condition content `verified` without the user's explicit clinical sign-off.** `source-checked` (my own citation-checking) is a distinct, lower tier — the schema and UI both preserve this distinction on purpose.
- Always verify claims (bugs, "this works," feature status) against the actual repo/browser rather than asserting from memory — this pattern of "let me check" before answering has been consistently valued in this project.
- Prefer small, git-committed, well-tested increments with clear commit messages explaining *why*, not just *what*.
- The user gave several very long, detailed feature briefs (Phase 1 clinical-reasoning loop, Conditions UX) — treat these as authoritative specs to implement thoroughly and test against, not as loose inspiration.
- Run `npm run typecheck`, `npm test`, and `npm run build` before considering any change complete.

## Immediate next action

Ask the user which they'd like to pick up: deleting the dead CasePlayer/cases.ts code (small, mechanical), unifying the review-queue systems (the real architectural gap), building the next condition (frozen shoulder), or something else. Do not assume — confirm scope first, as this project has a strong pattern of the user directing priority explicitly.
