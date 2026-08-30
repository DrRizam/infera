// ── Anatomy quiz pool ───────────────────────────────────────────────────
// Turns the muscle reference (src/data/muscles.js) into a pool of 4-option
// MCQs — identify from image, primary action, innervating nerve, spinal
// levels — with distractors drawn from other muscles (same region first,
// so they're plausible). Pure; the page just picks a set and scores it.

const QUESTION_TYPES = ["identify", "action", "nerve", "root"];

function shuffle(arr, rand = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** n distinct random items from `arr`, excluding anything in `exclude`. */
function pick(arr, n, exclude = []) {
  const ex = new Set(exclude);
  return shuffle(arr.filter((x) => !ex.has(x))).slice(0, n);
}

/** {options, correct} — correct value plus distractors, shuffled, with the answer index. */
function makeOptions(correct, distractors) {
  const opts = shuffle([correct, ...distractors]);
  return { options: opts, correct: opts.indexOf(correct) };
}

/** Distinct field values from a muscle list, other than `not`. */
function otherValues(muscles, field, not) {
  return [...new Set(muscles.map((m) => m[field]).filter((v) => v && v !== not))];
}

export function buildAnatomyPool(muscles) {
  const pool = [];
  const allNerves = otherValues(muscles, "nerve");
  const allRoots = otherValues(muscles, "root").filter((r) => r !== "Segmental");

  for (const m of muscles) {
    const sameRegion = muscles.filter((x) => x.region === m.region && x.id !== m.id);
    const others = muscles.filter((x) => x.id !== m.id);
    const nameDistractors = [
      ...pick(sameRegion.map((x) => x.name), 3),
      ...pick(others.map((x) => x.name), 3),
    ].slice(0, 3);

    pool.push({
      id: `${m.id}:identify`,
      type: "identify",
      muscleId: m.id,
      image: m.image,
      prompt: "Which muscle is shown?",
      ...makeOptions(m.name, nameDistractors),
      explain: `${m.name} — ${m.action}.`,
    });

    pool.push({
      id: `${m.id}:action`,
      type: "action",
      muscleId: m.id,
      prompt: `What is the primary action of ${m.name}?`,
      ...makeOptions(m.action, pick(otherValues(sameRegion.concat(others), "action", m.action), 3)),
      explain: `${m.name}: ${m.origin} → ${m.insertion}.`,
    });

    pool.push({
      id: `${m.id}:nerve`,
      type: "nerve",
      muscleId: m.id,
      prompt: `Which nerve innervates ${m.name}?`,
      ...makeOptions(m.nerve, pick(allNerves, 3, [m.nerve])),
      explain: `${m.name} — ${m.nerve} (${m.root}).`,
    });

    if (m.root !== "Segmental" && m.root !== "CN XI") {
      pool.push({
        id: `${m.id}:root`,
        type: "root",
        muscleId: m.id,
        prompt: `Which spinal levels chiefly supply ${m.name}?`,
        ...makeOptions(m.root, pick(allRoots, 3, [m.root])),
        explain: `${m.name} — ${m.nerve}, ${m.root}.`,
      });
    }
  }
  return pool;
}

/**
 * A quiz set of `count` questions, no more than one per muscle, shuffled.
 * `types` optionally restricts the question types (e.g. skip "identify"
 * until muscle images exist).
 */
export function pickQuiz(pool, { count = 10, types = QUESTION_TYPES } = {}) {
  const eligible = shuffle(pool.filter((q) => types.includes(q.type)));
  const usedMuscles = new Set();
  const out = [];
  for (const q of eligible) {
    if (usedMuscles.has(q.muscleId)) continue;
    usedMuscles.add(q.muscleId);
    out.push(q);
    if (out.length >= count) break;
  }
  // If we ran out of distinct muscles, top up allowing repeats.
  for (const q of eligible) {
    if (out.length >= count) break;
    if (!out.includes(q)) out.push(q);
  }
  return out;
}

export { QUESTION_TYPES };
