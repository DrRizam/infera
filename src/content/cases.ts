import type { ClinicalCase } from "../types";

export const cases: ClinicalCase[] = [
  // ───────────────────────────────────────────────────────────────────────
  // CASE 1 — The Hairdresser (RCRSP)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "case-hairdresser",
    title: "The Hairdresser",
    presentingComplaint: "Shoulder pain",
    difficulty: 1,
    patient: {
      age: 42,
      sex: "Female",
      occupation: "Hairdresser",
      opening:
        "It's been creeping up for about three months. Reaching up to cut hair is getting really hard, and it's started waking me at night.",
      bullets: [
        "Gradual onset right shoulder pain, ~3 months",
        "Difficulty reaching overhead",
        "Night pain",
        "No trauma reported",
        "Self-referred, no imaging",
      ],
    },
    standoutOptions: [
      { text: "Occupation involves sustained overhead arm postures", isKey: true, note: "Hairdressing = hours of elevation under load. A classic RCRSP exposure profile — and a clue about what recovery must accommodate." },
      { text: "Gradual onset with no trauma", isKey: true, note: "Points away from structural traumatic injury (acute tear, fracture) and toward load-related or capsular conditions." },
      { text: "Night pain is present", isKey: false, note: "Worth noting but weakly discriminative — most painful shoulders hurt at night. The QUALITY of night pain is what matters, and you don't know it yet." },
      { text: "Age 42", isKey: true, note: "Prime age for RCRSP, and entering frozen-shoulder territory (40–60). Too old for first-time instability, young for GH OA or degenerate cuff tear." },
      { text: "She is female", isKey: false, note: "Slightly raises frozen shoulder risk, but on its own this doesn't shift your differential much." },
    ],
    subjective: {
      budget: 6,
      questions: [
        { id: "q-nightpain", question: "Tell me about the night pain — can you find a comfortable position?", answer: "It's mainly when I roll onto that side. If I shift onto my back with a pillow under the arm, it settles.", value: 2, valueNote: "Critical question. Positional night pain = mechanical. The answer largely defuses the sinister-pathology concern that 'night pain' raises." },
        { id: "q-stiffness", question: "Does the shoulder feel stiff, or is it more that pain stops you?", answer: "It's the pain that stops me. If I push through, it moves — it just really hurts up high.", value: 2, valueNote: "Directly probes RCRSP vs frozen shoulder — the top two differentials. 'Pain-limited, not stiff' leans RCRSP; you'll confirm with passive ROM." },
        { id: "q-neck", question: "Any neck pain, or pins and needles into the arm or hand?", answer: "No, my neck's fine. No tingling anywhere.", value: 2, valueNote: "Essential screening. No neck symptoms and nothing distal to the elbow makes cervical referral much less likely — cheap, high-value question." },
        { id: "q-systemic", question: "Any weight loss, fevers, night sweats, or feeling generally unwell?", answer: "No, nothing like that. I feel fine otherwise.", value: 2, valueNote: "The red-flag screen. Takes 10 seconds and must happen in every gradual-onset presentation with night pain." },
        { id: "q-aggs", question: "What exactly makes it worse during a working day?", answer: "Holding the dryer up, foils on the top layers — anything with my elbow above my shoulder. Bad by end of the day.", value: 1, valueNote: "Confirms the overhead-load pattern you'd already inferred from her occupation. Useful, but partially redundant." },
        { id: "q-meds", question: "Any medical conditions — diabetes, thyroid problems?", answer: "No, I'm healthy. No medications.", value: 1, valueNote: "Reasonable — diabetes/thyroid would raise frozen shoulder probability. Negative answer nudges you slightly toward RCRSP." },
        { id: "q-prev", question: "Ever had trouble with this shoulder before?", answer: "Little niggles after long weeks, but nothing like this.", value: 1, valueNote: "Prior niggles fit a cumulative load story. Mildly supportive, not decisive." },
        { id: "q-dominant", question: "Is that your dominant arm?", answer: "Yes, right-handed.", value: 0, valueNote: "You could infer this from the occupation story. Low yield — a spent question that discriminates between none of your differentials." },
        { id: "q-sleep-hours", question: "How many hours of sleep are you getting?", answer: "Six-ish, broken.", value: 0, valueNote: "Relevant to management later, but discriminates nothing diagnostically right now. In a time-limited subjective exam, this is a luxury." },
        { id: "q-sport", question: "Do you play any sports?", answer: "The odd yoga class.", value: 0, valueNote: "Her occupational exposure dwarfs anything recreational. Low yield here." },
      ],
    },
    differentials: [
      { name: "Rotator cuff related shoulder pain", expertRank: 1, rationale: "Overhead occupational load, gradual onset, age 42, pain-limited (not stiffness-limited) movement, positional night pain. The prior probability and every history finding line up." },
      { name: "Frozen shoulder", expertRank: 2, rationale: "Right demographic (40s, female) and night pain fits — but she reports pain-limitation rather than stiffness, and no diabetes/thyroid. Stays second until passive ROM decides it." },
      { name: "Acromioclavicular joint pathology", expertRank: 3, rationale: "Overhead-aggravated, but she doesn't localize pain to the joint itself, and mid-range aggravation fits subacromial better than end-range ACJ pain." },
      { name: "Cervical radiculopathy", expertRank: 4, rationale: "Screened well: no neck pain, nothing distal to the elbow, no paraesthesia. Kept on the list only until the objective neck screen confirms." },
      { name: "Full-thickness rotator cuff tear", expertRank: 5, rationale: "No trauma, age 42, no reported weakness — atraumatic full-thickness tears are uncommon this young. Strength testing will screen it." },
    ],
    examSections: [
      { name: "Observation", findings: ["Mild protracted posture, no wasting of supraspinatus/infraspinatus fossae, no deformity, no swelling."], relevance: "medium", relevanceNote: "Quick and worthwhile: visible cuff wasting would raise suspicion of a chronic tear; nothing here changes the picture." },
      { name: "Active ROM", findings: ["Flexion 170° with painful arc 70–120°", "Abduction 160°, painful through mid-range", "Hand-behind-back to L1 with lateral shoulder pain"], relevance: "high", relevanceNote: "The painful mid-range arc with near-full range is the classic RCRSP pattern — pain during, not restriction of, movement." },
      { name: "Passive ROM", findings: ["Passive external rotation 80°, equal to the left", "Full passive elevation with end-range discomfort only"], relevance: "high", relevanceNote: "THE pivotal finding. Full, symmetrical passive ER effectively rules out frozen shoulder. This single measurement resolves your top differential question." },
      { name: "Strength testing", findings: ["Resisted external rotation: pain but grade 5-", "Empty can: painful, mild give-way with pain", "No lag signs: holds ER position without drift"], relevance: "high", relevanceNote: "Pain WITH preserved strength and no lag = irritable but structurally intact cuff. Downgrades full-thickness tear to near-zero." },
      { name: "Neurological screen", findings: ["Reflexes, myotomes, dermatomes all normal", "Neck AROM full; overpressure and quadrant do not reproduce shoulder pain"], relevance: "medium", relevanceNote: "Confirms what the history suggested — the neck is clear. Quick to do, and now cervical referral is properly excluded rather than assumed away." },
      { name: "Palpation", findings: ["Diffuse tenderness around greater tuberosity", "ACJ non-tender, cross-body adduction negative"], relevance: "low", relevanceNote: "Tuberosity tenderness is common and non-specific. The useful bit is the negative ACJ findings, which drop that differential further." },
    ],
    specialTests: {
      budget: 3,
      tests: [
        { stats: { name: "Hawkins-Kennedy", target: "Subacromial pain / RCRSP", sensitivity: 80, specificity: 56, lrPlus: 1.8, lrMinus: 0.36 }, resultInCase: "positive", interpretation: "Positive, but with LR+ 1.8 it barely shifts probability. Its value would have been a NEGATIVE result arguing against RCRSP. Fine to include, weak alone.", recommended: true },
        { stats: { name: "Painful arc", target: "Subacromial pain / RCRSP", sensitivity: 74, specificity: 81, lrPlus: 3.7, lrMinus: 0.36 }, resultInCase: "positive", interpretation: "One of the better-performing single findings, and combined with Hawkins + resisted ER pain it forms a cluster with LR+ ~10. Smart pick.", recommended: true },
        { stats: { name: "ER lag sign", target: "Full-thickness cuff tear", sensitivity: 46, specificity: 94, lrPlus: 7.2, lrMinus: 0.57 }, resultInCase: "negative", interpretation: "Negative — she holds the position easily. High-specificity tear tests earn their place by being NEGATIVE here: they cheaply close down the tear branch.", recommended: true },
        { stats: { name: "Spurling's test", target: "Cervical radiculopathy", sensitivity: 50, specificity: 93, lrPlus: 7.1, lrMinus: 0.54 }, resultInCase: "negative", interpretation: "Defensible as a formal neck close-out, but the history and neuro screen had already made cervical referral unlikely — a budget spot mostly spent on confirmation.", recommended: false },
        { stats: { name: "O'Brien's active compression", target: "SLAP / labral lesion", sensitivity: 67, specificity: 37, lrPlus: 1.1, lrMinus: 0.9 }, resultInCase: "positive", interpretation: "Positive — and meaningless. With LR+ ~1.1 this test barely outperforms a coin flip, and nothing in her presentation suggested labral pathology. A wasted pick that can only mislead.", recommended: false },
        { stats: { name: "Apprehension test", target: "Anterior instability", sensitivity: 66, specificity: 95, lrPlus: 13.2 }, resultInCase: "negative", interpretation: "Negative — unsurprising. At 42 with no instability history, pre-test probability was so low that even this excellent test couldn't teach you anything.", recommended: false },
      ],
    },
    redFlagCheck: {
      prompt: "Before committing to a diagnosis: which statements about red flags in THIS case are correct?",
      items: [
        { text: "Her night pain pattern (positional, relieved by repositioning) is mechanical and does not itself require escalation", correct: true, note: "Right. You asked the follow-up that defused it — this is the difference between hearing 'night pain' and understanding it." },
        { text: "The systemic screen (weight loss, fever, malaise) was negative and documented", correct: true, note: "Done during the subjective exam. Screening isn't only for suspicious cases — it's for every case, and it must be documented." },
        { text: "She needs urgent imaging to exclude malignancy before starting rehab", correct: false, note: "No indication: mechanical behaviour, negative systemic screen, exam reproduces her pain. Imaging here invites incidental findings, not safety." },
        { text: "If her pain becomes constant and non-mechanical despite treatment, the diagnosis must be revisited", correct: true, note: "Safety-netting is a red-flag skill. A diagnosis is a hypothesis on probation — tell her what changes should bring her back." },
      ],
    },
    finalDiagnosis: {
      options: ["Rotator cuff related shoulder pain", "Frozen shoulder (early stage)", "Acromioclavicular joint pathology", "Cervical radiculopathy", "Full-thickness rotator cuff tear"],
      correctIndex: 0,
    },
    reveal: {
      diagnosis: "Rotator cuff related shoulder pain (RCRSP)",
      reasoning: [
        "Prior probability: a 42-year-old overhead worker with gradual atraumatic shoulder pain — RCRSP is the most common diagnosis fitting this profile before any examination.",
        "History: pain-limited (not stiffness-limited) movement, overhead aggravation, positional night pain, negative systemic and neuro screens. Every answer nudged the same direction.",
        "The pivot: full, symmetrical passive external rotation. This single finding collapsed frozen shoulder — the main competitor — from the differential.",
        "Strength testing with no lag signs closed the tear branch; a quiet neck screen closed the cervical branch; a non-tender ACJ with negative cross-body adduction closed the ACJ branch.",
        "The positive cluster (Hawkins + painful arc + painful resisted testing) then ruled IN what the history predicted — tests confirmed, they didn't discover.",
      ],
      excluded: [
        { name: "Frozen shoulder", why: "Full passive ER with symmetrical end-feel. Established frozen shoulder cannot hide from that measurement." },
        { name: "Full-thickness cuff tear", why: "Grade 5- strength, no lag signs, age 42, no trauma. Pre-test probability was low and the exam lowered it further." },
        { name: "Cervical radiculopathy", why: "No neck symptoms, nothing distal to the elbow, normal neuro screen, neck movement testing silent." },
        { name: "ACJ pathology", why: "No one-finger localization to the joint, ACJ non-tender, cross-body adduction negative." },
      ],
    },
    evidence: {
      guidelines: [
        "Exercise-based rehabilitation is first-line: progressive cuff and scapular loading over ≥12 weeks matches surgical outcomes (CSAW trial: decompression ≈ placebo surgery).",
        "Routine early imaging is not recommended in atraumatic presentations — cuff 'abnormalities' appear in ~20–25% of asymptomatic adults.",
        "Corticosteroid injection: short-term pain relief only; no long-term advantage. Consider only if pain blocks engagement with loading.",
      ],
      pearls: [
        "One passive ER measurement did more diagnostic work than every special test combined. Cheap findings first, fancy tests second.",
        "Her job is her provocation AND her rehab constraint — a plan that ignores 8 hours of daily overhead work will fail. Load management beats rest.",
        "Expect flare-ups during loading programs; pre-warning her converts a 'failed treatment' into an expected bump.",
      ],
      mistakes: [
        "Hearing 'night pain' and jumping to sinister pathology — or worse, ignoring it entirely. The follow-up question ('can you find a comfortable position?') is what separates the two errors.",
        "Running six special tests and treating each positive as a diagnosis. Two of the tests in this case were positive AND uninformative.",
        "Calling this 'impingement' to the patient — the bone-spur narrative primes patients toward surgery the evidence doesn't support.",
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // CASE 2 — The Locked Shoulder (frozen shoulder in a diabetic patient)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "case-frozen",
    title: "The Locked Shoulder",
    presentingComplaint: "Shoulder pain and stiffness",
    difficulty: 2,
    patient: {
      age: 53,
      sex: "Male",
      occupation: "Accountant",
      opening:
        "It started aching about five months ago for no reason. The pain was awful for a while. Now it's a bit less angry, but the arm just… won't go. I can't reach my back pocket.",
      bullets: [
        "Left shoulder, 5 months, atraumatic",
        "Severe pain phase, now increasing stiffness",
        "Marked functional loss (reaching behind, overhead)",
        "GP referral; no imaging yet",
      ],
    },
    standoutOptions: [
      { text: "A pain-first, stiffness-later timeline", isKey: true, note: "The classic frozen shoulder story arc: an angry painful phase that partially settles as stiffness takes over. Few other conditions evolve this way." },
      { text: "Loss of hand-behind-back function", isKey: true, note: "Functional loss in MULTIPLE directions (behind back = IR, overhead = elevation) suggests a global capsular problem, not a single painful arc." },
      { text: "Age 53", isKey: true, note: "Dead centre of the frozen shoulder window (40–60) — and also the age where GH OA and degenerate cuff disease enter the picture. Age narrows and complicates simultaneously." },
      { text: "He is an accountant", isKey: false, note: "No meaningful occupational load exposure — which actually matters as an ABSENCE: no overhead-load story to explain a cuff problem." },
      { text: "The pain started 'for no reason'", isKey: false, note: "Atraumatic onset is consistent with several differentials here; it's the trajectory since onset that discriminates, not the onset itself." },
    ],
    subjective: {
      budget: 6,
      questions: [
        { id: "q2-diabetes", question: "Do you have diabetes, or any thyroid problems?", answer: "Type 2 diabetes, diagnosed four years ago. Metformin.", value: 2, valueNote: "The highest-yield question in this case. Diabetes multiplies frozen shoulder risk ~5-fold and predicts a longer, more severe course — it changes diagnosis AND prognosis." },
        { id: "q2-direction", question: "Which movements are hard — one direction, or everything?", answer: "Honestly, everything. Reaching up, out to the side, behind my back. It all jams.", value: 2, valueNote: "Multidirectional restriction points to capsule (frozen shoulder, GH OA) over a painful-arc cuff problem. Directly splits the differential." },
        { id: "q2-trajectory", question: "Is the pain getting better, worse, or changing character?", answer: "The pain's actually a bit better than at its worst. It's the stiffness that's getting worse.", value: 2, valueNote: "Pain improving while stiffness worsens is the freezing→frozen transition — near-pathognomonic trajectory when present." },
        { id: "q2-systemic", question: "Weight loss, fevers, night sweats, previous cancer?", answer: "None of that.", value: 2, valueNote: "Mandatory screen — doubly so here, because severe unrelenting shoulder pain in a 50s male with a 'quiet' exam story could be sinister. Negative screen is load-bearing." },
        { id: "q2-nightpain", question: "How are nights?", answer: "Rough at the start — couldn't lie on it at all. Better now unless I roll onto it.", value: 1, valueNote: "Fits the frozen shoulder arc (worst nights during freezing phase) but doesn't discriminate strongly from other painful shoulders." },
        { id: "q2-othershoulder", question: "Any problems with the other shoulder, now or before?", answer: "No, though my brother had something similar.", value: 1, valueNote: "Contralateral involvement occurs in up to 20% of frozen shoulders (often sequentially, especially in diabetes) — worth logging for the future." },
        { id: "q2-neck", question: "Any neck pain or symptoms into the hand?", answer: "No.", value: 1, valueNote: "Reasonable screen. The presentation was never very cervical (stiffness-dominant, multidirectional), but cheap to close." },
        { id: "q2-work", question: "Is work affected?", answer: "Typing's fine. Jacket sleeves and car reversing are the problems.", value: 0, valueNote: "Useful for goal-setting later, diagnostically inert now. In a budgeted subjective exam, this question cost you a discriminating one." },
        { id: "q2-diet", question: "How's your diet been lately?", answer: "Er… fine? Trying to be good with the diabetes.", value: 0, valueNote: "Not a discriminator for any shoulder differential. Save lifestyle conversation for management." },
        { id: "q2-injections", question: "Have you had any injections or procedures on the shoulder?", answer: "No, nothing.", value: 1, valueNote: "Sensible: excludes post-injection infection context and tells you no treatment has been trialled yet." },
      ],
    },
    differentials: [
      { name: "Frozen shoulder", expertRank: 1, rationale: "Age 53 + diabetes + pain-then-stiffness trajectory + multidirectional restriction. Four independent findings converge; prior probability is now dominant." },
      { name: "Glenohumeral osteoarthritis", expertRank: 2, rationale: "The great impersonator here — same capsular pattern, same demographic. Clinically near-identical; only the X-ray truly separates them. Must stay second." },
      { name: "Rotator cuff related shoulder pain", expertRank: 3, rationale: "Common at this age but doesn't explain multidirectional PASSIVE restriction — RCRSP hurts, it doesn't lock." },
      { name: "Full-thickness rotator cuff tear", expertRank: 4, rationale: "Possible at 53 even atraumatically, but tears cause weakness and active-passive dissociation, not global capsular stiffness." },
      { name: "Malignancy presenting as shoulder pain", expertRank: 5, rationale: "Considered because of the severe-pain phase — but the mechanical behaviour, improving pain, and negative systemic screen make it very unlikely. It was on the list to be excluded deliberately, not by accident." },
    ],
    examSections: [
      { name: "Observation", findings: ["Holds arm guarded at side; mild deltoid disuse atrophy; no fossa wasting; no swelling or deformity."], relevance: "medium", relevanceNote: "Disuse atrophy fits 5 months of guarding. Absent cuff-fossa wasting argues against chronic massive tear." },
      { name: "Active ROM", findings: ["Flexion 95°", "Abduction 80° with a rigid halt", "ER at side 15° (other side 70°)", "Hand-behind-back reaches buttock only"], relevance: "high", relevanceNote: "Global active restriction in every plane — but active ROM alone can't separate 'won't move' (capsule) from 'hurts too much to move' (pain inhibition). Passive testing must follow." },
      { name: "Passive ROM", findings: ["Passive ER 18° vs 70° — ~75% loss with firm capsular end-feel", "Passive abduction 85°, hard stop", "Passive flexion 100°"], relevance: "high", relevanceNote: "The case-defining finding. Massive passive ER loss with capsular end-feel = capsular disease. ER is proportionally the worst-affected movement: the capsular pattern, exactly as described." },
      { name: "Strength testing", findings: ["Resisted ER strong (tested in available range)", "Belly press strong", "No lag signs testable within restricted range — position-holding normal where reachable"], relevance: "high", relevanceNote: "Preserved strength within available range argues against a functionally significant tear — the arm is locked, not weak. Downgrades the tear differential." },
      { name: "Neurological screen", findings: ["Upper limb neuro exam normal; neck movements full and silent"], relevance: "low", relevanceNote: "Nothing pointed here, but it's now formally closed. Low yield was predictable from the history — which is why it ranks low, not because it was wrong to check." },
      { name: "Palpation", findings: ["Diffuse anterior capsule tenderness; nothing focal at tuberosity or ACJ"], relevance: "low", relevanceNote: "Diffuse tenderness in a stiff shoulder adds nothing discriminative. This was your least informative minutes." },
    ],
    specialTests: {
      budget: 3,
      tests: [
        { stats: { name: "Plain X-ray (AP + axillary)", target: "GH OA / other bony pathology", sensitivity: 90, specificity: 90 }, resultInCase: "negative", interpretation: "Normal joint space, no osteophytes, no lesions. THE critical investigation: frozen shoulder is a normal-X-ray diagnosis, and this is the only way to exclude its clinical twin, GH OA. Not a 'special test' in the classic sense — which is the lesson.", recommended: true },
        { stats: { name: "Coracoid pain test", target: "Frozen shoulder", sensitivity: 96, specificity: 87, lrPlus: 7.4, lrMinus: 0.05 }, resultInCase: "positive", interpretation: "Pressure on the coracoid reproduces marked tenderness vs the other side. One of the few findings with published accuracy for frozen shoulder specifically — supportive, though the ROM pattern remains the core of the diagnosis.", recommended: true },
        { stats: { name: "ER lag sign", target: "Full-thickness cuff tear", sensitivity: 46, specificity: 94, lrPlus: 7.2 }, resultInCase: "negative", interpretation: "Within his available range he holds positions without drift. Reasonable tear close-out, though restricted range limits test validity — a subtlety worth knowing: stiffness degrades many shoulder tests.", recommended: true },
        { stats: { name: "Hawkins-Kennedy", target: "Subacromial pain", sensitivity: 80, specificity: 56, lrPlus: 1.8 }, resultInCase: "positive", interpretation: "'Positive' — but the manoeuvre forces a stiff capsule to end-range; of course it hurts. In a globally stiff shoulder, impingement tests produce false positives structurally. Uninformative pick here.", recommended: false },
        { stats: { name: "Spurling's test", target: "Cervical radiculopathy", sensitivity: 50, specificity: 93, lrPlus: 7.1 }, resultInCase: "negative", interpretation: "Negative, and predictably so — nothing in this presentation was cervical. A budget slot spent where pre-test probability was already negligible.", recommended: false },
        { stats: { name: "O'Brien's active compression", target: "SLAP lesion", sensitivity: 67, specificity: 37, lrPlus: 1.1 }, resultInCase: "positive", interpretation: "Positive and worthless — poor specificity, no labral hypothesis on the table, and the restricted range invalidates the test position anyway. The trap pick.", recommended: false },
      ],
    },
    redFlagCheck: {
      prompt: "Which statements about red flags and safety in THIS case are correct?",
      items: [
        { text: "The severe pain phase warranted deliberate exclusion of sinister pathology, which the history and screen have now done", correct: true, note: "Frozen shoulder's freezing phase mimics 'severe unrelenting pain'. It earns benignity through screening — improving trajectory, mechanical behaviour, negative systemic screen — not by assumption." },
        { text: "An X-ray is justified in this presentation", correct: true, note: "Yes — not as a red-flag hunt but because GH OA is clinically indistinguishable. Marked passive restriction is one of the accepted indications for plain imaging in atraumatic shoulder pain." },
        { text: "His diabetes is irrelevant to prognosis", correct: false, note: "Diabetic frozen shoulder runs longer and more severe, and responds less predictably to injection. Prognostic honesty ('this typically takes 1–3 years; diabetes can extend that') is part of safe management." },
        { text: "If night pain becomes constant and positional relief disappears, re-investigation is required", correct: true, note: "Correct safety-netting. The diagnosis is on probation; a change to non-mechanical behaviour reopens it." },
      ],
    },
    finalDiagnosis: {
      options: ["Frozen shoulder (adhesive capsulitis)", "Glenohumeral osteoarthritis", "Rotator cuff related shoulder pain", "Full-thickness rotator cuff tear", "Cervical radiculopathy"],
      correctIndex: 0,
    },
    reveal: {
      diagnosis: "Frozen shoulder (adhesive capsulitis) — freezing→frozen transition",
      reasoning: [
        "Demographics + comorbidity: 53 years old with type 2 diabetes — the single strongest risk profile for frozen shoulder in MSK practice.",
        "Trajectory: severe pain phase partially settling as stiffness worsens — the disease's signature arc, and almost no competitor evolves this way.",
        "Examination: ~75% passive ER loss with a firm capsular end-feel, restriction in the capsular pattern (ER worst), preserved strength within range.",
        "The X-ray did the final discriminating work: a normal joint rules out GH OA, the only condition that genuinely mimics this exam.",
        "Note what special tests contributed: almost nothing. Two 'positive' tests were structurally false positives caused by the stiffness itself. The diagnosis was made by history, passive ROM, and a plain X-ray.",
      ],
      excluded: [
        { name: "Glenohumeral OA", why: "Identical clinical picture — excluded ONLY by the normal X-ray. This is why the X-ray was the smartest 'special test' on the menu." },
        { name: "Full-thickness cuff tear", why: "Strong within available range, no lag, no wasting, and tears don't cause firm capsular end-feels." },
        { name: "RCRSP", why: "RCRSP hurts through an arc with preserved passive range; it cannot produce a 75% passive ER loss." },
        { name: "Malignancy", why: "Improving pain trajectory, mechanical behaviour, negative systemic screen. Deliberately excluded, not forgotten." },
      ],
    },
    evidence: {
      guidelines: [
        "Natural history: typically 1–3 years through freezing, frozen, and thawing phases; diabetes predicts longer, more severe courses.",
        "Freezing (pain-dominant) phase: intra-articular corticosteroid injection has the best evidence for short-term pain relief and is most useful early.",
        "Frozen (stiffness-dominant) phase: emphasis shifts to ROM within tolerable limits; aggressive stretching into pain shows no advantage and can flare symptoms.",
      ],
      pearls: [
        "Frozen shoulder is a NORMAL X-ray diagnosis — the film exists to exclude its twin (GH OA), not to confirm capsulitis.",
        "In a stiff shoulder, most special tests break: end-range provocation tests false-positive structurally. Trust the passive ROM pattern over the test battery.",
        "Ask every stiff shoulder about diabetes and thyroid disease. It changes probability, prognosis, and the honesty of your patient conversation.",
      ],
      mistakes: [
        "Diagnosing 'RCRSP with reduced ROM' by never actually measuring passive ER against the other side.",
        "Skipping the X-ray and treating GH OA as frozen shoulder for a year.",
        "Promising quick results — undersetting expectations destroys therapeutic alliance in a 1–3 year condition.",
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // CASE 3 — The Warehouse Worker (lumbar radiculopathy + CES screening)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "case-warehouse",
    title: "The Warehouse Worker",
    presentingComplaint: "Low back pain",
    difficulty: 2,
    patient: {
      age: 34,
      sex: "Male",
      occupation: "Warehouse operative",
      opening:
        "I felt something go in my back lifting a pallet three days ago. Since yesterday it's shooting right down my right leg into the side of my foot. Sitting is agony. I'm scared I've done something serious.",
      bullets: [
        "Acute low back pain, lifting injury 3 days ago",
        "New right leg pain to the lateral foot since yesterday",
        "Worse sitting; painful cough/sneeze",
        "Very anxious about his back",
        "No imaging; walked in unaided",
      ],
    },
    standoutOptions: [
      { text: "Leg pain extends below the knee to the foot", isKey: true, note: "Distal, narrow-band leg pain is the radicular signature — this moved the presentation from 'back pain' to 'back pain with likely root involvement'." },
      { text: "The leg pain appeared a day AFTER the back injury and is progressing", isKey: true, note: "An evolving picture demands active monitoring — today's exam is a baseline, and progression (especially neurological) changes the plan." },
      { text: "He is visibly frightened it's 'something serious'", isKey: true, note: "Fear this early is a yellow flag for chronicity — and it means your explanation today is itself a treatment. What you say will either calm or catastrophize." },
      { text: "Worse with sitting and coughing", isKey: false, note: "Classic discogenic behaviour — supportive detail, but it refines rather than reshapes the hypothesis the leg pain already created." },
      { text: "He walked in unaided", isKey: false, note: "Mildly reassuring about gross motor function, but plenty of significant pathology walks in unaided. Weak evidence either way." },
    ],
    subjective: {
      budget: 6,
      questions: [
        { id: "q3-ces", question: "I need to ask some important safety questions: any numbness around your bottom or genitals, any change in bladder or bowel control, any new problems with sexual function?", answer: "No… nothing like that. Everything works normally.", value: 2, valueNote: "THE question in this case. Every patient with back pain and leg symptoms gets a verbal cauda equina screen, asked explicitly and documented. A negative screen today also sets the baseline for safety-netting." },
        { id: "q3-both-legs", question: "Is the pain in one leg or both?", answer: "Just the right.", value: 2, valueNote: "Bilateral leg pain would escalate concern toward central compromise. Unilateral fits routine radiculopathy — a quick, high-stakes discriminator." },
        { id: "q3-neuro", question: "Any numbness, pins and needles, or weakness in the leg or foot?", answer: "Pins and needles along the outside of my foot. Haven't noticed weakness.", value: 2, valueNote: "Maps the symptoms to a territory (lateral foot = S1) and screens for deficit. Directs your neuro exam before you've laid a hand on him." },
        { id: "q3-behaviour", question: "What makes it better, what makes it worse?", answer: "Sitting and bending are the worst. Walking about eases the leg a bit. Lying on my side with knees up helps.", value: 2, valueNote: "Flexion-loaded aggravation with relief in unloaded positions — coherent mechanical discogenic behaviour, and the 'walking eases it' detail is a treatment clue." },
        { id: "q3-systemic", question: "Any fevers, weight loss, history of cancer, or feeling unwell?", answer: "No, I'm never ill.", value: 1, valueNote: "Correct to screen — though at 34 with a clear mechanical onset, pre-test probability of sinister pathology was already low. Cheap and necessary, just not case-turning." },
        { id: "q3-work", question: "What does your job involve, and are you off work now?", answer: "Lifting all day. They've signed me off two weeks. Honestly I'm worried about my job.", value: 1, valueNote: "Feeds prognosis and the yellow-flag picture (job worry compounds fear). Important for management, moderate for diagnosis." },
        { id: "q3-previous", question: "Have you had back trouble before?", answer: "Odd twinges after heavy shifts. Never like this, never down the leg.", value: 1, valueNote: "First-ever radicular episode — relevant context, mildly informative." },
        { id: "q3-meds", question: "Are you taking anything for it?", answer: "Ibuprofen from the garage. Barely touches it.", value: 0, valueNote: "Management detail, no diagnostic movement. In a budgeted interview this displaced a discriminating question." },
        { id: "q3-sleep", question: "How are you sleeping?", answer: "Badly — can't get comfortable.", value: 0, valueNote: "Expected in acute radicular pain and doesn't discriminate between your differentials. Low yield." },
        { id: "q3-sport", question: "Do you do any sport or training?", answer: "Five-a-side on Thursdays.", value: 0, valueNote: "Goal-setting material for later, not a diagnostic question now." },
      ],
    },
    differentials: [
      { name: "Lumbar radiculopathy (disc herniation)", expertRank: 1, rationale: "Flexion-load injury → below-knee dermatomal pain (S1 territory) with paraesthesia, worse sitting/cough. Every feature converges; age and mechanism fit perfectly." },
      { name: "Non-specific LBP with somatic referred pain", expertRank: 2, rationale: "The main alternative — but somatic referral rarely projects below the knee or brings dermatomal paraesthesia. Ranked second and distinguishable on exam." },
      { name: "Facet joint pain", expertRank: 3, rationale: "Acute mechanical LBP is often facet-driven, but the pattern is extension-loaded and proximal — this flexion-sitting-cough picture argues against it." },
      { name: "Cauda equina syndrome", expertRank: 4, rationale: "Must be actively considered and screened in every radicular presentation — and it was: negative saddle/bladder/bowel/sexual screen keeps it low but under safety-net surveillance." },
      { name: "Hip pathology", expertRank: 5, rationale: "Wrong pain map (hip refers to groin/thigh, not lateral foot), wrong age for OA, no hip-specific aggravators. On the list only for completeness." },
    ],
    examSections: [
      { name: "Observation & gait", findings: ["Antalgic lean slightly away from the right (contralateral shift)", "Walks guardedly, full weight-bearing", "No wasting"], relevance: "medium", relevanceNote: "A lateral shift fits discogenic pathology and is worth documenting; gait grossly intact adds gentle reassurance about motor function." },
      { name: "Lumbar AROM", findings: ["Flexion: fingertips to knees, reproduces back AND right leg pain", "Extension: mild central discomfort only", "Repeated extension in standing: leg pain retreats from foot to calf (partial centralization)"], relevance: "high", relevanceNote: "Flexion provokes the leg symptom; repeated extension begins to CENTRALIZE it. That's both a diagnostic confirmation and a ready-made treatment direction — the most management-shaping finding in the exam." },
      { name: "Neurological examination", findings: ["Ankle reflex: diminished on the right", "Myotomes: plantarflexion fatigues on repeated right heel raises (4+/5), others intact", "Sensation: reduced light touch lateral border of right foot", "Babinski negative, no clonus"], relevance: "high", relevanceNote: "A coherent S1 root picture: reflex, motor, and sensory findings all in one territory, with no upper motor neuron signs. This is the exam that converts 'probable radiculopathy' into a documented, monitorable deficit baseline." },
      { name: "Neurodynamic testing", findings: ["Right SLR: reproduces leg pain to the foot at 40°", "Left (crossed) SLR: reproduces right leg pain at 60°"], relevance: "high", relevanceNote: "Positive SLR supports root irritation; the POSITIVE CROSSED SLR is the high-specificity finding — few things other than disc herniation do that." },
      { name: "Hip screen", findings: ["Full, painless passive hip ROM including internal rotation; no groin pain on loading"], relevance: "medium", relevanceNote: "Quick exclusion of the hip as a contributor — cheap to do, and now the differential list is shorter by one." },
      { name: "Palpation", findings: ["Diffuse right paraspinal tenderness L4–S1", "No midline bony tenderness, no step deformity"], relevance: "low", relevanceNote: "Paraspinal tenderness is near-universal in acute LBP and discriminates nothing. The useful sliver: no midline bony tenderness (against fracture)." },
    ],
    specialTests: {
      budget: 3,
      tests: [
        { stats: { name: "Straight leg raise", target: "Lumbar disc herniation / root irritation", sensitivity: 91, specificity: 26, lrPlus: 1.2, lrMinus: 0.35 }, resultInCase: "positive", interpretation: "Positive at 40° reproducing HIS leg pain. High sensitivity means it had rule-out value; positive at low angle with distal symptoms is supportive within the whole picture.", recommended: true },
        { stats: { name: "Crossed straight leg raise", target: "Lumbar disc herniation", sensitivity: 29, specificity: 88, lrPlus: 2.4, lrMinus: 0.8 }, resultInCase: "positive", interpretation: "The star finding: raising the LEFT leg reproduces RIGHT leg pain. Specificity 88% — very few false positives. Combined with the S1 neuro deficit, the diagnosis is now clinically secure without imaging.", recommended: true },
        { stats: { name: "Slump test", target: "Neural mechanosensitivity", sensitivity: 84, specificity: 83, lrPlus: 4.9, lrMinus: 0.19 }, resultInCase: "positive", interpretation: "Positive with symptom reproduction released by cervical extension — confirms neural mechanosensitivity and adds a monitorable baseline for reassessment.", recommended: true },
        { stats: { name: "Lumbar X-ray", target: "Bony pathology", sensitivity: 60, specificity: 70 }, resultInCase: "negative", interpretation: "Not indicated: X-rays cannot show discs or roots, and nothing here suggests fracture. Ordering it adds radiation and false reassurance while answering the wrong question. Trap pick.", recommended: false },
        { stats: { name: "MRI lumbar spine (urgent)", target: "Disc herniation / root compression", sensitivity: 92, specificity: 78 }, resultInCase: "positive", interpretation: "It would indeed show the herniation — but with no red flags and no progressive/severe deficit, guidelines say manage clinically first: most radiculopathy improves in 6–12 weeks without imaging. MRI now changes nothing except his anxiety. Trap pick — 'would be abnormal' isn't 'is indicated'.", recommended: false },
        { stats: { name: "Prone instability test", target: "Lumbar 'instability' / stabilization response", sensitivity: 72, specificity: 58, lrPlus: 1.7 }, resultInCase: "negative", interpretation: "A test aimed at a different clinical question entirely (chronic LBP subgrouping) with mediocre accuracy. No hypothesis on the table needed it.", recommended: false },
      ],
    },
    redFlagCheck: {
      prompt: "Safety decisions in THIS case — which statements are correct?",
      items: [
        { text: "The cauda equina screen was negative today, but he must be given explicit worsening-signs instructions (saddle numbness, bladder change, bilateral leg pain → emergency department immediately)", correct: true, note: "This is the single most important sentence of the consultation. Disc herniations can progress; documented safety-netting with specific words is the standard of care in every radicular presentation." },
        { text: "The S1 deficit found today (reflex, sensory, 4+/5 plantarflexion) mandates urgent surgical referral", correct: false, note: "A mild, stable, single-root deficit is common in radiculopathy and typically recovers with conservative care. Urgent referral is for progressive or severe deficit (e.g. foot drop), intractable pain, or CES features — his baseline needs monitoring, not an ambulance." },
        { text: "His fear and job worry are risk factors for chronicity and should be addressed today, not after six weeks", correct: true, note: "Yellow flags predict disability better than the MRI would. Today's confident explanation — 'this is a nerve irritation with a good natural history, here's the plan' — is as therapeutic as anything physical." },
        { text: "Because his systemic screen was negative and onset was clearly mechanical, no imaging is currently indicated", correct: true, note: "Correct application of every guideline: no red flags + no progressive deficit + first 6 weeks = no imaging. The exam already localized the problem better than an X-ray could." },
      ],
    },
    finalDiagnosis: {
      options: ["Lumbar radiculopathy (S1) from disc herniation", "Non-specific low back pain with somatic referral", "Facet joint pain", "Cauda equina syndrome", "Hip pathology referring distally"],
      correctIndex: 0,
    },
    reveal: {
      diagnosis: "Lumbar radiculopathy — S1 root, consistent with L5/S1 disc herniation",
      reasoning: [
        "Mechanism and behaviour: flexion-load injury, then delayed distal leg pain worse with sitting and valsalva — the discogenic-radicular story arc.",
        "The history mapped the territory before the exam confirmed it: lateral-foot pain and paraesthesia said 'S1', and the exam found the matching reflex, sensory, and motor findings in exactly that territory.",
        "The positive crossed SLR (Sp 88%) is the finding that rules the herniation in; the routine SLR mostly earns its keep when negative.",
        "Cauda equina was actively screened — verbally, explicitly — and safety-netted. In radicular presentations, CES vigilance isn't a stage of the assessment; it's the standing condition of the whole management plan.",
        "No imaging: no red flags, no progressive/severe deficit, first weeks of a condition with a favourable natural history. Partial centralization with repeated extension already handed us the treatment direction.",
      ],
      excluded: [
        { name: "Somatic referred pain", why: "Referred pain doesn't produce dermatomal paraesthesia, a diminished ankle reflex, or a positive crossed SLR. The neuro exam decided this." },
        { name: "Facet joint pain", why: "Wrong loading pattern (flexion-aggravated, extension-relieving) and facet pain doesn't reach the foot." },
        { name: "Cauda equina syndrome", why: "Explicitly screened: no saddle change, normal bladder/bowel/sexual function, unilateral symptoms, no bilateral signs. Excluded for today — with re-entry criteria given to the patient in plain words." },
        { name: "Hip pathology", why: "Full painless hip ROM including internal rotation, no groin pain, and a pain map (lateral foot) the hip cannot produce." },
      ],
    },
    evidence: {
      guidelines: [
        "Acute radiculopathy without red flags or progressive deficit: conservative management first — advice, staying active, graded movement; most improve substantially within 6–12 weeks.",
        "Imaging only for red flags, progressive/severe neurological deficit, or when surgery/injection is being planned — not to 'confirm' a clinically clear diagnosis.",
        "Escalation criteria: any CES feature (emergency), progressive motor deficit (urgent), or intractable pain/no trajectory of improvement by ~6–12 weeks (consider imaging ± surgical opinion).",
      ],
      pearls: [
        "Ask the cauda equina questions out loud, every time, and document the answers. The screen that lives only in your head protects no one.",
        "A positive crossed SLR is worth more than an MRI report you don't need yet.",
        "Repeated-movement testing isn't just assessment — when symptoms centralize, you've simultaneously confirmed the diagnosis and found the treatment.",
        "In a frightened patient, your explanation IS the intervention: 'nerve irritation, good recovery odds, here's exactly what would make us act faster' beats any exercise sheet.",
      ],
      mistakes: [
        "Skipping the verbal CES screen because the patient 'would have mentioned' bladder symptoms. They don't mention them; you ask.",
        "Ordering an MRI to reassure an anxious patient — it does the opposite: incidental findings medicalize and entrench fear.",
        "Treating a mild stable deficit as a surgical emergency, or — the mirror error — failing to document it so progression can't be detected.",
        "Managing the disc and ignoring the fear. His beliefs about his back will outlast his leg pain.",
      ],
    },
  },
];
