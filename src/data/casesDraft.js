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
];
