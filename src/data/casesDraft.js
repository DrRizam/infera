// ── Draft case content — NEEDS_CLINICAL_REVIEW ──────────────────────────
// AI-drafted to widen the case library past the original hand-authored set.
// EVERY case here is content_status: "demonstration" and carries the
// "⚠️ Unverified demonstration content" badge in-app. Exam findings,
// test characteristics, and dispositions are drawn from standard
// outpatient-PT teaching but have NOT been checked against a source or
// reviewed by a clinician for this app. Do not treat as fact; review each
// before promoting content_status.
//
// Merged into CASES by src/data/cases.js.

const FULL_LADDER = [
  { id: "monitor", label: "Monitor — no active intervention needed", escalation: "monitor" },
  { id: "treat", label: "Treat conservatively in clinic", escalation: "treat" },
  { id: "refer_routine", label: "Refer routinely to another provider", escalation: "refer_routine" },
  { id: "investigate", label: "Order imaging/investigation before continuing", escalation: "investigate" },
  { id: "refer_urgent", label: "Refer urgently / same-day", escalation: "refer_urgent" },
];

export const DRAFT_CASES = [
  {
    id: "draft-cervical-radiculopathy",
    title: "The Radiating Arm",
    subject: "C6 cervical radiculopathy vs. peripheral entrapment",
    module: "msk",
    body_region: "neck",
    presenting_complaint: "Neck and arm pain with tingling into the thumb, three weeks",
    difficulty: 2,
    patient_age: 47,
    patient_sex: "male",
    occupation: "Electrician",
    chief_complaint:
      "My neck's been stiff for a few weeks and now the pain shoots down my arm into my thumb and first finger. It's worse when I look up or tip my head to that side.",
    presentation:
      "A 47-year-old electrician reports three weeks of right-sided neck pain that has progressed to arm pain with paraesthesia in the thumb and index finger. No trauma. Symptoms ease when he rests his hand on top of his head. No gait change, no bowel or bladder symptoms, no bilateral symptoms.",
    history_questions: [
      {
        id: "q-distribution",
        context: "You want to know whether this follows a nerve root pattern.",
        options: [
          "Where exactly do the pins and needles go — which fingers?",
          "Is the pain worse in the morning or the evening?",
          "Have you tried heat or ice on your neck?",
        ],
        correct: 0,
        answer: "Mostly the thumb and the finger next to it. Sometimes the outer forearm.",
        rationale:
          "A dermatomal distribution (thumb/index = C6) points toward a nerve root rather than a regional muscular problem, and helps separate root from a distal entrapment.",
        concept: "dermatome",
      },
      {
        id: "q-cord",
        context: "You're screening for anything more than a single nerve root.",
        options: [
          "Any clumsiness in the hands, buttoning shirts, or change in your walking?",
          "Does the pain keep you awake at night?",
          "Do you carry tools on that shoulder at work?",
        ],
        correct: 0,
        answer:
          "No, walking's fine and my hands work okay apart from the tingling. Just the one arm.",
        rationale:
          "Bilateral symptoms, hand clumsiness, or gait change would move this from radiculopathy toward myelopathy and change the urgency — it has to be asked even when the story sounds like a simple root.",
        concept: "myelopathy-screen",
      },
    ],
    red_flags: [
      {
        id: "myelopathy",
        label: "Gait change, hand clumsiness, or bilateral limb symptoms",
        present: false,
        severity: "red",
        rationale:
          "Would suggest cervical myelopathy (cord compression), not a single root — needs prompt imaging and referral, not conservative care.",
      },
      {
        id: "cad",
        label: "Dizziness, drop attacks, diplopia, or dysarthria with neck movement",
        present: false,
        severity: "red",
        rationale:
          "Cervical arterial dysfunction signs — a contraindication to end-range and manipulative techniques and a reason to refer.",
      },
      {
        id: "progressive-weakness",
        label: "Rapidly progressive or profound motor weakness",
        present: false,
        severity: "red",
        rationale:
          "Progressive neurological loss is a surgical-referral trigger rather than something to observe.",
      },
      {
        id: "night-pain-systemic",
        label: "Constant night pain with unexplained weight loss or fever",
        present: false,
        severity: "red",
        rationale: "Would broaden the differential toward infection or malignancy.",
      },
      {
        id: "severe-persistent-pain",
        label: "Severe pain unrelieved by any position",
        present: false,
        severity: "yellow",
        rationale:
          "Pain that a position of ease doesn't touch is a caution sign — reassess sooner and lower the threshold for imaging if it doesn't settle.",
      },
      {
        id: "widespread-sensory",
        label: "Paraesthesia spreading beyond one dermatome over time",
        present: false,
        severity: "yellow",
        rationale:
          "A spreading, non-dermatomal sensory pattern doesn't fit a single root and warrants a closer neurological look before committing to a mechanical plan.",
      },
      {
        id: "recent-neck-trauma",
        label: "Recent significant neck trauma",
        present: false,
        severity: "yellow",
        rationale:
          "Changes the pre-test probability of a bony or ligamentous injury; apply the Canadian C-spine rule before loading the neck.",
      },
      {
        id: "occupational-strain",
        label: "Sustained overhead work posture",
        present: true,
        severity: "yellow",
        rationale:
          "Not dangerous, but a genuine perpetuating factor — the plan should address the work posture, not just the neck.",
      },
    ],
    differentials: [
      {
        id: "c6-radic",
        label: "C6 cervical radiculopathy",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Dermatomal thumb/index paraesthesia, relief with the shoulder-abduction (Bakody) position, provocation with extension and ipsilateral rotation — the classic root picture.",
      },
      {
        id: "cts",
        label: "Carpal tunnel syndrome",
        must_not_miss: false,
        correct_rank: 2,
        notes:
          "Also gives thumb/index paraesthesia, but symptoms are typically nocturnal, distal, and without neck pain or a positive Spurling's.",
      },
      {
        id: "myelopathy-dx",
        label: "Cervical myelopathy",
        must_not_miss: true,
        correct_rank: 3,
        notes:
          "Unlikely with purely unilateral symptoms and a normal gait, but the must-not-miss — a missed cord signs the wrong plan.",
      },
      {
        id: "shoulder-referred",
        label: "Referred pain from the shoulder",
        must_not_miss: false,
        correct_rank: 4,
        notes: "Doesn't explain dermatomal paraesthesia or the response to neck position.",
      },
    ],
    examinations: [
      {
        id: "spurling",
        label: "Spurling's test",
        finding: "Reproduces the arm pain and paraesthesia on the right",
        useful: true,
        cost: "low",
        rationale:
          "High specificity for cervical radiculopathy — a positive test meaningfully raises the probability of a root cause.",
      },
      {
        id: "distraction",
        label: "Cervical distraction test",
        finding: "Relieves the arm symptoms",
        useful: true,
        cost: "low",
        rationale:
          "Symptom relief with distraction is part of Wainner's cluster and supports a compressive root lesion.",
      },
      {
        id: "ulnt",
        label: "Upper-limb neurodynamic test (median bias)",
        finding: "Positive — reproduces symptoms, limited by 25° elbow extension deficit vs. the other side",
        useful: true,
        cost: "low",
        rationale:
          "Sensitive for cervical radiculopathy; a negative test makes a root cause less likely.",
      },
      {
        id: "neuro-exam",
        label: "Myotome, dermatome, and reflex screen",
        finding: "Reduced brachioradialis reflex, trace biceps weakness, blunted sensation over the thumb",
        useful: true,
        cost: "low",
        rationale:
          "Localises the level (C6) and establishes a baseline to monitor — the objective anchor for a conservative trial.",
      },
      {
        id: "cervical-xray",
        label: "Cervical spine X-ray",
        finding: "Age-consistent degenerative change, no instability",
        useful: false,
        cost: "moderate",
        rationale:
          "Degenerative findings are near-universal at this age and rarely change early management of a stable radiculopathy without red flags.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "treat",
      rationale:
        "A single-level radiculopathy with stable, non-progressive signs and no myelopathy or vascular features has a good natural history — a time-limited course of conservative care with clear re-screening criteria is appropriate before imaging or referral.",
    },
    escalation_required: "treat",
    diagnosis: "C6 cervical radiculopathy",
    key_takeaway:
      "A dermatomal arm pain with matching reflex and sensory loss, relieved by distraction and the hand-on-head position, is a root until proven otherwise — but the value of the encounter is the myelopathy and vascular screen you do before you commit to loading the neck.",
    speed_questions: [
      {
        prompt: "Thumb and index-finger paraesthesia maps to which nerve root?",
        options: ["C5", "C6", "C7", "C8"],
        correct: 1,
        rationale: "C6 covers the thumb and index finger and the brachioradialis reflex.",
        concept: "dermatome",
      },
      {
        prompt: "Which finding most raises the probability of cervical radiculopathy?",
        options: [
          "Pain worse in the evening",
          "A positive Spurling's test",
          "Tenderness over the upper trapezius",
          "Full pain-free cervical rotation",
        ],
        correct: 1,
        rationale: "Spurling's is highly specific — a positive test is a strong rule-in.",
        concept: "test-characteristics",
      },
      {
        prompt: "Bilateral hand clumsiness and a wide-based gait with neck pain should make you think:",
        options: [
          "Carpal tunnel syndrome",
          "Cervical myelopathy",
          "Simple mechanical neck pain",
          "Lateral epicondylalgia",
        ],
        correct: 1,
        rationale: "Those are long-tract signs — myelopathy until excluded.",
        concept: "red-flag",
      },
      {
        prompt: "First-line management of a stable C6 radiculopathy with no red flags is:",
        options: [
          "Immediate MRI and surgical referral",
          "A time-limited trial of conservative care with re-screening",
          "Urgent same-day referral",
          "Rigid collar immobilisation for six weeks",
        ],
        correct: 1,
        rationale: "The natural history is favourable; conservative care first is reasonable.",
        concept: "escalation",
      },
    ],
    xp_reward: 45,
    order: 20,
    est_minutes: 9,
    tags: ["neck", "radiculopathy", "neuro-screen", "msk"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (Wainner et al. cervical radiculopathy CPR; APTA neck pain CPG). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-adhesive-capsulitis",
    title: "The Stiffening Shoulder",
    subject: "Adhesive capsulitis vs. rotator-cuff-related shoulder pain",
    module: "msk",
    body_region: "shoulder",
    presenting_complaint: "Progressive shoulder pain and stiffness, four months, no injury",
    difficulty: 2,
    patient_age: 54,
    patient_sex: "female",
    occupation: "Administrator",
    chief_complaint:
      "It started aching for no reason about four months ago and now I can barely reach behind my back or up to a shelf. Doing my hair and my bra strap are the worst. It aches at night on that side.",
    presentation:
      "A 54-year-old woman with a four-month history of atraumatic right shoulder pain that has become progressively stiff. She has type 2 diabetes. Both active and passive movement are limited, particularly external rotation. Night pain when lying on the shoulder.",
    history_questions: [
      {
        id: "q-onset-pattern",
        context: "You want to characterise how this developed.",
        options: [
          "Did it come on gradually with no injury, and is it getting stiffer over time?",
          "Do you play any overhead sports?",
          "Which hand do you write with?",
        ],
        correct: 0,
        answer: "Completely gradual, no injury at all. And yes — it's stiffer now than a month ago.",
        rationale:
          "An insidious, progressively stiffening course without trauma is the adhesive-capsulitis pattern and separates it from an acute cuff injury.",
        concept: "onset",
      },
      {
        id: "q-risk-factors",
        context: "You're checking for conditions that cluster with this problem.",
        options: [
          "Do you have diabetes or thyroid problems?",
          "How many pillows do you sleep with?",
          "Do you drive a manual or an automatic?",
        ],
        correct: 0,
        answer: "I'm diabetic, type 2, for about eight years.",
        rationale:
          "Adhesive capsulitis is strongly associated with diabetes and thyroid disease — a positive answer raises the pre-test probability and shapes the prognosis conversation.",
        concept: "risk-factor",
      },
    ],
    red_flags: [
      {
        id: "mass-or-swelling",
        label: "A visible mass, marked swelling, or skin changes over the shoulder",
        present: false,
        severity: "red",
        rationale: "Would raise concern for tumour or infection rather than a capsular problem.",
      },
      {
        id: "trauma-deformity",
        label: "Recent high-energy trauma or an obvious deformity",
        present: false,
        severity: "red",
        rationale: "Would prompt imaging for fracture or dislocation before any loading.",
      },
      {
        id: "systemic-unwell",
        label: "Fever, night sweats, or feeling systemically unwell",
        present: false,
        severity: "red",
        rationale: "Points away from a mechanical shoulder problem toward septic or systemic pathology.",
      },
      {
        id: "true-fixed-loss",
        label: "Complete, rigid loss of passive external rotation with the arm at the side",
        present: true,
        severity: "yellow",
        rationale:
          "A hard capsular end-feel with near-zero external rotation confirms a true capsular restriction — not dangerous, but it defines the diagnosis and the expected timeline.",
      },
      {
        id: "poorly-controlled-dm",
        label: "Poorly controlled diabetes",
        present: true,
        severity: "yellow",
        rationale:
          "A caution flag for prognosis — capsulitis in poorly controlled diabetes tends to be more resistant and slower to resolve; worth coordinating with the GP.",
      },
      {
        id: "unrelenting-rest-pain",
        label: "Severe pain at rest that analgesia doesn't touch",
        present: false,
        severity: "yellow",
        rationale:
          "Unrelenting rest pain in the highly irritable phase is a reason to slow down, co-manage pain, and reconsider imaging if it doesn't settle.",
      },
      {
        id: "prior-frozen-shoulder",
        label: "Previous frozen shoulder on the other side",
        present: false,
        severity: "yellow",
        rationale:
          "History of contralateral capsulitis raises the odds this is the same process and informs the plan.",
      },
      {
        id: "recent-immobilisation",
        label: "Recent prolonged immobilisation of the arm",
        present: false,
        severity: "yellow",
        rationale: "A known trigger for secondary capsular stiffness — changes the framing to post-immobilisation.",
      },
    ],
    differentials: [
      {
        id: "adhesive-capsulitis-dx",
        label: "Adhesive capsulitis",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Insidious onset, progressive global stiffness with external rotation lost first, equal active and passive restriction, diabetic — the whole picture.",
      },
      {
        id: "cuff-related",
        label: "Rotator-cuff-related shoulder pain",
        must_not_miss: false,
        correct_rank: 2,
        notes:
          "Common and the usual first thought, but active range is typically worse than passive and external rotation is preserved.",
      },
      {
        id: "gh-oa",
        label: "Glenohumeral osteoarthritis",
        must_not_miss: false,
        correct_rank: 3,
        notes: "Can also restrict passive range, but usually crepitus and radiographic joint-space loss in an older patient.",
      },
      {
        id: "shoulder-tumour",
        label: "Neoplasm around the shoulder girdle",
        must_not_miss: true,
        correct_rank: 4,
        notes:
          "Rare, but the must-not-miss — atraumatic progressive shoulder pain with a mass, systemic features, or a relevant cancer history should not be assumed capsular.",
      },
    ],
    examinations: [
      {
        id: "passive-er",
        label: "Passive external rotation, arm at side",
        finding: "Limited to 10° with a firm capsular end-feel (60° on the left)",
        useful: true,
        cost: "low",
        rationale:
          "Loss of passive external rotation with a capsular end-feel is the single most discriminating finding for adhesive capsulitis.",
      },
      {
        id: "active-passive-compare",
        label: "Compare active vs. passive elevation",
        finding: "Both limited to ~90°, roughly equal",
        useful: true,
        cost: "low",
        rationale:
          "Equal active and passive restriction points to a joint/capsule problem rather than a contractile (cuff) one, where active is usually worse.",
      },
      {
        id: "cuff-strength",
        label: "Resisted rotator cuff testing",
        finding: "Strong but painful at end-range",
        useful: true,
        cost: "low",
        rationale:
          "Preserved strength argues against a significant cuff tear as the primary driver.",
      },
      {
        id: "shoulder-xray",
        label: "Shoulder X-ray",
        finding: "Normal joint space, no calcific deposit or arthritic change",
        useful: true,
        cost: "moderate",
        rationale:
          "Useful here to exclude glenohumeral OA and calcific tendinopathy, which can mimic the stiffness, and is reasonable given the atraumatic progressive course.",
      },
      {
        id: "shoulder-mri",
        label: "Shoulder MRI",
        finding: "Capsular thickening at the axillary recess",
        useful: false,
        cost: "high",
        rationale:
          "The diagnosis is clinical; MRI rarely changes management of a typical capsulitis and adds cost and delay.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "treat",
      rationale:
        "Typical adhesive capsulitis with no red flags is managed conservatively — activity modification, pain-guided range work, and a clear explanation of the natural history — with a plain film reasonable to exclude mimics. Referral for injection or further imaging is a later step if it fails to progress.",
    },
    escalation_required: "treat",
    diagnosis: "Adhesive capsulitis (primary)",
    key_takeaway:
      "Equal loss of active and passive movement, with external rotation gone first, in a diabetic with an insidious onset, is adhesive capsulitis — and the reasoning that matters is comparing active to passive range, because that's what separates a capsule problem from a cuff problem before you pick a treatment.",
    speed_questions: [
      {
        prompt: "Which movement is characteristically lost first in adhesive capsulitis?",
        options: ["External rotation", "Internal rotation", "Abduction", "Flexion"],
        correct: 0,
        rationale: "External rotation with the arm at the side is the earliest and most restricted.",
        concept: "pattern",
      },
      {
        prompt: "Equal restriction of active and passive range points toward a problem in the:",
        options: ["Rotator cuff tendons", "Joint capsule", "Acromioclavicular joint", "Cervical spine"],
        correct: 1,
        rationale: "Contractile problems spare passive range; capsular ones don't.",
        concept: "discriminating-finding",
      },
      {
        prompt: "Adhesive capsulitis is most strongly associated with which condition?",
        options: ["Hypertension", "Diabetes mellitus", "Asthma", "Gout"],
        correct: 1,
        rationale: "Diabetes markedly increases both incidence and resistance to treatment.",
        concept: "risk-factor",
      },
      {
        prompt: "Atraumatic progressive shoulder pain with a palpable mass and weight loss should prompt:",
        options: [
          "A trial of capsular stretching",
          "Consideration of neoplasm and appropriate referral/imaging",
          "A subacromial injection",
          "Reassurance and review in three months",
        ],
        correct: 1,
        rationale: "That combination is a must-not-miss — don't assume it's capsular.",
        concept: "red-flag",
      },
    ],
    xp_reward: 40,
    order: 21,
    est_minutes: 8,
    tags: ["shoulder", "capsulitis", "stiffness", "msk"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (adhesive capsulitis JOSPT CPG; Kelley et al.). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-carpal-tunnel",
    title: "The Night-Waking Hand",
    subject: "Carpal tunnel syndrome vs. proximal median or C6 involvement",
    module: "msk",
    body_region: "wrist_hand",
    presenting_complaint: "Hand numbness waking her at night, worse when driving, two months",
    difficulty: 1,
    patient_age: 39,
    patient_sex: "female",
    occupation: "Data entry clerk",
    chief_complaint:
      "My hand goes numb and tingly at night and I have to shake it out. It happens when I drive or hold my phone too. It's the thumb side of my hand, and lately I'm dropping things.",
    presentation:
      "A 39-year-old data-entry clerk, 14 weeks postpartum, reports two months of intermittent paraesthesia in the thumb, index, and middle finger of the right hand, worst at night and with sustained gripping. Early clumsiness with fine tasks. No neck pain.",
    history_questions: [
      {
        id: "q-territory",
        context: "You want to map the sensory symptoms.",
        options: [
          "Does the little finger feel normal, or is it numb too?",
          "Do you use a wrist rest at your desk?",
          "Is your other hand affected?",
        ],
        correct: 0,
        answer: "The little finger's completely fine. It's the thumb, index, and middle.",
        rationale:
          "Sparing of the little finger points to the median nerve rather than the ulnar nerve or a C8 root, and is a key part of localising the lesion to the carpal tunnel.",
        concept: "nerve-territory",
      },
      {
        id: "q-proximal",
        context: "You're checking whether the problem could be higher than the wrist.",
        options: [
          "Any neck pain, or numbness over the palm near the wrist crease itself?",
          "Do you take your rings off at night?",
          "How firm is your mattress?",
        ],
        correct: 0,
        answer: "No neck pain at all, and the palm right at the wrist feels normal — it's the fingers.",
        rationale:
          "The palmar cutaneous branch leaves the median nerve before the tunnel, so a normal thenar-palm sensation with numb fingertips fits a lesion at the wrist, not a proximal median or root lesion.",
        concept: "localisation",
      },
    ],
    red_flags: [
      {
        id: "acute-severe-ct",
        label: "Sudden severe pain and swelling of the whole hand/forearm",
        present: false,
        severity: "red",
        rationale:
          "Would raise acute carpal tunnel syndrome (e.g. after trauma or bleed) — a surgical emergency, not a conservative problem.",
      },
      {
        id: "cervical-myelopathy-hand",
        label: "Bilateral hand symptoms with gait change or hyperreflexia",
        present: false,
        severity: "red",
        rationale: "Points to a cervical cord problem rather than a peripheral nerve at the wrist.",
      },
      {
        id: "inflammatory-arthritis",
        label: "Multiple swollen, hot small joints with prolonged morning stiffness",
        present: false,
        severity: "red",
        rationale:
          "An inflammatory arthropathy can both cause carpal tunnel and needs its own rheumatology pathway.",
      },
      {
        id: "thenar-wasting",
        label: "Visible wasting or persistent weakness of the thenar muscles",
        present: false,
        severity: "yellow",
        rationale:
          "Fixed motor loss marks a more advanced lesion — a caution sign that lowers the threshold for nerve conduction studies and a surgical opinion.",
      },
      {
        id: "constant-numbness",
        label: "Numbness that is now constant rather than intermittent",
        present: false,
        severity: "yellow",
        rationale:
          "Progression from intermittent to constant symptoms suggests the compression is worsening and conservative care alone may not be enough.",
      },
      {
        id: "pregnancy-related",
        label: "Symptoms began during or shortly after pregnancy",
        present: true,
        severity: "yellow",
        rationale:
          "Fluid-related carpal tunnel in the peripartum period often resolves as fluid balance normalises — a genuinely different prognosis and a reason to favour a conservative trial.",
      },
      {
        id: "diabetes-thyroid",
        label: "Diabetes or hypothyroidism",
        present: false,
        severity: "yellow",
        rationale: "Both predispose to carpal tunnel and affect nerve recovery; worth noting in the plan.",
      },
      {
        id: "occupational-load",
        label: "High-repetition sustained gripping at work",
        present: true,
        severity: "yellow",
        rationale:
          "Not dangerous, but a real perpetuating factor the plan has to address alongside splinting.",
      },
    ],
    differentials: [
      {
        id: "cts-dx",
        label: "Carpal tunnel syndrome",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Median-territory paraesthesia sparing the little finger, nocturnal, provoked by sustained wrist positions, palmar sensation intact, peripartum — textbook.",
      },
      {
        id: "c6-c7-radic",
        label: "C6–C7 cervical radiculopathy",
        must_not_miss: false,
        correct_rank: 2,
        notes:
          "Overlapping finger territory, but expect neck pain, a positive Spurling's, and reflex changes — none here.",
      },
      {
        id: "pronator-syndrome",
        label: "Proximal median nerve entrapment (pronator syndrome)",
        must_not_miss: false,
        correct_rank: 3,
        notes:
          "Would also involve the palmar cutaneous territory and forearm pain with resisted pronation — the intact thenar palm argues against it.",
      },
      {
        id: "toxic-neuropathy",
        label: "Generalised peripheral neuropathy",
        must_not_miss: true,
        correct_rank: 4,
        notes:
          "The must-not-miss framing: a stocking-glove pattern, foot involvement, or a relevant systemic history would change the whole workup.",
      },
    ],
    examinations: [
      {
        id: "phalen",
        label: "Phalen's test",
        finding: "Reproduces the finger paraesthesia within 40 seconds",
        useful: true,
        cost: "low",
        rationale: "Reasonable sensitivity for carpal tunnel syndrome; supports a wrist-level median lesion.",
      },
      {
        id: "carpal-compression",
        label: "Carpal compression (Durkan's) test",
        finding: "Positive — symptoms within 20 seconds",
        useful: true,
        cost: "low",
        rationale:
          "One of the better-performing provocation tests; a positive result meaningfully raises the probability.",
      },
      {
        id: "sensory-motor-median",
        label: "Median sensory and motor exam (2-point discrimination, thumb abduction)",
        finding: "Slightly widened 2-point discrimination at the index pulp; thumb abduction strength normal",
        useful: true,
        cost: "low",
        rationale:
          "Grades severity and gives a baseline — sensory change without motor loss fits an early-to-moderate lesion suited to conservative care.",
      },
      {
        id: "cervical-screen",
        label: "Cervical spine screen (AROM, Spurling's, reflexes)",
        finding: "Full pain-free neck movement, negative Spurling's, symmetrical reflexes",
        useful: true,
        cost: "low",
        rationale:
          "A clean cervical screen makes a radicular contribution unlikely and firms up the wrist as the source.",
      },
      {
        id: "wrist-mri",
        label: "Wrist MRI",
        finding: "Median nerve mildly enlarged at the pisiform level",
        useful: false,
        cost: "high",
        rationale:
          "Not indicated for a typical presentation; nerve conduction studies, if anything, are the next test and only if it fails to settle or motor signs appear.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "treat",
      rationale:
        "Mild-to-moderate carpal tunnel syndrome with no thenar wasting, a clean cervical screen, and a reversible peripartum driver responds well to a night splint, activity modification, and neurodynamic work — a conservative trial with review is appropriate before nerve conduction studies or a surgical opinion.",
    },
    escalation_required: "treat",
    diagnosis: "Carpal tunnel syndrome (mild–moderate)",
    key_takeaway:
      "Median-territory paraesthesia that spares the little finger and the thenar palm, worst at night, localises to the carpal tunnel — and doing the cervical screen anyway is what lets you commit to treating the wrist rather than chasing the wrong level.",
    speed_questions: [
      {
        prompt: "Sparing of which finger helps distinguish carpal tunnel from an ulnar or C8 lesion?",
        options: ["Thumb", "Index", "Middle", "Little finger"],
        correct: 3,
        rationale: "The little finger is ulnar territory — it should be normal in carpal tunnel.",
        concept: "nerve-territory",
      },
      {
        prompt: "Intact sensation over the thenar palm with numb fingertips points to a lesion:",
        options: [
          "Proximal to the elbow",
          "At the wrist (carpal tunnel)",
          "At the C6 nerve root",
          "In the brachial plexus",
        ],
        correct: 1,
        rationale: "The palmar cutaneous branch leaves before the tunnel, so it's spared distally.",
        concept: "localisation",
      },
      {
        prompt: "Which finding would most push toward a surgical opinion rather than conservative care?",
        options: [
          "Symptoms worse at night",
          "Thenar muscle wasting",
          "A positive Phalen's test",
          "Symptoms provoked by driving",
        ],
        correct: 1,
        rationale: "Fixed motor loss signals an advanced lesion.",
        concept: "escalation",
      },
      {
        prompt: "Carpal tunnel syndrome that begins in late pregnancy typically:",
        options: [
          "Requires urgent decompression",
          "Often resolves after delivery as fluid balance normalises",
          "Indicates an underlying tumour",
          "Never responds to splinting",
        ],
        correct: 1,
        rationale: "Peripartum fluid-related carpal tunnel has a favourable natural history.",
        concept: "prognosis",
      },
    ],
    xp_reward: 35,
    order: 22,
    est_minutes: 7,
    tags: ["wrist", "carpal-tunnel", "neuro-screen", "msk"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (carpal tunnel JOSPT CPG; Wainner/MacDermid). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-lumbar-disc-radiculopathy",
    title: "The Bent-Over Warehouse Worker",
    subject: "Lumbar disc herniation with L5 radiculopathy — and the cauda equina screen",
    module: "msk",
    body_region: "spine",
    presenting_complaint: "Low back pain now radiating down the leg past the knee, one week",
    difficulty: 3,
    patient_age: 34,
    patient_sex: "male",
    occupation: "Warehouse picker",
    chief_complaint:
      "I tweaked my back lifting a box last week. The back pain's easing but now it's shooting down the back of my leg into my foot, and my foot feels a bit numb on top. Sitting and coughing make the leg worse.",
    presentation:
      "A 34-year-old warehouse worker, one week after a lifting strain, with resolving central low back pain but worsening right leg pain extending below the knee to the dorsum of the foot, with paraesthesia over the dorsum and great toe. Worse with sitting, flexion, and Valsalva. He is otherwise well.",
    history_questions: [
      {
        id: "q-cauda-equina",
        context: "This is the screen you do before anything else with a radiating leg pain.",
        options: [
          "Any numbness around the saddle area, or a change in bladder or bowel control?",
          "Which shoes do you wear at work?",
          "Have you had back pain before?",
        ],
        correct: 0,
        answer: "No — no numbness down below, and no problems going to the toilet. Just the leg.",
        rationale:
          "Cauda equina syndrome is the emergency hiding inside every radiating leg pain. Saddle anaesthesia and bladder/bowel change have to be asked explicitly, every time, before you proceed.",
        concept: "cauda-equina",
      },
      {
        id: "q-behaviour",
        context: "You're establishing the mechanical pattern.",
        options: [
          "Does the leg pain get worse when you sit or cough, and better when you walk or stand?",
          "Is the pain worse first thing in the morning?",
          "Do you take anything for it?",
        ],
        correct: 0,
        answer: "Sitting's terrible, and coughing sends it right down. Walking's actually okay.",
        rationale:
          "Flexion- and Valsalva-provoked leg pain that eases with extension fits a discogenic radiculopathy and helps direction-of-preference planning.",
        concept: "directional-preference",
      },
    ],
    red_flags: [
      {
        id: "saddle-bladder",
        label: "Saddle anaesthesia or new bladder/bowel dysfunction",
        present: false,
        severity: "red",
        rationale:
          "Cauda equina syndrome — a same-day surgical emergency. The single most important thing to exclude in any radiating leg pain.",
      },
      {
        id: "bilateral-leg",
        label: "Bilateral leg pain or numbness",
        present: false,
        severity: "red",
        rationale: "Bilateral neurological signs raise the concern for central canal compromise / cauda equina.",
      },
      {
        id: "progressive-foot-drop",
        label: "Rapidly progressing or dense foot drop",
        present: false,
        severity: "red",
        rationale:
          "A profound or worsening motor deficit is a referral trigger for an urgent surgical opinion, not a conservative trial.",
      },
      {
        id: "systemic-cancer-infection",
        label: "History of cancer, IV drug use, fever, or unexplained weight loss",
        present: false,
        severity: "red",
        rationale: "Shifts the differential toward metastasis or spinal infection.",
      },
      {
        id: "mild-toe-weakness",
        label: "Mild weakness of great-toe extension",
        present: true,
        severity: "yellow",
        rationale:
          "A single-level, non-progressive motor sign (L5) — not an emergency, but it must be documented and re-checked each visit; any progression changes the plan.",
      },
      {
        id: "severe-unremitting-leg-pain",
        label: "Leg pain so severe that no position gives relief",
        present: false,
        severity: "yellow",
        rationale:
          "Intractable radicular pain is a caution sign — co-manage pain, reassess sooner, and lower the threshold for imaging and referral if it doesn't settle in a few weeks.",
      },
      {
        id: "age-under-20-over-50-first",
        label: "First-ever episode of significant back pain outside ages 20–55",
        present: false,
        severity: "yellow",
        rationale: "A first presentation at the extremes of age slightly raises the index of suspicion for non-mechanical causes.",
      },
      {
        id: "heavy-manual-load",
        label: "Ongoing heavy lifting demands at work",
        present: true,
        severity: "yellow",
        rationale:
          "A perpetuating and re-injury factor — the plan needs a graded return-to-lifting and workplace conversation, not just symptom control.",
      },
    ],
    differentials: [
      {
        id: "l5-disc-radic",
        label: "Lumbar disc herniation with L5 radiculopathy",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Young, flexion/Valsalva-provoked leg pain below the knee, dorsal foot and great-toe paraesthesia, mild EHL weakness — a classic L5 discogenic radiculopathy.",
      },
      {
        id: "cauda-equina-dx",
        label: "Cauda equina syndrome",
        must_not_miss: true,
        correct_rank: 2,
        notes:
          "The must-not-miss. Excluded here by an explicit negative saddle and bladder screen, but it sits behind every one of these presentations.",
      },
      {
        id: "somatic-referred",
        label: "Somatic referred pain from the disc/facet (no root involvement)",
        must_not_miss: false,
        correct_rank: 3,
        notes:
          "Can refer into the thigh but rarely past the knee in a dermatomal pattern, and shouldn't produce true sensory or motor loss.",
      },
      {
        id: "hip-pathology",
        label: "Hip joint pathology",
        must_not_miss: false,
        correct_rank: 4,
        notes: "Groin/thigh pain with restricted hip rotation — doesn't explain the foot paraesthesia or the Valsalva response.",
      },
    ],
    examinations: [
      {
        id: "slr",
        label: "Straight leg raise",
        finding: "Reproduces leg pain at 40° on the right, worse with ankle dorsiflexion",
        useful: true,
        cost: "low",
        rationale:
          "Sensitive for lumbar disc herniation with radiculopathy; sensitisation with dorsiflexion supports a neural (root) source.",
      },
      {
        id: "l5-neuro",
        label: "L5 myotome, dermatome, reflex screen",
        finding: "EHL 4/5, blunted sensation dorsum of foot and great toe, reflexes symmetrical",
        useful: true,
        cost: "low",
        rationale: "Localises the level and gives the objective baseline that a conservative trial is monitored against.",
      },
      {
        id: "repeated-extension",
        label: "Repeated lumbar extension in standing",
        finding: "Centralises the leg pain toward the back after 10 repetitions",
        useful: true,
        cost: "low",
        rationale:
          "Centralisation with a direction of preference is both prognostic (favourable) and directly guides the exercise plan.",
      },
      {
        id: "lumbar-mri-now",
        label: "Urgent lumbar MRI",
        finding: "Paracentral L4–L5 disc extrusion contacting the traversing L5 root",
        useful: false,
        cost: "high",
        rationale:
          "Not indicated in the first weeks for a single-level radiculopathy without red flags or progressive deficit — imaging findings are common in the asymptomatic and rarely change early management.",
      },
      {
        id: "hip-exam",
        label: "Hip quadrant and FABER",
        finding: "Full pain-free hip range, negative FABER",
        useful: true,
        cost: "low",
        rationale: "Quickly clears the hip as an alternative source of the leg pain.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "treat",
      rationale:
        "A single-level L5 radiculopathy with a negative cauda equina screen, stable non-progressive motor signs, and centralisation on exam has a good natural history — conservative care with a clear direction of preference, explicit re-screening for red flags, and a review date is appropriate. Urgent imaging/referral is reserved for progressive deficit or any positive cauda equina feature.",
    },
    escalation_required: "treat",
    diagnosis: "Lumbar disc herniation with L5 radiculopathy",
    key_takeaway:
      "The reasoning here isn't naming the disc — it's the cauda equina screen you do first and the motor exam you document, because those are what make 'treat conservatively' a safe decision instead of a lucky one.",
    speed_questions: [
      {
        prompt: "Numbness over the dorsum of the foot and the great toe maps to which root?",
        options: ["L3", "L4", "L5", "S1"],
        correct: 2,
        rationale: "L5 covers the dorsal foot, great toe, and great-toe extension.",
        concept: "dermatome",
      },
      {
        prompt: "The single most important thing to exclude in any radiating leg pain is:",
        options: [
          "Hamstring strain",
          "Cauda equina syndrome",
          "Piriformis syndrome",
          "Sacroiliac joint dysfunction",
        ],
        correct: 1,
        rationale: "It's the time-critical surgical emergency behind these presentations.",
        concept: "red-flag",
      },
      {
        prompt: "Leg pain that centralises toward the back with repeated extension is:",
        options: [
          "A reason for urgent referral",
          "A favourable sign that guides the exercise direction",
          "Diagnostic of cauda equina syndrome",
          "An indication for immediate MRI",
        ],
        correct: 1,
        rationale: "Centralisation predicts a good outcome and points the plan.",
        concept: "directional-preference",
      },
      {
        prompt: "For a stable single-level radiculopathy with no red flags, first-line imaging is:",
        options: [
          "Same-day MRI",
          "Not indicated in the early weeks",
          "Plain X-ray with flexion/extension views",
          "CT myelogram",
        ],
        correct: 1,
        rationale: "Early imaging rarely changes management and commonly finds incidental disease.",
        concept: "escalation",
      },
    ],
    xp_reward: 55,
    order: 23,
    est_minutes: 10,
    tags: ["spine", "radiculopathy", "cauda-equina", "red-flag", "msk"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (lumbar radiculopathy CPGs; NICE low back pain and sciatica NG59; cauda equina screening guidance). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-calf-dvt",
    title: "The Swollen Calf After the Flight",
    subject: "Suspected deep vein thrombosis presenting as a 'calf strain'",
    module: "cardio",
    body_region: "lower_leg",
    presenting_complaint: "Unilateral calf pain and swelling, four days, no clear injury",
    difficulty: 3,
    patient_age: 58,
    patient_sex: "female",
    occupation: "Accountant",
    chief_complaint:
      "My right calf has been aching and it looks swollen. I thought I'd pulled it but I don't remember doing anything. It's warm and a bit tender at the back. I flew back from a long trip five days ago.",
    presentation:
      "A 58-year-old woman with four days of right calf pain and visible swelling, no recall of injury. Recent long-haul flight, on the combined oral contraceptive pill, and a family history of clotting. The calf is warm with pitting oedema and tenderness along the deep posterior compartment; the knee and ankle are unremarkable.",
    history_questions: [
      {
        id: "q-risk-factors",
        context: "You're building a picture of thrombosis risk before you touch the leg.",
        options: [
          "Any recent long travel, surgery, immobility, or a personal or family history of blood clots?",
          "Do you stretch your calves before exercise?",
          "Which leg do you lead with going up stairs?",
        ],
        correct: 0,
        answer:
          "I flew back from Australia five days ago, I'm on the pill, and my mother had a clot in her leg.",
        rationale:
          "Immobility, oestrogen, and a positive family history stack the pre-test probability for DVT — this is exactly the information a Wells score is built from, and it reframes an apparent 'calf strain'.",
        concept: "risk-stratification",
      },
      {
        id: "q-chest",
        context: "You're screening for the complication that makes this urgent.",
        options: [
          "Any chest pain, breathlessness, or coughing up blood?",
          "Does the calf hurt more going uphill or downhill?",
          "Have you changed your running shoes recently?",
        ],
        correct: 0,
        answer: "Now that you mention it, I've been a bit short of breath on the stairs the last day or two.",
        rationale:
          "New dyspnoea in someone with a suspected DVT raises pulmonary embolism — a potentially life-threatening escalation that changes the disposition from 'refer' to 'refer urgently/same-day'.",
        concept: "pe-screen",
      },
    ],
    red_flags: [
      {
        id: "pe-features",
        label: "Pleuritic chest pain, breathlessness, or haemoptysis",
        present: true,
        severity: "red",
        rationale:
          "Suggests pulmonary embolism — a medical emergency. Present here, and the reason this is a same-day referral, not a routine one.",
      },
      {
        id: "phlegmasia",
        label: "A tense, dusky, or severely swollen whole limb",
        present: false,
        severity: "red",
        rationale:
          "Phlegmasia cerulea dolens — a limb-threatening massive DVT needing emergency vascular input.",
      },
      {
        id: "systemic-sepsis",
        label: "Spreading redness, fever, and a spreading well-demarcated hot area",
        present: false,
        severity: "red",
        rationale:
          "Cellulitis with systemic features needs urgent medical treatment and can coexist with or mimic DVT.",
      },
      {
        id: "unilateral-swelling",
        label: "Calf swelling more than 3 cm greater than the other side",
        present: true,
        severity: "yellow",
        rationale:
          "A measured calf-circumference difference is a Wells criterion — on its own a caution sign that raises the probability and mandates the pathway, not the emergency itself.",
      },
      {
        id: "superficial-vein-cord",
        label: "A tender, palpable cord along a superficial vein",
        present: false,
        severity: "yellow",
        rationale:
          "Superficial thrombophlebitis is less dangerous but can propagate to the deep system and still needs medical review.",
      },
      {
        id: "oestrogen-therapy",
        label: "Current oestrogen-containing contraception or HRT",
        present: true,
        severity: "yellow",
        rationale:
          "A modifiable thrombotic risk factor — relevant to the referral letter and the patient's ongoing management, not an emergency by itself.",
      },
      {
        id: "active-cancer",
        label: "Known active cancer or recent chemotherapy",
        present: false,
        severity: "yellow",
        rationale: "Markedly raises DVT probability and changes anticoagulation decisions downstream.",
      },
      {
        id: "recent-immobility",
        label: "Recent surgery, plaster immobilisation, or long-haul travel",
        present: true,
        severity: "yellow",
        rationale: "A classic provoking factor — part of risk stratification and the history the medical team will need.",
      },
    ],
    differentials: [
      {
        id: "dvt-dx",
        label: "Deep vein thrombosis",
        must_not_miss: true,
        correct_rank: 1,
        notes:
          "Atraumatic unilateral swelling, warmth, deep tenderness, a stack of risk factors, and now possible PE features — this is a refer-don't-treat presentation. The must-not-miss and the correct primary.",
      },
      {
        id: "calf-strain",
        label: "Gastrocnemius/soleus strain",
        must_not_miss: false,
        correct_rank: 2,
        notes:
          "The label the patient arrived with, and the trap — but there's no injury mechanism, and strains don't usually produce pitting oedema or a warm limb.",
      },
      {
        id: "bakers-cyst",
        label: "Ruptured Baker's cyst",
        must_not_miss: false,
        correct_rank: 3,
        notes:
          "Can cause acute calf swelling and bruising around the ankle, and clinically overlaps with DVT — which is exactly why imaging, not examination, settles it.",
      },
      {
        id: "cellulitis",
        label: "Cellulitis",
        must_not_miss: false,
        correct_rank: 4,
        notes: "Warm, red, tender — but usually a clear portal of entry and a well-demarcated advancing border.",
      },
    ],
    examinations: [
      {
        id: "wells-score",
        label: "Apply the Wells DVT criteria",
        finding: "Score of 3 (unilateral swelling, tenderness along the deep venous system, recent immobility) — 'DVT likely'",
        useful: true,
        cost: "low",
        rationale:
          "The validated way to turn the history and inspection into a probability that drives the pathway — the single most useful thing you can do in the room.",
      },
      {
        id: "calf-circumference",
        label: "Measure calf circumference bilaterally 10 cm below the tibial tuberosity",
        finding: "Right 39.5 cm, left 36.0 cm — a 3.5 cm difference",
        useful: true,
        cost: "low",
        rationale: "Objectifies the swelling and feeds directly into the Wells score.",
      },
      {
        id: "resp-screen",
        label: "Brief cardiorespiratory screen (rate, SpO2, auscultation)",
        finding: "Respiratory rate 22, SpO2 94% on room air, mild tachycardia",
        useful: true,
        cost: "low",
        rationale:
          "Confirms the PE concern is real and objective — this is what turns a routine referral into a same-day one.",
      },
      {
        id: "homans",
        label: "Homans' sign",
        finding: "Discomfort on passive dorsiflexion",
        useful: false,
        cost: "low",
        rationale:
          "Poor sensitivity and specificity, and forceful provocation of a possibly clotted calf is unwise — it doesn't change the decision.",
      },
      {
        id: "aggressive-calf-massage",
        label: "Deep soft-tissue massage to the calf",
        finding: "—",
        useful: false,
        cost: "low",
        rationale:
          "Contraindicated when DVT is suspected — the priority is referral for a D-dimer and Doppler ultrasound, not treatment.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "refer_urgent",
      rationale:
        "A Wells-likely DVT with concurrent breathlessness and desaturation is a possible pulmonary embolism — this needs same-day medical assessment for a D-dimer and Doppler ultrasound (and possibly CT pulmonary angiogram). Physiotherapy treatment of the calf is contraindicated until DVT is excluded.",
    },
    escalation_required: "refer_urgent",
    diagnosis: "Suspected deep vein thrombosis with possible pulmonary embolism",
    key_takeaway:
      "The trap is the referral label — 'calf strain' — with no mechanism to support it. The reasoning that matters is refusing to treat until you've risk-stratified: an atraumatic warm, swollen calf with thrombotic risk factors is a DVT pathway, and any breathlessness makes it same-day.",
    speed_questions: [
      {
        prompt: "Which feature most argues against a simple calf muscle strain?",
        options: [
          "Pain worse with walking",
          "Atraumatic onset with pitting oedema and a warm limb",
          "Tenderness in the calf",
          "Stiffness in the morning",
        ],
        correct: 1,
        rationale: "Strains have a mechanism and don't usually cause pitting oedema or warmth.",
        concept: "discriminating-finding",
      },
      {
        prompt: "The Wells score for DVT is used to:",
        options: [
          "Confirm the diagnosis without imaging",
          "Estimate pre-test probability and guide the pathway",
          "Grade the severity of a muscle tear",
          "Decide which stretches to prescribe",
        ],
        correct: 1,
        rationale: "It stratifies risk to direct D-dimer and ultrasound decisions.",
        concept: "risk-stratification",
      },
      {
        prompt: "A patient with a suspected DVT who is now breathless and mildly hypoxic needs:",
        options: [
          "A routine GP referral within a week",
          "Same-day medical assessment for possible pulmonary embolism",
          "A trial of calf strengthening",
          "Compression and elevation, review in two weeks",
        ],
        correct: 1,
        rationale: "New dyspnoea and desaturation raise PE — a same-day escalation.",
        concept: "escalation",
      },
      {
        prompt: "When DVT is suspected, deep calf massage is:",
        options: [
          "First-line treatment",
          "Contraindicated until DVT is excluded",
          "Safe if the patient tolerates it",
          "Indicated to improve venous return",
        ],
        correct: 1,
        rationale: "Manual treatment is withheld until imaging clears the deep veins.",
        concept: "safety",
      },
    ],
    xp_reward: 55,
    order: 24,
    est_minutes: 9,
    tags: ["lower-leg", "dvt", "vascular", "red-flag", "cardio"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (Wells DVT criteria; NICE venous thromboembolism NG158). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-acute-stroke",
    title: "The Sudden Weak Side",
    subject: "Acute stroke recognised on the ward — the escalation, not the rehab",
    module: "neuro",
    body_region: "head",
    presenting_complaint: "New one-sided arm and face weakness noticed this morning, on an inpatient",
    difficulty: 3,
    patient_age: 71,
    patient_sex: "male",
    occupation: "Retired",
    chief_complaint:
      "The nurse asked you to see him for mobility. When you get there his right arm is weak, the right side of his face is drooping, and his speech is slurred. He tells you it 'came on suddenly' after breakfast — about 50 minutes ago.",
    presentation:
      "A 71-year-old inpatient (admitted two days ago for cellulitis) referred to physiotherapy for 'reduced mobility'. On arrival he has an acute right facial droop, right arm drift, and dysarthria that the ward has not yet flagged. Atrial fibrillation on his drug chart. Symptom onset was witnessed roughly 50 minutes ago.",
    history_questions: [
      {
        id: "q-onset-time",
        context: "The single most decision-relevant fact.",
        options: [
          "Exactly what time did this start, or when was he last seen completely normal?",
          "Has he had physiotherapy before during this admission?",
          "Does he normally use a walking aid at home?",
        ],
        correct: 0,
        answer: "The nurse saw him fine at breakfast at 08:10. It's now 09:00.",
        rationale:
          "Time of onset (or last-known-well) determines eligibility for thrombolysis and thrombectomy. Nothing else you do in this room matters more than establishing and communicating it.",
        concept: "time-critical",
      },
      {
        id: "q-fast",
        context: "You're confirming this is what it looks like.",
        options: [
          "Can you smile for me, lift both arms, and repeat this sentence?",
          "Does your shoulder hurt when you lift the weak arm?",
          "Have you been doing your bed exercises?",
        ],
        correct: 0,
        answer: "The face is asymmetrical, the right arm drifts down within 5 seconds, and the speech is slurred.",
        rationale:
          "A structured FAST / rapid neuro check confirms the pattern and gives the stroke team something concrete — it is not the time for a musculoskeletal assessment of the arm.",
        concept: "screening-tool",
      },
    ],
    red_flags: [
      {
        id: "acute-focal-deficit",
        label: "Sudden focal neurological deficit (face, arm, speech)",
        present: true,
        severity: "red",
        rationale:
          "This IS the emergency — an acute stroke within a treatment window. The disposition is an immediate stroke call, not physiotherapy.",
      },
      {
        id: "reduced-consciousness",
        label: "Reduced or fluctuating level of consciousness",
        present: false,
        severity: "red",
        rationale: "Would raise a large-vessel or haemorrhagic stroke and the need for airway protection.",
      },
      {
        id: "worst-headache",
        label: "Sudden 'worst-ever' headache with neck stiffness",
        present: false,
        severity: "red",
        rationale: "Points toward subarachnoid haemorrhage — a different emergency pathway.",
      },
      {
        id: "seizure-onset",
        label: "Witnessed seizure at onset",
        present: false,
        severity: "yellow",
        rationale:
          "A seizure at onset makes a stroke mimic (Todd's paresis) more likely and is information the stroke team needs, but it doesn't change the need to escalate now.",
      },
      {
        id: "anticoagulated",
        label: "On an anticoagulant",
        present: false,
        severity: "yellow",
        rationale:
          "Changes haemorrhage risk and thrombolysis decisions — a key fact for the medical team, flagged not acted on by you.",
      },
      {
        id: "af",
        label: "Known atrial fibrillation",
        present: true,
        severity: "yellow",
        rationale:
          "Raises the probability this is a cardioembolic ischaemic stroke — relevant to the team, and to secondary prevention later.",
      },
      {
        id: "recent-surgery-bleed",
        label: "Recent surgery, GI bleed, or head injury",
        present: false,
        severity: "yellow",
        rationale: "A relative contraindication to thrombolysis the stroke team will screen for.",
      },
      {
        id: "rapidly-improving",
        label: "Deficit already visibly improving minute to minute",
        present: false,
        severity: "yellow",
        rationale:
          "A resolving deficit (possible TIA) still needs urgent assessment — it lowers the thrombolysis case but not the urgency.",
      },
    ],
    differentials: [
      {
        id: "ischaemic-stroke",
        label: "Acute ischaemic stroke",
        must_not_miss: true,
        correct_rank: 1,
        notes:
          "Sudden focal deficit, AF, within the window — the must-not-miss and the only thing that matters right now. Every minute of delay is lost brain.",
      },
      {
        id: "haemorrhagic-stroke",
        label: "Intracerebral haemorrhage",
        must_not_miss: true,
        correct_rank: 2,
        notes:
          "Clinically indistinguishable at the bedside — which is exactly why the answer is 'urgent CT and stroke team', not a bedside diagnosis.",
      },
      {
        id: "hypoglycaemia",
        label: "Hypoglycaemia",
        must_not_miss: false,
        correct_rank: 3,
        notes: "A classic stroke mimic — a bedside glucose is part of the rapid workup, but doesn't delay the stroke call.",
      },
      {
        id: "todd-paresis",
        label: "Post-ictal (Todd's) paresis",
        must_not_miss: false,
        correct_rank: 4,
        notes: "Possible if there was a seizure, but assume stroke until the team says otherwise.",
      },
    ],
    examinations: [
      {
        id: "rapid-neuro",
        label: "Rapid bedside neuro screen (face, arm, leg, speech, gaze)",
        finding: "Right facial droop, right arm drift, dysarthria, no gaze deviation",
        useful: true,
        cost: "low",
        rationale: "Confirms and localises the deficit and gives the stroke team a baseline — quick and decision-relevant.",
      },
      {
        id: "bedside-glucose",
        label: "Capillary blood glucose",
        finding: "6.4 mmol/L",
        useful: true,
        cost: "low",
        rationale: "Excludes the most treatable mimic in seconds — a standard part of the acute stroke checklist.",
      },
      {
        id: "bp-obs",
        label: "Blood pressure and basic observations",
        finding: "BP 176/94, HR 96 irregular, SpO2 96%",
        useful: true,
        cost: "low",
        rationale: "Feeds the stroke team's assessment; extreme BP affects thrombolysis decisions.",
      },
      {
        id: "shoulder-exam",
        label: "Musculoskeletal shoulder examination of the weak arm",
        finding: "—",
        useful: false,
        cost: "low",
        rationale:
          "Completely the wrong task in an acute stroke — it wastes the window and misframes the problem as orthopaedic.",
      },
      {
        id: "gait-assessment",
        label: "Stand and walk the patient to assess mobility",
        finding: "—",
        useful: false,
        cost: "low",
        rationale: "Unsafe and inappropriate during an evolving stroke; mobilisation comes much later, after imaging and stabilisation.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "refer_urgent",
      rationale:
        "An acute focal neurological deficit with a known onset time inside the treatment window is a stroke call now — put out the emergency/stroke-team alert, give them the onset time, glucose, BP, and AF history, and do not mobilise or treat. Physiotherapy's role starts after the acute phase.",
    },
    escalation_required: "refer_urgent",
    diagnosis: "Acute stroke (ischaemic until imaging proves otherwise)",
    key_takeaway:
      "The reasoning here is recognising that the referral label ('reduced mobility') is wrong and the task in the room is escalation, not assessment — a witnessed sudden focal deficit with a clock running is one of the few true emergencies a physiotherapist meets, and the whole job is to establish the onset time and get the stroke team.",
    speed_questions: [
      {
        prompt: "The single most important piece of information in a suspected acute stroke is:",
        options: [
          "The patient's baseline mobility",
          "The time of symptom onset (or last known well)",
          "Which arm is dominant",
          "The patient's pain score",
        ],
        correct: 1,
        rationale: "It determines eligibility for thrombolysis and thrombectomy.",
        concept: "time-critical",
      },
      {
        prompt: "Which bedside test excludes the most treatable stroke mimic?",
        options: ["Blood pressure", "Capillary blood glucose", "Oxygen saturation", "Temperature"],
        correct: 1,
        rationale: "Hypoglycaemia can perfectly mimic a stroke and is corrected in minutes.",
        concept: "mimic",
      },
      {
        prompt: "You witness a sudden right facial droop, arm drift, and slurred speech on the ward. You should:",
        options: [
          "Complete a full musculoskeletal assessment of the arm",
          "Put out an immediate stroke call and establish the onset time",
          "Mobilise the patient to gauge function",
          "Document and hand over at the end of your shift",
        ],
        correct: 1,
        rationale: "It's a time-critical emergency — escalate now.",
        concept: "escalation",
      },
      {
        prompt: "Ischaemic and haemorrhagic stroke are distinguished by:",
        options: [
          "The bedside neurological exam",
          "Urgent CT brain imaging",
          "The presence of a facial droop",
          "Whether the patient has atrial fibrillation",
        ],
        correct: 1,
        rationale: "They're clinically indistinguishable; imaging decides.",
        concept: "workup",
      },
    ],
    xp_reward: 60,
    order: 25,
    est_minutes: 8,
    tags: ["neuro", "stroke", "emergency", "red-flag", "escalation"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (FAST; national stroke guidelines; thrombolysis/thrombectomy time windows). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-vestibular-neuritis",
    title: "The Room That Won't Stop",
    subject: "Vestibular neuritis vs. posterior-circulation stroke — the HINTS decision",
    module: "vestibular",
    body_region: "head",
    presenting_complaint: "Constant severe vertigo, nausea, and unsteadiness for two days",
    difficulty: 3,
    patient_age: 52,
    patient_sex: "female",
    occupation: "Chef",
    chief_complaint:
      "The room's been spinning nonstop since two days ago. It's not in bursts — it's constant. I'm sick every time I move my head and I can't walk straight. I had a cold last week.",
    presentation:
      "A 52-year-old woman with 48 hours of continuous rotatory vertigo, vomiting, and gait unsteadiness, following an upper respiratory illness. No hearing loss or tinnitus. She has hypertension and smokes. Symptoms are constant, not positionally triggered in brief episodes.",
    history_questions: [
      {
        id: "q-pattern",
        context: "You want to classify the vertigo syndrome.",
        options: [
          "Is it constant and there all the time, or does it come in short bursts triggered by position?",
          "Do you get travel sick in cars?",
          "How much coffee do you drink?",
        ],
        correct: 0,
        answer: "Constant. It's there whether I move or not — moving just makes the nausea worse.",
        rationale:
          "Constant, spontaneous vertigo lasting days is an 'acute vestibular syndrome' — the category where a central (stroke) cause must be actively excluded, unlike the brief positional bursts of BPPV.",
        concept: "vertigo-syndrome",
      },
      {
        id: "q-central-features",
        context: "You're screening for the dangerous cause.",
        options: [
          "Any double vision, slurred speech, weakness, numbness, or trouble swallowing?",
          "Does lying on one side feel worse than the other?",
          "Have you had this exact thing before?",
        ],
        correct: 0,
        answer: "No — no double vision, speech is fine, no weakness or numbness anywhere.",
        rationale:
          "Brainstem and cerebellar strokes can present as isolated vertigo. Explicitly screening for other posterior-circulation symptoms is essential before attributing it to the inner ear.",
        concept: "central-screen",
      },
    ],
    red_flags: [
      {
        id: "central-neuro-signs",
        label: "Diplopia, dysarthria, dysphagia, facial or limb weakness or numbness",
        present: false,
        severity: "red",
        rationale:
          "Any of the '5 Ds and 3 Ns' means a central cause until proven otherwise — an urgent stroke pathway, not vestibular rehab.",
      },
      {
        id: "direction-changing-nystagmus",
        label: "Direction-changing or vertical/torsional nystagmus",
        present: false,
        severity: "red",
        rationale: "A central pattern of nystagmus — points to a brainstem or cerebellar lesion.",
      },
      {
        id: "cannot-stand",
        label: "Completely unable to stand or walk even with support",
        present: false,
        severity: "red",
        rationale:
          "Severe truncal ataxia out of proportion to the vertigo suggests a cerebellar stroke rather than a peripheral lesion.",
      },
      {
        id: "new-headache-neckpain",
        label: "New severe headache or posterior neck pain",
        present: false,
        severity: "yellow",
        rationale:
          "Raises vertebral artery dissection as a cause of posterior-circulation stroke — a caution sign that lowers the threshold for imaging.",
      },
      {
        id: "vascular-risk",
        label: "Multiple vascular risk factors (hypertension, smoking, diabetes, age > 50)",
        present: true,
        severity: "yellow",
        rationale:
          "A stacked vascular risk profile raises the pre-test probability of a stroke cause and should make you more cautious about a purely peripheral label.",
      },
      {
        id: "new-hearing-loss",
        label: "New unilateral hearing loss with the vertigo",
        present: false,
        severity: "yellow",
        rationale:
          "Sudden hearing loss with vertigo can be labyrinthitis but also anterior inferior cerebellar artery stroke — worth an ENT/medical opinion.",
      },
      {
        id: "no-improvement-72h",
        label: "No improvement at all after 72 hours",
        present: false,
        severity: "yellow",
        rationale: "Peripheral vestibular neuritis usually starts to settle within a few days; a static picture warrants review.",
      },
      {
        id: "recent-uri",
        label: "Preceding viral upper respiratory illness",
        present: true,
        severity: "yellow",
        rationale:
          "Supports (but doesn't prove) a viral vestibular neuritis — helpful context, not a safety issue on its own.",
      },
    ],
    differentials: [
      {
        id: "vestibular-neuritis-dx",
        label: "Vestibular neuritis",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Acute vestibular syndrome after a viral illness, unidirectional horizontal nystagmus, positive head impulse test, no central signs — the peripheral picture.",
      },
      {
        id: "posterior-stroke",
        label: "Posterior-circulation (cerebellar/brainstem) stroke",
        must_not_miss: true,
        correct_rank: 2,
        notes:
          "The must-not-miss. Excluded here by a reassuring HINTS exam and a clean neuro screen — but in a vasculopath with acute vertigo it always has to be considered first.",
      },
      {
        id: "labyrinthitis",
        label: "Labyrinthitis",
        must_not_miss: false,
        correct_rank: 3,
        notes: "Vestibular neuritis plus hearing loss — the absent auditory symptoms make it less likely here.",
      },
      {
        id: "bppv-dx",
        label: "BPPV",
        must_not_miss: false,
        correct_rank: 4,
        notes: "Doesn't fit — BPPV is brief, positionally triggered episodes, not two days of constant vertigo.",
      },
    ],
    examinations: [
      {
        id: "hints",
        label: "HINTS exam (Head Impulse, Nystagmus, Test of Skew)",
        finding:
          "Positive head impulse to the left (corrective saccade), unidirectional horizontal nystagmus beating right, no skew deviation",
        useful: true,
        cost: "low",
        rationale:
          "In a trained examiner, a peripheral HINTS pattern in acute vestibular syndrome is more sensitive than early MRI for excluding stroke — the single most discriminating test here.",
      },
      {
        id: "gait-romberg",
        label: "Gait and Romberg",
        finding: "Unsteady, veers to the left, but able to walk unaided",
        useful: true,
        cost: "low",
        rationale:
          "Mild, lateralised unsteadiness fits a peripheral lesion; an inability to stand would point central.",
      },
      {
        id: "cranial-nerves",
        label: "Cranial nerve and cerebellar screen (finger-nose, dysdiadochokinesis)",
        finding: "Normal — no dysmetria, normal eye movements otherwise, normal speech",
        useful: true,
        cost: "low",
        rationale: "A clean cerebellar and cranial-nerve exam further lowers the probability of a central cause.",
      },
      {
        id: "dix-hallpike",
        label: "Dix-Hallpike test",
        finding: "No change in the ongoing nystagmus, no new burst",
        useful: false,
        cost: "low",
        rationale:
          "Designed for episodic positional vertigo — unhelpful and potentially misleading in a constant acute vestibular syndrome.",
      },
      {
        id: "early-mri",
        label: "Request an urgent MRI now",
        finding: "(would be low-yield in the first 24–48h for small posterior strokes)",
        useful: false,
        cost: "high",
        rationale:
          "Early DWI-MRI misses up to 20% of small posterior-fossa strokes; a properly performed peripheral HINTS is the better rule-out in the acute window. Imaging is for when HINTS is central or equivocal.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "treat",
      rationale:
        "Acute vestibular syndrome with a clean neuro screen and a clearly peripheral HINTS exam is vestibular neuritis — manage with early vestibular rehabilitation, short-term antiemetics, and safety-netting, with a low threshold to escalate if any central feature appears. A central or equivocal HINTS, or any of the 5 Ds and 3 Ns, flips this to an urgent stroke referral.",
    },
    escalation_required: "treat",
    diagnosis: "Vestibular neuritis",
    key_takeaway:
      "With days of constant vertigo, the reasoning isn't 'is this the inner ear' — it's 'have I actively excluded a posterior-circulation stroke first', because a cerebellar stroke can look exactly like this and the HINTS exam plus a neuro screen is what makes conservative treatment a safe call.",
    speed_questions: [
      {
        prompt: "Constant vertigo lasting days, not triggered by brief position changes, is called:",
        options: ["BPPV", "An acute vestibular syndrome", "Cervicogenic dizziness", "Vasovagal syncope"],
        correct: 1,
        rationale: "That's the category in which stroke must be actively excluded.",
        concept: "classification",
      },
      {
        prompt: "In acute vestibular syndrome, which is more sensitive for excluding stroke in the first 24–48h?",
        options: [
          "Early MRI",
          "A properly performed peripheral HINTS exam",
          "A CT head",
          "The Dix-Hallpike test",
        ],
        correct: 1,
        rationale: "Early DWI-MRI misses ~20% of small posterior strokes.",
        concept: "test-characteristics",
      },
      {
        prompt: "Which nystagmus pattern suggests a central cause?",
        options: [
          "Unidirectional horizontal nystagmus",
          "Direction-changing or vertical nystagmus",
          "Nystagmus that suppresses with visual fixation",
          "Nystagmus only in the dark",
        ],
        correct: 1,
        rationale: "Direction-changing, vertical, or torsional nystagmus is a central red flag.",
        concept: "red-flag",
      },
      {
        prompt: "A positive head impulse test (corrective saccade) in acute vestibular syndrome points toward:",
        options: [
          "A central (stroke) cause",
          "A peripheral vestibular cause",
          "BPPV",
          "A normal exam",
        ],
        correct: 1,
        rationale: "A normal head impulse in this setting is actually the worrying, central-leaning result.",
        concept: "discriminating-finding",
      },
    ],
    xp_reward: 55,
    order: 26,
    est_minutes: 9,
    tags: ["vestibular", "vertigo", "stroke-screen", "red-flag"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (HINTS exam; Kattah et al.; acute vestibular syndrome literature). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-osgood-schlatter",
    title: "The Jumper's Sore Knee",
    subject: "Osgood-Schlatter disease — apophysitis, not tendinopathy",
    module: "pediatrics",
    body_region: "knee",
    presenting_complaint: "Pain and a lump below one knee in a 13-year-old basketball player",
    difficulty: 1,
    patient_age: 13,
    patient_sex: "male",
    occupation: "School student / basketball",
    chief_complaint:
      "It hurts right at the top of my shin, below the kneecap. There's a bump there and it's sore if I kneel on it or when I jump. It's been getting worse over a couple of months since the season started.",
    presentation:
      "A 13-year-old in a growth spurt, playing basketball five days a week, with two months of activity-related anterior knee pain localised to the tibial tuberosity. A prominent, tender tuberosity. Pain during and after sport, settles with rest. No effusion, no locking, no giving way.",
    history_questions: [
      {
        id: "q-location-behaviour",
        context: "You want to pin down where and when it hurts.",
        options: [
          "Point to exactly where it hurts — and is it worse during activity, or constant?",
          "Do your parents have knee problems?",
          "What position do you play?",
        ],
        correct: 0,
        answer: "Right on the bump. It's fine when I'm resting — it's jumping and running that set it off, and kneeling.",
        rationale:
          "Pain localised precisely to the tibial tuberosity, load-related and absent at rest, is the apophysitis pattern and separates it from intra-articular knee pathology.",
        concept: "localisation",
      },
      {
        id: "q-red-flag-screen",
        context: "You're screening for anything that doesn't fit a benign apophysitis.",
        options: [
          "Any night pain that wakes you, fevers, or feeling generally unwell?",
          "Do you warm up before training?",
          "How tall are your parents?",
        ],
        correct: 0,
        answer: "No — no night pain, no fevers, I feel completely well otherwise.",
        rationale:
          "Bone pain in a child that wakes them at night or comes with systemic features must trigger consideration of infection or a bone tumour before a mechanical label is accepted.",
        concept: "paediatric-red-flag",
      },
    ],
    red_flags: [
      {
        id: "night-pain-child",
        label: "Bone pain that consistently wakes the child at night",
        present: false,
        severity: "red",
        rationale: "A classic warning for osteoid osteoma or malignancy — needs imaging, not reassurance.",
      },
      {
        id: "systemic-features",
        label: "Fever, weight loss, malaise, or a limp with no clear mechanical cause",
        present: false,
        severity: "red",
        rationale: "Raises septic arthritis, osteomyelitis, or leukaemia — a different, urgent pathway.",
      },
      {
        id: "true-effusion",
        label: "A true knee effusion or a locked knee",
        present: false,
        severity: "red",
        rationale: "Points to an intra-articular problem (osteochondritis dissecans, meniscal or ligament injury), not the apophysis.",
      },
      {
        id: "acute-avulsion",
        label: "Sudden severe pain during a jump with immediate inability to extend the knee",
        present: false,
        severity: "yellow",
        rationale:
          "A tibial tuberosity avulsion fracture is the acute cousin of this condition — sudden onset and an extensor lag change it from conservative to urgent orthopaedic.",
      },
      {
        id: "hip-referred",
        label: "Reduced or painful hip internal rotation",
        present: false,
        severity: "yellow",
        rationale:
          "SCFE and Perthes refer pain to the knee — a quick hip screen is mandatory in any child with knee pain, and a positive finding redirects the whole assessment.",
      },
      {
        id: "training-spike",
        label: "A recent large jump in training load",
        present: true,
        severity: "yellow",
        rationale:
          "Not dangerous, but the direct driver — the plan has to modify load, not just treat the knee.",
      },
      {
        id: "bilateral-severe",
        label: "Severe bilateral symptoms limiting all activity",
        present: false,
        severity: "yellow",
        rationale: "More severe or bilateral presentations may need a period of greater restriction and closer follow-up.",
      },
      {
        id: "growth-spurt",
        label: "Currently in a rapid growth spurt",
        present: true,
        severity: "yellow",
        rationale:
          "Explains the vulnerability of the apophysis and sets expectations — symptoms typically settle once skeletal maturity is reached.",
      },
    ],
    differentials: [
      {
        id: "osd-dx",
        label: "Osgood-Schlatter disease",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Adolescent in a growth spurt, load-related pain and tenderness precisely at the tibial tuberosity, prominent tuberosity, no joint signs — textbook traction apophysitis.",
      },
      {
        id: "patellar-tendinopathy-child",
        label: "Patellar tendinopathy (jumper's knee)",
        must_not_miss: false,
        correct_rank: 2,
        notes:
          "Also load-related anterior knee pain in a jumper, but the tenderness is at the inferior patellar pole, not the tuberosity, and it's uncommon before skeletal maturity.",
      },
      {
        id: "scfe-perthes",
        label: "Hip pathology referring to the knee (SCFE / Perthes)",
        must_not_miss: true,
        correct_rank: 3,
        notes: "The must-not-miss — always screen the hip in a child with knee pain; a missed SCFE has serious consequences.",
      },
      {
        id: "bone-tumour-child",
        label: "Bone tumour or infection",
        must_not_miss: true,
        correct_rank: 4,
        notes: "Rare, but the reason the night-pain and systemic screen is non-negotiable.",
      },
    ],
    examinations: [
      {
        id: "tuberosity-palpation",
        label: "Palpation of the tibial tuberosity and patellar tendon",
        finding: "Marked tenderness and bony prominence at the tuberosity; the tendon and inferior patellar pole are non-tender",
        useful: true,
        cost: "low",
        rationale:
          "Localises the problem to the apophysis and away from the tendon — the key discriminator from patellar tendinopathy.",
      },
      {
        id: "resisted-extension",
        label: "Resisted knee extension / single-leg decline squat",
        finding: "Reproduces pain at the tuberosity",
        useful: true,
        cost: "low",
        rationale: "Confirms the pain is quadriceps-traction related and gives a monitoring measure.",
      },
      {
        id: "hip-screen-child",
        label: "Hip range of motion, especially internal rotation, log-roll",
        finding: "Full, symmetrical, pain-free hip movement",
        useful: true,
        cost: "low",
        rationale: "Clears SCFE and Perthes — the mandatory step before settling on a knee diagnosis.",
      },
      {
        id: "knee-joint-exam",
        label: "Effusion sweep, joint-line palpation, ligament tests",
        finding: "No effusion, no joint-line tenderness, ligaments stable",
        useful: true,
        cost: "low",
        rationale: "A clean intra-articular exam removes the meniscal, ligament, and OCD alternatives.",
      },
      {
        id: "knee-mri-child",
        label: "Knee MRI",
        finding: "Fragmentation of the tibial tuberosity apophysis with local soft-tissue oedema",
        useful: false,
        cost: "high",
        rationale:
          "The diagnosis is clinical; imaging is reserved for atypical features (night pain, effusion, an acute pop) — not a typical apophysitis.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "treat",
      rationale:
        "Typical Osgood-Schlatter disease with a normal hip screen, no joint signs, and no red flags is managed conservatively — relative load reduction to a pain-acceptable level, quadriceps and hip strengthening, and a clear explanation that it is self-limiting around skeletal maturity. Imaging or referral is only for atypical or acute-avulsion features.",
    },
    escalation_required: "treat",
    diagnosis: "Osgood-Schlatter disease",
    key_takeaway:
      "Two pieces of reasoning make this safe: tenderness exactly on the tuberosity (not the tendon) names the condition, and a normal hip screen rules out the referred hip pathology that every child with knee pain has to be checked for.",
    speed_questions: [
      {
        prompt: "Osgood-Schlatter pain and tenderness is localised to the:",
        options: ["Inferior pole of the patella", "Tibial tuberosity", "Medial joint line", "Pes anserine bursa"],
        correct: 1,
        rationale: "It's a traction apophysitis at the tibial tuberosity.",
        concept: "localisation",
      },
      {
        prompt: "In any child presenting with knee pain, you must always examine the:",
        options: ["Opposite knee", "Hip", "Lumbar spine", "Ankle"],
        correct: 1,
        rationale: "SCFE and Perthes refer pain to the knee.",
        concept: "red-flag",
      },
      {
        prompt: "Which feature would make you image rather than reassure?",
        options: [
          "Pain worse during sport",
          "Bone pain that wakes the child at night",
          "A prominent tibial tuberosity",
          "Pain with kneeling",
        ],
        correct: 1,
        rationale: "Night bone pain raises tumour or infection.",
        concept: "red-flag",
      },
      {
        prompt: "The natural history of Osgood-Schlatter disease is:",
        options: [
          "Progressive without surgery",
          "Self-limiting, usually settling around skeletal maturity",
          "Chronic and disabling into adulthood",
          "Requiring immobilisation in a cast",
        ],
        correct: 1,
        rationale: "It's self-limiting; management is load modification and education.",
        concept: "prognosis",
      },
    ],
    xp_reward: 35,
    order: 27,
    est_minutes: 7,
    tags: ["knee", "paediatric", "apophysitis", "load-management"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (paediatric knee pain; traction apophysitis literature). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-pancoast-shoulder",
    title: "The Shoulder Pain That Kept Him Up",
    subject: "Superior sulcus (Pancoast) tumour masquerading as rotator-cuff pain",
    module: "oncology",
    body_region: "shoulder",
    presenting_complaint: "Deep left shoulder and inner-arm pain, three months, not responding to anything",
    difficulty: 3,
    patient_age: 63,
    patient_sex: "male",
    occupation: "Retired plumber",
    chief_complaint:
      "It's a deep, boring ache in the top of my shoulder and down the inside of my arm to my little finger. It's worse at night — it wakes me every night. Nothing the last physio tried touched it, and I've lost about half a stone without trying.",
    presentation:
      "A 63-year-old ex-smoker (40 pack-years) with three months of progressive, constant left shoulder-girdle and medial arm pain, unrelieved by two months of prior physiotherapy. Constant night pain, 4 kg unintentional weight loss. He has noticed the left pupil looks smaller and the eyelid a little droopy. Grip in the left hand feels weaker.",
    history_questions: [
      {
        id: "q-pain-behaviour",
        context: "You're characterising the pain's behaviour over time.",
        options: [
          "Is the pain constant and getting worse regardless of what you do, and does it wake you at night?",
          "Is it worse reaching overhead or behind your back?",
          "Did it start after a specific lift?",
        ],
        correct: 0,
        answer: "Constant. It's worse every week and it wakes me every single night, whatever I do.",
        rationale:
          "Constant, progressive, night-dominant pain that is unrelated to movement and unresponsive to mechanical treatment does not fit a rotator-cuff problem and is a cardinal non-mechanical warning.",
        concept: "pain-behaviour",
      },
      {
        id: "q-systemic-neuro",
        context: "You're screening for the features that reframe this entirely.",
        options: [
          "Any weight loss, changes to your eye or eyelid, or numbness and weakness in the hand?",
          "Do you sleep on that side?",
          "Have you had a cortisone injection?",
        ],
        correct: 0,
        answer:
          "I've lost weight without trying, my left eyelid droops a bit and the pupil's small, and my hand grip's gone weak on that side.",
        rationale:
          "Weight loss plus Horner's syndrome plus a lower-trunk brachial plexopathy in an ex-smoker is a superior sulcus tumour until proven otherwise — this is the information that changes the disposition completely.",
        concept: "systemic-screen",
      },
    ],
    red_flags: [
      {
        id: "constant-progressive-night-pain",
        label: "Constant, progressive pain that wakes the patient every night",
        present: true,
        severity: "red",
        rationale:
          "Non-mechanical pain unresponsive to treatment is the core red flag for sinister pathology — present and unmissable here.",
      },
      {
        id: "weight-loss",
        label: "Unintentional weight loss",
        present: true,
        severity: "red",
        rationale: "A systemic feature that, with the pain pattern, mandates urgent investigation for malignancy.",
      },
      {
        id: "horners",
        label: "Horner's syndrome (ptosis, miosis, anhidrosis) on the affected side",
        present: true,
        severity: "red",
        rationale:
          "Sympathetic chain involvement at the lung apex — a specific pointer to a superior sulcus tumour.",
      },
      {
        id: "lower-plexus-signs",
        label: "C8/T1 weakness and sensory loss (intrinsic hand wasting, ulnar-side numbness)",
        present: true,
        severity: "red",
        rationale: "A lower brachial plexus lesion from apical tumour invasion — not something conservative care addresses.",
      },
      {
        id: "smoking-history",
        label: "Heavy smoking history",
        present: true,
        severity: "yellow",
        rationale:
          "Massively raises the pre-test probability of lung malignancy — context that should have lowered the threshold months ago.",
      },
      {
        id: "prior-treatment-failure",
        label: "No response to an adequate trial of appropriate conservative care",
        present: true,
        severity: "yellow",
        rationale:
          "A treatment that should have helped and didn't is itself a prompt to re-examine and reconsider the diagnosis.",
      },
      {
        id: "age-over-50-new-pain",
        label: "New, significant shoulder-girdle pain first arising after age 50",
        present: true,
        severity: "yellow",
        rationale: "Raises the index of suspicion for a non-mechanical cause, especially with other features.",
      },
      {
        id: "supraclavicular-fullness",
        label: "Fullness or a mass in the supraclavicular fossa",
        present: false,
        severity: "yellow",
        rationale: "A palpable supraclavicular abnormality would further localise apical/mediastinal pathology.",
      },
    ],
    differentials: [
      {
        id: "pancoast-dx",
        label: "Superior sulcus (Pancoast) tumour",
        must_not_miss: true,
        correct_rank: 1,
        notes:
          "Ex-smoker, constant progressive night pain, weight loss, Horner's, C8/T1 plexopathy — the classic quartet. The must-not-miss and the primary.",
      },
      {
        id: "cuff-pathology-onco",
        label: "Rotator-cuff-related shoulder pain",
        must_not_miss: false,
        correct_rank: 2,
        notes:
          "The label he arrived with and the trap — but cuff pain is movement-related, eases with rest, and doesn't cause Horner's or weight loss.",
      },
      {
        id: "cervical-radic-onco",
        label: "Cervical radiculopathy",
        must_not_miss: false,
        correct_rank: 3,
        notes:
          "Can give shoulder and arm pain with C8 features, but not Horner's syndrome or systemic weight loss.",
      },
      {
        id: "brachial-neuritis",
        label: "Neuralgic amyotrophy (Parsonage-Turner)",
        must_not_miss: false,
        correct_rank: 4,
        notes: "Severe shoulder-girdle pain then weakness, but self-limiting, no Horner's, no weight loss.",
      },
    ],
    examinations: [
      {
        id: "pupil-eyelid",
        label: "Inspect the pupils and eyelids in different lighting",
        finding: "Left partial ptosis and a smaller left pupil that dilates sluggishly — Horner's syndrome",
        useful: true,
        cost: "low",
        rationale:
          "A single highly specific finding that, in this context, points straight to the lung apex — the most valuable thing to check.",
      },
      {
        id: "c8t1-neuro",
        label: "C8/T1 motor and sensory exam (interossei, abductor digiti minimi, ulnar border)",
        finding: "Weak intrinsics with early first-dorsal-interosseous wasting, reduced sensation over the medial forearm and little finger",
        useful: true,
        cost: "low",
        rationale: "Establishes a lower-trunk brachial plexopathy — inconsistent with a rotator-cuff problem.",
      },
      {
        id: "shoulder-rom-cuff",
        label: "Shoulder range of movement and rotator-cuff strength tests",
        finding: "Full passive range, cuff tests strong; pain is unchanged by any shoulder movement",
        useful: true,
        cost: "low",
        rationale:
          "Pain that doesn't vary with shoulder movement, on a full-range joint, argues strongly against a shoulder source and supports referred/non-mechanical pain.",
      },
      {
        id: "chest-xray",
        label: "Arrange an urgent chest X-ray (via the GP / two-week-wait pathway)",
        finding: "Would typically show an apical mass or asymmetric apical opacity",
        useful: true,
        cost: "moderate",
        rationale:
          "The appropriate first investigation — but the physiotherapist's role is to trigger the urgent referral, not to wait for the film before acting.",
      },
      {
        id: "subacromial-injection-onco",
        label: "Recommend a subacromial corticosteroid injection",
        finding: "—",
        useful: false,
        cost: "moderate",
        rationale: "Chasing a shoulder treatment for a suspected apical malignancy delays diagnosis — clearly the wrong path.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "investigate",
      rationale:
        "Constant progressive night pain, unintentional weight loss, Horner's syndrome, and a C8/T1 plexopathy in a heavy ex-smoker require urgent investigation for a superior sulcus tumour — an urgent referral (typically a suspected-cancer / two-week-wait pathway with chest imaging), not further physiotherapy. If there were cord-compression features it would escalate further again.",
    },
    escalation_required: "investigate",
    diagnosis: "Suspected superior sulcus (Pancoast) tumour",
    key_takeaway:
      "The reasoning is pattern-mismatch: the shoulder joint is full-range and strong, the pain doesn't move with the shoulder, and there's Horner's syndrome and weight loss — a picture that cannot be a rotator cuff, and the job is to recognise that and refer urgently, not to keep treating the label.",
    speed_questions: [
      {
        prompt: "Which triad most suggests a superior sulcus (Pancoast) tumour?",
        options: [
          "Painful arc, weak abduction, positive Hawkins",
          "Shoulder-girdle pain, Horner's syndrome, and C8/T1 hand weakness",
          "Night pain, stiffness, and loss of external rotation",
          "Neck pain, positive Spurling's, reduced biceps reflex",
        ],
        correct: 1,
        rationale: "Apical tumour invades the sympathetic chain and lower brachial plexus.",
        concept: "pattern",
      },
      {
        prompt: "Shoulder pain that does not change at all with any shoulder movement suggests:",
        options: [
          "Rotator cuff tendinopathy",
          "A referred or non-mechanical source",
          "Adhesive capsulitis",
          "Acromioclavicular joint pain",
        ],
        correct: 1,
        rationale: "Mechanical shoulder pain is movement-modulated; this isn't.",
        concept: "discriminating-finding",
      },
      {
        prompt: "Horner's syndrome consists of:",
        options: [
          "Ptosis, miosis, and anhidrosis",
          "Mydriasis, exophthalmos, and lid retraction",
          "Facial droop, dysarthria, and arm drift",
          "Nystagmus, vertigo, and hearing loss",
        ],
        correct: 0,
        rationale: "Drooping lid, small pupil, reduced sweating — sympathetic interruption.",
        concept: "sign",
      },
      {
        prompt: "A patient's shoulder pain hasn't responded to two months of appropriate physiotherapy. This should prompt:",
        options: [
          "A stronger exercise programme",
          "Re-examination and reconsideration of the diagnosis",
          "A repeat course of the same treatment",
          "Discharge with a home programme",
        ],
        correct: 1,
        rationale: "Non-response to adequate care is a reason to rethink, not to repeat.",
        concept: "masquerade",
      },
    ],
    xp_reward: 60,
    order: 28,
    est_minutes: 10,
    tags: ["shoulder", "oncology", "red-flag", "masquerade", "referred-pain"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (superior sulcus tumour presentation; shoulder pain red flags; suspected-cancer referral pathways). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-postpartum-sui",
    title: "The Leak on the Trampoline",
    subject: "Stress urinary incontinence postpartum — and screening what doesn't fit",
    module: "pelvic",
    body_region: "pelvis",
    presenting_complaint: "Leaking urine with coughing, jumping, and running since having a baby five months ago",
    difficulty: 2,
    patient_age: 32,
    patient_sex: "female",
    occupation: "Primary school teacher",
    chief_complaint:
      "Ever since my second baby I leak a bit when I cough, sneeze, or try to run. On the trampoline with my daughter it's really bad. It's only ever with those sudden things — I don't get a sudden desperate urge.",
    presentation:
      "A 32-year-old, five months after her second vaginal birth (forceps, 4.1 kg baby), reporting predictable urine loss with cough, sneeze, jumping, and running, in small amounts, with no urgency, nocturia, or leakage at rest. No prolapse symptoms, no dysuria, no haematuria. Not currently doing any structured pelvic floor work.",
    history_questions: [
      {
        id: "q-incontinence-type",
        context: "You need to classify the incontinence.",
        options: [
          "Does the leak happen with a cough or jump, or with a sudden urge you can't defer — or both?",
          "How many coffees do you drink a day?",
          "Do you leak when you laugh at films?",
        ],
        correct: 0,
        answer: "Always with the cough or the jump. Never a sudden urge — I get plenty of warning normally.",
        rationale:
          "Effort-related loss without urgency is stress urinary incontinence; distinguishing it from urgency (or mixed) incontinence determines whether the plan is pelvic floor training or bladder retraining.",
        concept: "classification",
      },
      {
        id: "q-red-flag-screen-pelvic",
        context: "You're screening for what wouldn't be simple SUI.",
        options: [
          "Any blood in the urine, pain passing urine, unexplained weight loss, or new pelvic or back pain?",
          "Did you have an epidural?",
          "How much water do you drink?",
        ],
        correct: 0,
        answer: "No — no blood, no pain, no weight loss, no new pains anywhere.",
        rationale:
          "Visible haematuria, pain, weight loss, or new neurological symptoms would move this away from a straightforward postpartum SUI toward urology or a neurological cause and must be asked explicitly.",
        concept: "urogenital-red-flag",
      },
    ],
    red_flags: [
      {
        id: "visible-haematuria",
        label: "Visible (frank) haematuria",
        present: false,
        severity: "red",
        rationale: "Requires urgent urological referral to exclude bladder or upper-tract pathology, regardless of the continence picture.",
      },
      {
        id: "neuro-bladder",
        label: "New leg weakness, saddle numbness, or loss of bladder awareness",
        present: false,
        severity: "red",
        rationale: "A neurogenic bladder / cauda equina picture — a neurological emergency, not a pelvic floor problem.",
      },
      {
        id: "recurrent-uti-systemic",
        label: "Recurrent UTIs with fevers or loin pain",
        present: false,
        severity: "red",
        rationale: "Points to upper urinary tract involvement and needs medical management.",
      },
      {
        id: "significant-prolapse",
        label: "A sensation of vaginal bulge or something 'coming down'",
        present: false,
        severity: "yellow",
        rationale:
          "Symptomatic prolapse changes the assessment and may need a gynaecology opinion alongside pelvic floor work — a caution flag, not an emergency.",
      },
      {
        id: "obstetric-anal-sphincter",
        label: "History of a third- or fourth-degree perineal tear",
        present: false,
        severity: "yellow",
        rationale:
          "A significant obstetric anal sphincter injury raises the chance of coexisting faecal incontinence and warrants specialist involvement.",
      },
      {
        id: "instrumental-delivery",
        label: "Instrumental (forceps/ventouse) delivery of a large baby",
        present: true,
        severity: "yellow",
        rationale:
          "A known risk factor for pelvic floor and levator injury — not dangerous, but it shapes the prognosis conversation and the plan.",
      },
      {
        id: "persistent-severe-6mo",
        label: "No improvement despite good pelvic floor training beyond 6 months",
        present: false,
        severity: "yellow",
        rationale: "Failure to respond to a proper trial of first-line therapy is the point to refer for further assessment.",
      },
      {
        id: "mood-screen",
        label: "Low mood or significant distress about the symptoms",
        present: false,
        severity: "yellow",
        rationale: "Postnatal incontinence commonly coexists with low mood; screening and signposting matters for the whole plan.",
      },
    ],
    differentials: [
      {
        id: "sui-dx",
        label: "Stress urinary incontinence",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Predictable effort-related loss, small volumes, no urgency, recent instrumental birth of a big baby — the archetypal postpartum SUI.",
      },
      {
        id: "mixed-ui",
        label: "Mixed urinary incontinence",
        must_not_miss: false,
        correct_rank: 2,
        notes: "Common postnatally, but she has no urgency component — pure stress leak here.",
      },
      {
        id: "urgency-ui",
        label: "Urgency urinary incontinence",
        must_not_miss: false,
        correct_rank: 3,
        notes: "Doesn't fit — the trigger is always effort, never an unsuppressible urge.",
      },
      {
        id: "fistula-pathology",
        label: "Urinary tract pathology (fistula, tumour, infection)",
        must_not_miss: true,
        correct_rank: 4,
        notes: "The must-not-miss framing — continuous leakage, haematuria, or pain would need urology, not physiotherapy.",
      },
    ],
    examinations: [
      {
        id: "cough-stress-test",
        label: "Observed cough stress test",
        finding: "Immediate small spurt of urine synchronous with a cough, in standing",
        useful: true,
        cost: "low",
        rationale: "Demonstrates the sign of stress incontinence directly and links loss to the effort trigger.",
      },
      {
        id: "pfm-assessment",
        label: "Pelvic floor muscle assessment (with consent): voluntary contraction, strength, endurance, coordination",
        finding: "Weak, poorly sustained contraction (Oxford 2/5), delayed automatic pre-contraction with cough",
        useful: true,
        cost: "low",
        rationale:
          "Establishes the baseline the whole treatment plan is built on and confirms a modifiable impairment.",
      },
      {
        id: "prolapse-check",
        label: "Assessment for pelvic organ prolapse (POP-Q or simple grading)",
        finding: "No significant descent, stage 0–1",
        useful: true,
        cost: "low",
        rationale: "Clears prolapse as a complicating factor that would change the referral pathway.",
      },
      {
        id: "bladder-diary",
        label: "3-day bladder diary",
        finding: "Normal voiding frequency and functional bladder capacity, leaks only recorded with named activities",
        useful: true,
        cost: "low",
        rationale: "Objectifies the pattern, rules in stress incontinence, and rules out a hidden urgency component.",
      },
      {
        id: "urodynamics-first",
        label: "Refer for urodynamic studies now",
        finding: "—",
        useful: false,
        cost: "high",
        rationale:
          "Not indicated for uncomplicated SUI before a trial of supervised pelvic floor muscle training — first-line therapy comes first.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "treat",
      rationale:
        "Uncomplicated postpartum stress urinary incontinence with a demonstrable pelvic floor impairment and no red flags is treated with a supervised pelvic floor muscle training programme (at least three months), bladder and lifestyle advice, and load-managed return to running. Referral is for red flags, symptomatic prolapse, an OASI history, or failure of an adequate trial.",
    },
    escalation_required: "treat",
    diagnosis: "Postpartum stress urinary incontinence",
    key_takeaway:
      "The reasoning that matters is classification and screening — confirming the leak is effort-driven with no urgency (so the plan is pelvic floor training, not bladder retraining), and explicitly clearing haematuria, pain, prolapse, and neurological features before committing to conservative care.",
    speed_questions: [
      {
        prompt: "Urine loss on coughing or jumping, with no preceding urge, is:",
        options: ["Urgency incontinence", "Stress incontinence", "Overflow incontinence", "Functional incontinence"],
        correct: 1,
        rationale: "Effort-related loss without urgency defines stress incontinence.",
        concept: "classification",
      },
      {
        prompt: "First-line treatment for uncomplicated stress urinary incontinence is:",
        options: [
          "Urodynamic studies",
          "A supervised pelvic floor muscle training programme (≥3 months)",
          "Anticholinergic medication",
          "Mid-urethral sling surgery",
        ],
        correct: 1,
        rationale: "Supervised PFMT is the evidence-based first step.",
        concept: "management",
      },
      {
        prompt: "Which symptom would require urgent urological referral rather than physiotherapy?",
        options: [
          "Leaking with a sneeze",
          "Visible blood in the urine",
          "Leaking on the trampoline",
          "A weak pelvic floor contraction",
        ],
        correct: 1,
        rationale: "Frank haematuria needs investigation to exclude bladder pathology.",
        concept: "red-flag",
      },
      {
        prompt: "A delayed automatic pelvic floor pre-contraction on coughing indicates a deficit in:",
        options: ["Muscle strength only", "Coordination / timing", "Bladder capacity", "Detrusor stability"],
        correct: 1,
        rationale: "The 'knack' is a timing/coordination skill, trained alongside strength.",
        concept: "impairment",
      },
    ],
    xp_reward: 45,
    order: 29,
    est_minutes: 8,
    tags: ["pelvic-health", "incontinence", "postpartum", "screening"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (NICE urinary incontinence in women NG123; postpartum pelvic health guidance). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-vertebral-compression-fracture",
    title: "The Sudden Mid-Back Pain",
    subject: "Osteoporotic vertebral compression fracture — deciding to image",
    module: "geriatrics",
    body_region: "spine",
    presenting_complaint: "Sudden severe mid-back pain after a minor bend, in a 78-year-old",
    difficulty: 2,
    patient_age: 78,
    patient_sex: "female",
    occupation: "Retired",
    chief_complaint:
      "I bent over to pick up the cat's bowl and something in the middle of my back just went. The pain's severe, right in the middle, band-like around to the front. Standing and moving are agony; lying still is the only relief. It's four days now and no better.",
    presentation:
      "A 78-year-old woman, on long-term oral corticosteroids for polymyalgia rheumatica, with four days of severe thoracolumbar-junction pain after trivial flexion. Focal midline tenderness at T12–L1, pain markedly worse with any weight-bearing, eased by recumbency. No leg symptoms, no bladder or bowel change, no fever, no history of cancer. She has lost about 3 cm of height over recent years.",
    history_questions: [
      {
        id: "q-mechanism-behaviour",
        context: "You want the mechanism and the pain behaviour.",
        options: [
          "What exactly were you doing when it went, and is the pain worse when you're upright and loading your spine?",
          "Have you had back pain before?",
          "Does heat help?",
        ],
        correct: 0,
        answer:
          "Just bending forward slightly. And yes — the moment I stand or walk it's much worse; lying flat is the only thing that helps.",
        rationale:
          "Sudden severe pain from a trivial load, that is dramatically load-dependent and relieved by lying down, is the mechanical signature of a vertebral compression fracture in an at-risk patient.",
        concept: "mechanism",
      },
      {
        id: "q-red-flag-screen-vcf",
        context: "You're screening for the causes and complications that change management.",
        options: [
          "Any leg weakness or numbness, changes to bladder or bowel, fevers, night sweats, or unexplained weight loss?",
          "Do you use a stick around the house?",
          "How firm is your mattress?",
        ],
        correct: 0,
        answer: "No leg symptoms, no bladder or bowel problems, no fevers or weight loss.",
        rationale:
          "A clean neurological and systemic screen makes cord/cauda equina compromise and pathological (malignant or infective) fracture much less likely and supports a benign osteoporotic fracture — but the screen has to be done before that conclusion.",
        concept: "spinal-red-flag",
      },
    ],
    red_flags: [
      {
        id: "cord-compression",
        label: "Progressive leg weakness, sensory level, or bladder/bowel dysfunction",
        present: false,
        severity: "red",
        rationale:
          "Would indicate spinal cord or cauda equina compression from retropulsed fragment or tumour — an emergency needing same-day imaging and referral.",
      },
      {
        id: "cancer-history-weightloss",
        label: "Known cancer, unexplained weight loss, or night sweats",
        present: false,
        severity: "red",
        rationale: "Raises pathological fracture from metastasis — a different, urgent pathway.",
      },
      {
        id: "fever-infection",
        label: "Fever, recent infection, or immunosuppression with spinal pain",
        present: false,
        severity: "red",
        rationale: "Raises spinal infection (discitis/osteomyelitis).",
      },
      {
        id: "severe-uncontrolled-pain",
        label: "Pain uncontrolled by simple analgesia, preventing any mobilisation",
        present: true,
        severity: "yellow",
        rationale:
          "Not dangerous in itself, but a reason to arrange imaging promptly, optimise analgesia, and consider a brief admission or vertebroplasty referral if function collapses.",
      },
      {
        id: "long-term-steroids",
        label: "Long-term corticosteroid use",
        present: true,
        severity: "yellow",
        rationale:
          "A major secondary-osteoporosis risk that makes a fragility fracture likely and mandates a bone-health review regardless of the acute plan.",
      },
      {
        id: "height-loss-kyphosis",
        label: "Progressive height loss or increasing thoracic kyphosis",
        present: true,
        severity: "yellow",
        rationale: "Suggests previous (possibly silent) vertebral fractures — this is likely not the first.",
      },
      {
        id: "multiple-fracture-risk",
        label: "Previous fragility fracture or a strong family history of hip fracture",
        present: false,
        severity: "yellow",
        rationale: "Further raises fracture risk and the priority of starting/optimising bone-protective treatment.",
      },
      {
        id: "falls-risk",
        label: "Recent falls or new unsteadiness",
        present: false,
        severity: "yellow",
        rationale: "A falls assessment protects against the next, potentially worse, fracture.",
      },
    ],
    differentials: [
      {
        id: "osteoporotic-vcf-dx",
        label: "Osteoporotic vertebral compression fracture",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Trivial mechanism, severe load-dependent focal pain, steroid use, height loss, clean neuro screen — the classic fragility fracture.",
      },
      {
        id: "pathological-fracture",
        label: "Pathological (malignant) vertebral fracture",
        must_not_miss: true,
        correct_rank: 2,
        notes:
          "The must-not-miss. Made less likely by the absent cancer history and systemic screen, but imaging is partly done to look for it (and MRI if any doubt).",
      },
      {
        id: "mechanical-thoracic-pain",
        label: "Acute mechanical thoracolumbar pain / facet sprain",
        must_not_miss: false,
        correct_rank: 3,
        notes: "Possible, but rarely this severe or this load-dependent, and doesn't explain the picture in a high-risk patient.",
      },
      {
        id: "aortic-pathology",
        label: "Referred pain from aortic pathology",
        must_not_miss: true,
        correct_rank: 4,
        notes:
          "A ripping, tearing, or pulsatile quality, haemodynamic change, or absent femoral pulses would move this to an emergency — worth a moment's thought in an older vasculopath with sudden back pain.",
      },
    ],
    examinations: [
      {
        id: "focal-percussion",
        label: "Spinous process palpation and percussion",
        finding: "Sharp, well-localised tenderness and pain on percussion at the T12–L1 spinous processes",
        useful: true,
        cost: "low",
        rationale: "Focal bony tenderness with percussion pain localises the level and supports a fracture over diffuse mechanical pain.",
      },
      {
        id: "neuro-lower-limb",
        label: "Lower-limb neurological examination (power, sensation, reflexes, plantars)",
        finding: "Normal throughout, symmetrical reflexes, downgoing plantars",
        useful: true,
        cost: "low",
        rationale: "A normal exam makes cord involvement unlikely and is the baseline to monitor against.",
      },
      {
        id: "loaded-vs-unloaded",
        label: "Compare pain supine vs. sitting/standing",
        finding: "Minimal pain lying flat, severe on sitting up and standing",
        useful: true,
        cost: "low",
        rationale: "Marked load-dependence is characteristic of an acute vertebral fracture.",
      },
      {
        id: "spine-xray-vcf",
        label: "Arrange spinal X-ray (AP and lateral)",
        finding: "Anterior wedge compression of L1 with ~35% height loss; old wedge deformity at T8",
        useful: true,
        cost: "moderate",
        rationale:
          "Appropriate first imaging given the age, steroid use, severity, and focal signs — confirms the fracture and reveals a prior one. MRI is added if malignancy or infection is a concern or if there are neurological signs.",
      },
      {
        id: "vigorous-mobilisation-vcf",
        label: "Progress to end-range thoracic mobilisation and extension loading",
        finding: "—",
        useful: false,
        cost: "low",
        rationale: "Inappropriate before the diagnosis is confirmed and in the acute phase of a fresh fracture.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "investigate",
      rationale:
        "Sudden severe load-dependent focal spinal pain in an older patient on long-term steroids warrants imaging before a management plan — a plain film to confirm the fracture and screen for a pathological cause, with MRI if there is any neurological sign or diagnostic doubt. Alongside imaging: analgesia, early graded mobilisation as pain allows, a falls assessment, and an urgent bone-health/osteoporosis review. Same-day referral only if neurological features develop.",
    },
    escalation_required: "investigate",
    diagnosis: "Acute osteoporotic vertebral compression fracture (L1)",
    key_takeaway:
      "The decision here is whether to image before treating: a trivial mechanism producing severe, load-dependent focal pain in a steroid-using 78-year-old crosses that threshold, and the neurological and systemic screen is what lets you frame it as a fragility fracture rather than something worse.",
    speed_questions: [
      {
        prompt: "Which pain behaviour is most characteristic of an acute vertebral compression fracture?",
        options: [
          "Worse in the morning, eases with movement",
          "Severe when upright and loading the spine, relieved by lying flat",
          "Constant and unrelated to position",
          "Only present with rotation",
        ],
        correct: 1,
        rationale: "Acute vertebral fractures are strikingly load-dependent.",
        concept: "pattern",
      },
      {
        prompt: "Long-term use of which drug most raises the risk of a fragility vertebral fracture?",
        options: ["Metformin", "Oral corticosteroids", "Beta-blockers", "Proton pump inhibitors"],
        correct: 1,
        rationale: "Corticosteroids cause secondary osteoporosis.",
        concept: "risk-factor",
      },
      {
        prompt: "Which finding would turn a suspected compression fracture into a same-day emergency?",
        options: [
          "Focal spinous process tenderness",
          "New progressive leg weakness or bladder dysfunction",
          "Pain eased by lying down",
          "A history of height loss",
        ],
        correct: 1,
        rationale: "Neurological signs raise cord or cauda equina compression.",
        concept: "red-flag",
      },
      {
        prompt: "Beyond treating the fracture, the essential parallel action is:",
        options: [
          "A repeat X-ray in one week",
          "An urgent bone-health / osteoporosis review",
          "Six weeks of bed rest",
          "A lumbar support corset for life",
        ],
        correct: 1,
        rationale: "The fracture signals untreated osteoporosis — the next fracture is preventable.",
        concept: "management",
      },
    ],
    xp_reward: 50,
    order: 30,
    est_minutes: 9,
    tags: ["spine", "geriatrics", "fracture", "osteoporosis", "red-flag"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (osteoporotic vertebral fracture management; spinal red flags; NOGG/NICE osteoporosis guidance). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-peripheral-arterial-disease",
    title: "The Calf That Cramps on the Hill",
    subject: "Intermittent claudication vs. neurogenic (spinal) claudication",
    module: "cardio",
    body_region: "lower_leg",
    presenting_complaint: "Calf cramping pain after walking a set distance, relieved by standing still",
    difficulty: 2,
    patient_age: 66,
    patient_sex: "male",
    occupation: "Retired bus driver",
    chief_complaint:
      "After about 200 metres, especially uphill, my right calf cramps up and I have to stop. If I just stand still for a minute or two it goes and I can walk again — same distance, same thing. Downhill and on the flat I get further.",
    presentation:
      "A 66-year-old current smoker with type 2 diabetes and treated hypertension, describing reproducible right calf pain at a consistent walking distance, worse uphill, relieved promptly by standing rest, and returning at the same distance. The right foot is cooler than the left with reduced hair growth; he has noticed a small ulcer on the right great toe that is slow to heal.",
    history_questions: [
      {
        id: "q-claudication-pattern",
        context: "You're separating vascular from neurogenic claudication.",
        options: [
          "Does it come on at a predictable distance and settle just by standing still — or do you need to sit or bend forward to ease it?",
          "Do your shoes fit well?",
          "Which leg do you favour on stairs?",
        ],
        correct: 0,
        answer: "A predictable distance every time, and just standing still fixes it — I don't need to sit or lean on anything.",
        rationale:
          "Vascular claudication is distance-reproducible and relieved by standing rest alone; neurogenic (spinal stenosis) claudication is posture-dependent, eased by flexion/sitting, and more variable — the history is the main discriminator.",
        concept: "claudication-type",
      },
      {
        id: "q-critical-ischaemia",
        context: "You're screening for limb-threatening disease.",
        options: [
          "Any pain in the foot at rest, especially at night, and how is that toe ulcer doing?",
          "Do you stretch your calves before walking?",
          "Have you tried compression socks?",
        ],
        correct: 0,
        answer: "It does ache in the foot at night sometimes, and I hang it out of the bed to ease it. The toe ulcer isn't healing.",
        rationale:
          "Rest pain relieved by dependency, plus a non-healing distal ulcer, indicates chronic limb-threatening ischaemia — an urgent vascular referral, not a walking programme.",
        concept: "critical-ischaemia",
      },
    ],
    red_flags: [
      {
        id: "rest-pain",
        label: "Ischaemic rest pain (foot pain at rest, worse elevated, eased by dependency)",
        present: true,
        severity: "red",
        rationale: "A hallmark of critical limb ischaemia — the limb is threatened and needs urgent vascular assessment.",
      },
      {
        id: "non-healing-ulcer-gangrene",
        label: "Non-healing distal ulcer, tissue loss, or gangrene",
        present: true,
        severity: "red",
        rationale: "Tissue loss defines chronic limb-threatening ischaemia — same-week vascular referral.",
      },
      {
        id: "acute-limb-ischaemia",
        label: "Sudden onset of a pale, pulseless, painful, cold, paralysed leg",
        present: false,
        severity: "red",
        rationale: "Acute limb ischaemia — a surgical emergency within hours.",
      },
      {
        id: "diabetic-foot-infection",
        label: "Spreading redness, discharge, or systemic upset around the foot ulcer",
        present: false,
        severity: "yellow",
        rationale: "A diabetic foot infection can escalate fast and needs prompt multidisciplinary foot-team input.",
      },
      {
        id: "smoking-diabetes",
        label: "Current smoking and diabetes",
        present: true,
        severity: "yellow",
        rationale:
          "The dominant modifiable drivers of progression — central to the plan and the referral letter, not an acute danger themselves.",
      },
      {
        id: "cardiovascular-risk-global",
        label: "Known coronary or cerebrovascular disease",
        present: false,
        severity: "yellow",
        rationale: "Peripheral arterial disease is a coronary risk equivalent; global cardiovascular risk management matters as much as the leg.",
      },
      {
        id: "rapidly-shortening-distance",
        label: "Claudication distance shortening rapidly over weeks",
        present: false,
        severity: "yellow",
        rationale: "Rapid deterioration suggests progression toward critical ischaemia and warrants earlier review.",
      },
      {
        id: "absent-pulses",
        label: "Absent foot pulses with a cool, hairless, pale limb",
        present: true,
        severity: "yellow",
        rationale: "Objective signs of significant arterial insufficiency that support the diagnosis and the referral.",
      },
    ],
    differentials: [
      {
        id: "pad-claudication-dx",
        label: "Peripheral arterial disease with intermittent claudication",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Distance-reproducible calf pain relieved by standing, worse uphill, with a cool pulseless foot and risk factors — but the rest pain and ulcer mean this is already critical ischaemia.",
      },
      {
        id: "critical-limb-ischaemia-dx",
        label: "Chronic limb-threatening (critical) ischaemia",
        must_not_miss: true,
        correct_rank: 2,
        notes:
          "The must-not-miss and, given the rest pain and non-healing ulcer, arguably the actual current state — it changes the disposition from 'treat and exercise' to 'refer urgently'.",
      },
      {
        id: "neurogenic-claudication",
        label: "Neurogenic claudication (lumbar spinal stenosis)",
        must_not_miss: false,
        correct_rank: 3,
        notes:
          "The main differential for the walking-induced pain, but it's posture-dependent (eased by flexion/sitting), not relieved by standing still, and doesn't cause a cool pulseless foot or an ulcer.",
      },
      {
        id: "chronic-venous-disease",
        label: "Chronic venous insufficiency",
        must_not_miss: false,
        correct_rank: 4,
        notes: "Causes aching and heaviness eased by elevation, with warm oedematous limbs and gaiter-area changes — the opposite vascular picture.",
      },
    ],
    examinations: [
      {
        id: "pulses-palpation",
        label: "Palpate femoral, popliteal, dorsalis pedis, and posterior tibial pulses",
        finding: "Femoral present, popliteal weak, both right foot pulses absent; left foot pulses present",
        useful: true,
        cost: "low",
        rationale: "Localises the level of disease and directly supports an arterial cause.",
      },
      {
        id: "abpi",
        label: "Ankle-brachial pressure index (ABPI)",
        finding: "Right ABPI 0.4 (left 0.95)",
        useful: true,
        cost: "low",
        rationale:
          "An ABPI < 0.5 indicates severe arterial disease and, with rest pain and tissue loss, confirms critical limb ischaemia. (Note diabetes can falsely elevate ABPI — a normal value wouldn't exclude disease.)",
      },
      {
        id: "foot-inspection",
        label: "Inspect the foot, nailbeds, and pressure areas; capillary refill; Buerger's test",
        finding: "Dependent rubor, pallor on elevation, sluggish capillary refill, a 1 cm non-granulating ulcer on the great toe",
        useful: true,
        cost: "low",
        rationale: "Documents the tissue loss and ischaemic skin changes that define the severity and urgency.",
      },
      {
        id: "lumbar-spine-screen-pad",
        label: "Lumbar spine screen (extension tolerance, neuro exam, pulses reproduced by walking not by spine position)",
        finding: "Full pain-free lumbar extension, normal lower-limb neurology, symptoms not provoked by spinal positions",
        useful: true,
        cost: "low",
        rationale: "Actively excludes neurogenic claudication as the explanation.",
      },
      {
        id: "supervised-exercise-first-pad",
        label: "Start a supervised exercise (walking) programme now",
        finding: "—",
        useful: false,
        cost: "low",
        rationale:
          "A structured walking programme is first-line for stable claudication — but not when there is rest pain and a non-healing ulcer, which need urgent revascularisation assessment first.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "refer_urgent",
      rationale:
        "Reproducible claudication would be managed with risk-factor modification and a supervised exercise programme — but ischaemic rest pain plus a non-healing toe ulcer and an ABPI of 0.4 is chronic limb-threatening ischaemia, which needs urgent (same-week) vascular surgery referral for revascularisation assessment and multidisciplinary diabetic-foot input. Smoking cessation and antiplatelet/statin optimisation run in parallel.",
    },
    escalation_required: "refer_urgent",
    diagnosis: "Peripheral arterial disease — chronic limb-threatening ischaemia",
    key_takeaway:
      "The reasoning has two steps: the history (distance-reproducible, relieved by standing) and a pulseless cool foot separate vascular from neurogenic claudication — and then the rest pain and non-healing ulcer escalate it from 'exercise programme' to 'urgent vascular referral', because the limb is threatened.",
    speed_questions: [
      {
        prompt: "Vascular (intermittent) claudication is typically relieved by:",
        options: [
          "Sitting down or bending forward",
          "Simply standing still for a minute or two",
          "Lying flat with the legs elevated",
          "Lumbar extension",
        ],
        correct: 1,
        rationale: "Standing rest suffices; neurogenic claudication needs flexion/sitting.",
        concept: "claudication-type",
      },
      {
        prompt: "Which finding indicates chronic limb-threatening ischaemia rather than stable claudication?",
        options: [
          "Calf pain after 200 m of walking",
          "Foot pain at rest, worse at night, eased by hanging the foot down",
          "Pain worse walking uphill",
          "A predictable claudication distance",
        ],
        correct: 1,
        rationale: "Ischaemic rest pain (and tissue loss) defines the critical, limb-threatening stage.",
        concept: "critical-ischaemia",
      },
      {
        prompt: "First-line management of stable intermittent claudication (no rest pain or tissue loss) is:",
        options: [
          "Urgent bypass surgery",
          "Risk-factor modification plus a supervised exercise programme",
          "Bed rest and leg elevation",
          "Compression bandaging",
        ],
        correct: 1,
        rationale: "Exercise therapy and secondary prevention are first-line for stable disease.",
        concept: "management",
      },
      {
        prompt: "In a patient with diabetes, a normal ABPI:",
        options: [
          "Reliably excludes peripheral arterial disease",
          "May be falsely elevated by medial arterial calcification and can't exclude disease",
          "Indicates critical ischaemia",
          "Is not measurable",
        ],
        correct: 1,
        rationale: "Calcified vessels resist compression, falsely raising the index.",
        concept: "test-limitation",
      },
    ],
    xp_reward: 50,
    order: 31,
    est_minutes: 9,
    tags: ["lower-leg", "vascular", "claudication", "red-flag", "cardio"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (NICE peripheral arterial disease CG147; ABPI interpretation; critical limb ischaemia definitions). Not verified for this app.",
    ],
    content_status: "demonstration",
  },

  {
    id: "draft-parkinsons-early",
    title: "The Slowing Handwriting",
    subject: "Early idiopathic Parkinson's disease — recognising it, and screening for the atypical",
    module: "neuro",
    body_region: "head",
    presenting_complaint: "A year of a right-hand tremor, slowness, and smaller handwriting in a 64-year-old",
    difficulty: 2,
    patient_age: 64,
    patient_sex: "male",
    occupation: "Accountant",
    chief_complaint:
      "My right hand shakes when it's resting in my lap, but it stops when I pick something up. My writing's got tiny and cramped, buttons take forever, and my wife says I don't swing that arm when I walk. It's crept up over about a year.",
    presentation:
      "A 64-year-old with a 12-month insidious history of a right-hand rest tremor, micrographia, bradykinesia with fine tasks, and reduced right arm swing, noticed first by his wife. Also reports reduced sense of smell over two years and acting out dreams. No falls, no early cognitive change, no bladder problems, normal blood pressure sitting and standing.",
    history_questions: [
      {
        id: "q-tremor-character",
        context: "You want to characterise the tremor.",
        options: [
          "Is the tremor there when the hand is completely at rest, and does it ease when you reach for something?",
          "Is it worse after coffee?",
          "Do both hands shake equally?",
        ],
        correct: 0,
        answer: "It's worst when the hand's just sitting still. The moment I reach for a cup it settles right down.",
        rationale:
          "A resting tremor that suppresses with action, and is asymmetrical, is characteristic of parkinsonism and separates it from an essential (action) tremor.",
        concept: "tremor-type",
      },
      {
        id: "q-atypical-screen",
        context: "You're screening for features that would point away from idiopathic Parkinson's.",
        options: [
          "Any early falls, fainting on standing, rapid memory change, or double vision?",
          "Do you take a multivitamin?",
          "How many hours do you sleep?",
        ],
        correct: 0,
        answer: "None of those — no falls, no dizziness standing up, memory's fine, vision's fine.",
        rationale:
          "Early falls, prominent early autonomic failure, rapid cognitive decline, or a vertical gaze palsy suggest an atypical parkinsonian syndrome (MSA, PSP) or drug-induced parkinsonism — their absence supports idiopathic Parkinson's and a good response to treatment.",
        concept: "atypical-red-flag",
      },
    ],
    red_flags: [
      {
        id: "early-falls",
        label: "Recurrent falls within the first year of symptoms",
        present: false,
        severity: "red",
        rationale: "Early postural instability and falls point to progressive supranuclear palsy or MSA rather than idiopathic Parkinson's.",
      },
      {
        id: "early-autonomic-failure",
        label: "Prominent early orthostatic hypotension, urinary failure, or erectile dysfunction",
        present: false,
        severity: "red",
        rationale: "Early, severe autonomic failure is a hallmark of multiple system atrophy.",
      },
      {
        id: "vertical-gaze-palsy",
        label: "Restricted downward gaze / early square-wave jerks",
        present: false,
        severity: "red",
        rationale: "A vertical supranuclear gaze palsy is characteristic of PSP.",
      },
      {
        id: "rapid-cognitive-decline",
        label: "Rapid cognitive decline or early prominent hallucinations",
        present: false,
        severity: "yellow",
        rationale:
          "Early dementia or hallucinations raise dementia with Lewy bodies — a caution flag that changes prognosis and drug choices.",
      },
      {
        id: "symmetrical-lower-body",
        label: "Symmetrical, lower-body-predominant parkinsonism with a stepwise course",
        present: false,
        severity: "yellow",
        rationale: "Suggests vascular parkinsonism rather than idiopathic Parkinson's.",
      },
      {
        id: "drug-history",
        label: "Recent dopamine-blocking drugs (antipsychotics, metoclopramide, prochlorperazine)",
        present: false,
        severity: "yellow",
        rationale: "Drug-induced parkinsonism is common, often reversible, and must be excluded from the history.",
      },
      {
        id: "supportive-prodrome",
        label: "Long-standing reduced smell and REM sleep behaviour disorder",
        present: true,
        severity: "yellow",
        rationale:
          "Not a warning — these are supportive prodromal features that increase confidence in idiopathic Parkinson's.",
      },
      {
        id: "no-levodopa-response",
        label: "No response to an adequate levodopa trial (later)",
        present: false,
        severity: "yellow",
        rationale: "A poor levodopa response over time argues against idiopathic Parkinson's and prompts reappraisal.",
      },
    ],
    differentials: [
      {
        id: "idiopathic-pd-dx",
        label: "Idiopathic Parkinson's disease",
        must_not_miss: false,
        correct_rank: 1,
        notes:
          "Asymmetrical rest tremor, bradykinesia, micrographia, reduced arm swing, hyposmia and RBD prodrome, no atypical features — the classic early picture.",
      },
      {
        id: "essential-tremor",
        label: "Essential tremor",
        must_not_miss: false,
        correct_rank: 2,
        notes:
          "Common and often confused, but it's an action/postural tremor (worse holding a cup), usually bilateral, with no bradykinesia or micrographia.",
      },
      {
        id: "drug-induced-parkinsonism",
        label: "Drug-induced parkinsonism",
        must_not_miss: true,
        correct_rank: 3,
        notes:
          "The must-not-miss because it's reversible — always interrogate the drug history for dopamine antagonists before labelling this Parkinson's.",
      },
      {
        id: "atypical-parkinsonism",
        label: "Atypical parkinsonism (MSA / PSP)",
        must_not_miss: true,
        correct_rank: 4,
        notes:
          "Different prognosis and management — flagged by early falls, early autonomic failure, or a gaze palsy, none present here.",
      },
    ],
    examinations: [
      {
        id: "bradykinesia-tasks",
        label: "Finger tapping, hand opening/closing, pronation-supination — look for decrement",
        finding: "Progressive slowing and reducing amplitude ('sequence effect') on the right, mild on the left",
        useful: true,
        cost: "low",
        rationale:
          "Bradykinesia with a decrementing amplitude is the core, required feature for parkinsonism and the most useful thing to demonstrate.",
      },
      {
        id: "rigidity-gait",
        label: "Tone (cogwheel rigidity), gait, arm swing, and postural stability (pull test)",
        finding: "Cogwheel rigidity at the right wrist, reduced right arm swing, normal stride, normal pull test",
        useful: true,
        cost: "low",
        rationale:
          "Confirms rigidity and asymmetry; a normal pull test this early is reassuring against PSP/MSA.",
      },
      {
        id: "tremor-observation",
        label: "Observe the tremor at rest, with arms outstretched, and during finger-nose",
        finding: "4–6 Hz tremor present at rest, damping with posture and action, re-emerging after a delay on posture",
        useful: true,
        cost: "low",
        rationale: "A classic rest tremor with re-emergence — distinguishes it from essential tremor.",
      },
      {
        id: "lying-standing-bp",
        label: "Lying and standing blood pressure",
        finding: "132/80 lying, 128/78 standing — no postural drop",
        useful: true,
        cost: "low",
        rationale: "Screens for the early autonomic failure of MSA; a normal result supports idiopathic Parkinson's.",
      },
      {
        id: "brain-mri-pd",
        label: "Request a brain MRI to confirm Parkinson's disease",
        finding: "Typically normal in idiopathic Parkinson's",
        useful: false,
        cost: "high",
        rationale:
          "Idiopathic Parkinson's is a clinical diagnosis; MRI is used to look for structural or vascular mimics when the picture is atypical, not to confirm typical disease.",
      },
    ],
    disposition: {
      options: FULL_LADDER,
      correct: "refer_routine",
      rationale:
        "A typical early parkinsonian syndrome with no atypical or drug-induced features should be referred (routinely, not urgently) to neurology / a movement-disorder service for diagnosis confirmation and to initiate medical management. Physiotherapy runs alongside — early exercise, gait and dual-task training, and education — but the diagnosis and drug treatment are led by the specialist. Urgent referral is reserved for red flags such as rapid progression or early falls.",
    },
    escalation_required: "refer_routine",
    diagnosis: "Suspected idiopathic Parkinson's disease (early)",
    key_takeaway:
      "Two pieces of reasoning: bradykinesia with a decrementing amplitude plus an asymmetrical rest tremor names the syndrome as parkinsonism, and a clean screen for early falls, autonomic failure, gaze palsy, and dopamine-blocking drugs is what supports the 'idiopathic' label and a routine — rather than urgent — referral.",
    speed_questions: [
      {
        prompt: "A tremor that is present at rest and eases when the hand reaches for an object is:",
        options: ["Essential tremor", "A parkinsonian rest tremor", "Physiological tremor", "Cerebellar (intention) tremor"],
        correct: 1,
        rationale: "Rest tremor that suppresses with action is characteristic of parkinsonism.",
        concept: "tremor-type",
      },
      {
        prompt: "The core, required motor feature to diagnose parkinsonism is:",
        options: ["Rest tremor", "Bradykinesia (with decrementing amplitude)", "Rigidity", "Postural instability"],
        correct: 1,
        rationale: "Bradykinesia is mandatory; the others are supporting features.",
        concept: "diagnostic-criteria",
      },
      {
        prompt: "Which feature would point AWAY from idiopathic Parkinson's toward an atypical syndrome?",
        options: [
          "Reduced sense of smell",
          "Recurrent falls in the first year",
          "Asymmetrical onset",
          "A good response to levodopa",
        ],
        correct: 1,
        rationale: "Early postural instability and falls suggest PSP or MSA.",
        concept: "atypical-red-flag",
      },
      {
        prompt: "The appropriate referral for a typical early parkinsonian syndrome with no red flags is:",
        options: [
          "Same-day emergency referral",
          "Routine referral to neurology / a movement-disorder service",
          "No referral — manage in primary care",
          "Direct referral to neurosurgery",
        ],
        correct: 1,
        rationale: "Diagnosis and medical management are specialist-led, but not an emergency.",
        concept: "escalation",
      },
    ],
    xp_reward: 45,
    order: 32,
    est_minutes: 9,
    tags: ["neuro", "parkinsons", "movement-disorder", "screening"],
    references: [
      "NEEDS_CLINICAL_REVIEW — drafted from standard teaching (MDS clinical diagnostic criteria for Parkinson's disease; UK PD guidelines; atypical parkinsonism red flags). Not verified for this app.",
    ],
    content_status: "demonstration",
  },
];
