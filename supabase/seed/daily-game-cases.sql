-- ── Guess the Diagnosis — case seed ─────────────────────────────────────
-- NEEDS_CLINICAL_REVIEW. AI-drafted daily-game cases. Clues run vague →
-- near-pathognomonic (one is revealed per guess). Attribute vocabulary
-- matches the existing bank (region / system / tissue / chronicity /
-- mechanism, lowercase, single words where possible).
--
-- Run this in the Supabase SQL editor. It appends: case_number continues
-- from whatever's already approved, and everything lands status='approved'
-- so it's in rotation immediately. Delete rows or set status='rejected'
-- for any you don't want after review.

with new_cases (diagnosis, synonyms, region, system, tissue, chronicity, mechanism, clues, explanation) as (
  values
  (
    'De Quervain tenosynovitis',
    array['de quervain', 'de quervain syndrome', 'radial styloid tenosynovitis', 'mummy thumb'],
    'wrist', 'musculoskeletal', 'tendon', 'chronic', 'overuse',
    array[
      'A 34-year-old new parent reports pain on the thumb side of the wrist that has built up over a few weeks.',
      'It hurts most when lifting the baby under the arms, wringing a cloth, or texting.',
      'There is tenderness and slight swelling over the radial styloid, near the base of the thumb.',
      'Resisted thumb extension and abduction reproduce the pain; grip is painful but strong.',
      'Ulnar deviation of the wrist with the thumb tucked into the fist is sharply painful (a positive Finkelstein / Eichhoff test).',
      'The first dorsal compartment tendons — abductor pollicis longus and extensor pollicis brevis — are the ones involved.'
    ],
    'De Quervain tenosynovitis is stenosing tenosynovitis of the first dorsal compartment, classic in the postpartum period and in repetitive thumb-loading tasks. Managed with load modification, a thumb spica splint, and sometimes a corticosteroid injection.'
  ),
  (
    'Adhesive capsulitis',
    array['frozen shoulder', 'adhesive capsulitis of the shoulder'],
    'shoulder', 'musculoskeletal', 'capsule', 'insidious', 'idiopathic',
    array[
      'A 55-year-old with type 2 diabetes has had a deep, aching shoulder for four months with no injury.',
      'The ache is worse at night and lying on that side wakes them.',
      'Reaching behind the back for a wallet or a bra strap, and up to a high shelf, has become very limited.',
      'Both active and passive movement are restricted — roughly equally — with a hard end-feel.',
      'External rotation with the arm at the side is the most restricted movement of all.',
      'It is a self-limiting contracture of the glenohumeral joint capsule, strongly linked to diabetes.'
    ],
    'Adhesive capsulitis progresses through freezing, frozen, and thawing phases over 1–3 years. The tell is that passive range is as limited as active range, with external rotation lost first — distinguishing it from a rotator-cuff problem.'
  ),
  (
    'Rotator cuff related shoulder pain',
    array['subacromial pain syndrome', 'rotator cuff tendinopathy', 'shoulder impingement', 'subacromial impingement'],
    'shoulder', 'musculoskeletal', 'tendon', 'chronic', 'overuse',
    array[
      'A 48-year-old painter has had lateral shoulder pain for two months, worse after a week of ceiling work.',
      'Pain comes on reaching overhead and settles with rest; night pain is mild.',
      'There is a painful arc of active abduction roughly between 60 and 120 degrees.',
      'Passive range is full and pain-free; resisted abduction and external rotation are weak and sore.',
      'Hawkins-Kennedy and empty-can tests reproduce the familiar pain.',
      'The supraspinatus tendon and the subacromial space are the usual source.'
    ],
    'Rotator-cuff-related shoulder pain is the umbrella term for tendinopathy and subacromial pain. Active range is worse than passive (unlike capsulitis), and management is load-graded exercise, not rest.'
  ),
  (
    'Cervical radiculopathy',
    array['pinched nerve in the neck', 'cervical nerve root compression', 'c6 radiculopathy', 'c7 radiculopathy'],
    'neck', 'neurological', 'nerve', 'subacute', 'compressive',
    array[
      'A 46-year-old wakes with neck pain that over a week spreads down one arm.',
      'There is now pins-and-needles into specific fingers and a feeling of arm heaviness.',
      'Resting the hand on top of the head eases the arm symptoms.',
      'A dermatomal sensory change, a reduced reflex, and mild myotomal weakness are found in one limb.',
      'Spurling test — extension and rotation toward the painful side with axial pressure — reproduces the arm pain; distraction relieves it.',
      'A disc or foraminal osteophyte is compressing a single cervical nerve root.'
    ],
    'Cervical radiculopathy usually follows a favourable natural history. The key is a clean screen for myelopathy (gait, hand function, bilateral signs) before committing to conservative care.'
  ),
  (
    'Lumbar disc herniation with radiculopathy',
    array['sciatica', 'slipped disc', 'herniated disc', 'lumbar radiculopathy', 'prolapsed disc'],
    'lumbar spine', 'neurological', 'disc', 'acute', 'compressive',
    array[
      'A 32-year-old warehouse worker tweaked their back lifting a box a week ago.',
      'The back pain is easing but leg pain now shoots below the knee, with numbness on the top of the foot.',
      'Sitting, coughing, and sneezing make the leg pain worse; walking is more comfortable.',
      'Straight leg raise on the affected side reproduces the leg pain at 40 degrees.',
      'There is weak great-toe extension and blunted sensation over the dorsum of the foot (an L5 pattern).',
      'A paracentral disc extrusion is contacting the traversing nerve root.'
    ],
    'A single-level radiculopathy with stable, non-progressive signs and a negative cauda equina screen has a good natural history. The reasoning that matters is the saddle/bladder screen you do first.'
  ),
  (
    'Cauda equina syndrome',
    array['ces', 'cauda equina'],
    'lumbar spine', 'neurological', 'nerve', 'acute', 'compressive',
    array[
      'A 40-year-old with a few days of severe low back pain and bilateral leg pain attends in distress.',
      'Overnight they have noticed numbness when wiping after using the toilet.',
      'They had to strain to pass urine this morning and are not sure their bladder emptied.',
      'Sensation is reduced around the perineum and inner thighs on both sides.',
      'Anal tone is reduced and there is a large post-void residual on bladder scan.',
      'Compression of the lumbosacral nerve roots below the conus — a same-day surgical emergency.'
    ],
    'Saddle anaesthesia and bladder or bowel dysfunction with bilateral radicular signs is cauda equina syndrome until proven otherwise. It needs an emergency MRI and surgical referral; time to decompression affects outcome.'
  ),
  (
    'Carpal tunnel syndrome',
    array['cts', 'median nerve entrapment at the wrist'],
    'wrist', 'neurological', 'nerve', 'chronic', 'compressive',
    array[
      'A 39-year-old data-entry clerk has hand numbness that wakes them at night.',
      'They shake the hand out to relieve it; it also happens holding a phone or driving.',
      'The tingling is in the thumb, index, and middle fingers — the little finger is spared.',
      'Sensation over the thenar palm near the wrist crease is normal, but the fingertips are dull.',
      'Phalen and carpal compression tests reproduce the symptoms; there is early thenar bulk loss.',
      'The median nerve is compressed within the carpal tunnel.'
    ],
    'Median-territory paraesthesia that spares the little finger and the thenar palm localises to the wrist. A clean cervical screen lets you treat the wrist rather than chase the wrong level.'
  ),
  (
    'Cubital tunnel syndrome',
    array['ulnar neuropathy at the elbow', 'ulnar nerve entrapment'],
    'elbow', 'neurological', 'nerve', 'chronic', 'compressive',
    array[
      'A 44-year-old notices numbness in the last two fingers, worse when the elbow is bent for a while.',
      'Talking on the phone or sleeping with the elbow flexed brings it on.',
      'There is a dropped, clumsy feeling in the hand and difficulty crossing the fingers.',
      'Tapping behind the medial epicondyle sends tingling into the ring and little fingers (a positive Tinel).',
      'The elbow-flexion test held for 60 seconds reproduces the numbness; first-dorsal-interosseous strength is reduced.',
      'The ulnar nerve is compressed as it passes behind the medial epicondyle.'
    ],
    'Cubital tunnel syndrome is the second most common upper-limb nerve entrapment. Little-and-ring-finger numbness plus intrinsic hand weakness, worse with elbow flexion, is the pattern.'
  ),
  (
    'Greater trochanteric pain syndrome',
    array['gtps', 'gluteal tendinopathy', 'trochanteric bursitis', 'hip bursitis'],
    'hip', 'musculoskeletal', 'tendon', 'chronic', 'overuse',
    array[
      'A 54-year-old woman has pain over the outside of the hip that has crept up over months.',
      'Lying on that side at night is painful, and so is standing on one leg to put on trousers.',
      'Climbing stairs and getting up from a low chair aggravate it; the groin is fine.',
      'There is point tenderness over the greater trochanter and a positive Trendelenburg sign.',
      'Single-leg stance for 30 seconds and resisted hip abduction both reproduce the lateral pain.',
      'It is a tendinopathy of gluteus medius and minimus at their trochanteric insertion, often with a secondary bursitis.'
    ],
    'GTPS is far more often gluteal tendinopathy than a primary bursitis. Lateral pain, night pain lying on the side, and pain with single-leg loading — with a normal hip joint — is the picture. Avoid adductor stretches that compress the tendon.'
  ),
  (
    'Patellofemoral pain',
    array['pfp', 'patellofemoral pain syndrome', 'runners knee', 'anterior knee pain'],
    'knee', 'musculoskeletal', 'cartilage', 'chronic', 'overuse',
    array[
      'A 22-year-old recreational runner has vague pain around and behind the kneecap.',
      'It came on gradually after increasing weekly mileage; there was no injury and no swelling.',
      'Going down stairs, squatting, and sitting with the knee bent for a long time (the "theatre sign") all provoke it.',
      'There is no effusion and the joint lines are non-tender; patellar compression during a quad contraction hurts.',
      'A single-leg squat shows the knee falling inward with poor hip control.',
      'Pain arises from the patellofemoral joint, driven by load and movement-pattern factors rather than a structural lesion.'
    ],
    'Patellofemoral pain is a diagnosis of exclusion for diffuse anterior knee pain with no effusion or mechanical symptoms. Management targets load and hip/quads control. Beware the runner whose "PFP" has night pain and focal bony tenderness — that is bone stress.'
  ),
  (
    'Meniscus tear',
    array['torn meniscus', 'meniscal tear', 'cartilage tear in the knee'],
    'knee', 'musculoskeletal', 'cartilage', 'acute', 'traumatic',
    array[
      'A 28-year-old footballer twisted the knee while planting and turning, and felt a pop.',
      'The knee swelled gradually over the next day, not immediately.',
      'It occasionally catches or locks, and giving a sharp pain when squatting deep.',
      'There is a small effusion and tenderness right on the joint line.',
      'McMurray and Thessaly tests reproduce the joint-line pain and a click.',
      'A tear of the fibrocartilage meniscus, typically medial, from a twisting load on a flexed weight-bearing knee.'
    ],
    'Gradual (not immediate) swelling, joint-line tenderness, and mechanical catching after a twisting injury point to a meniscus tear. Immediate large haemarthrosis would raise ACL rupture instead.'
  ),
  (
    'Patellar tendinopathy',
    array['jumpers knee', 'patellar tendinitis', 'patellar tendinosis'],
    'knee', 'musculoskeletal', 'tendon', 'chronic', 'overuse',
    array[
      'A 19-year-old volleyball player has anterior knee pain that has built up over a season of heavy jump training.',
      'It hurts at the start of activity, warms up, then returns and worsens after training.',
      'Pain is pinpoint at the bottom tip of the kneecap.',
      'There is focal tenderness at the inferior patellar pole; the joint is otherwise normal.',
      'A single-leg decline squat loads the tendon and reproduces the exact pain.',
      'It is a load-related tendinopathy of the proximal patellar tendon, at its patellar attachment.'
    ],
    'Jumper''s knee is localised to the inferior patellar pole (unlike Osgood-Schlatter at the tibial tuberosity). It responds to progressive tendon loading, not rest.'
  ),
  (
    'Medial tibial stress syndrome',
    array['shin splints', 'mtss', 'tibial periostitis'],
    'lower leg', 'musculoskeletal', 'bone', 'subacute', 'overuse',
    array[
      'A 20-year-old military recruit has shin pain that started after a rapid increase in running and marching.',
      'The ache is along the inner border of the shin, over a long stretch rather than one point.',
      'It hurts at the start of a run, may ease mid-run, and aches afterward.',
      'There is diffuse tenderness along the distal two-thirds of the posteromedial tibial border.',
      'Hopping is uncomfortable but possible, and there is no single sharply tender spot.',
      'It is an overload reaction of the tibia and its periosteum along the medial border — on the spectrum before a stress fracture.'
    ],
    'MTSS tenderness is diffuse and linear along the medial tibia. A focal, pinpoint tender spot with night pain and pain on single-leg hop should raise a tibial stress fracture instead.'
  ),
  (
    'Tibial stress fracture',
    array['tibial stress reaction', 'stress fracture of the tibia', 'bone stress injury of the tibia'],
    'lower leg', 'musculoskeletal', 'bone', 'subacute', 'overuse',
    array[
      'A 27-year-old marathon trainee has six weeks of shin pain and has kept running through it.',
      'The pain now comes on earlier in each run and lingers at rest; it sometimes wakes them at night.',
      'There was a spike in training load and, for a female runner, a history of missed periods.',
      'There is sharp, focal tenderness at one point on the tibia — not spread along it.',
      'Single-leg hop reproduces the pain at that exact spot; a tuning fork over the site is uncomfortable.',
      'It is a fatigue fracture of the tibial cortex from repetitive loading outpacing bone remodelling.'
    ],
    'Focal bony tenderness, night pain, pain on hopping, and a load spike distinguish a stress fracture from shin splints. It needs relative rest and load management, and screening for the female athlete triad / RED-S.'
  ),
  (
    'Achilles tendinopathy',
    array['achilles tendinitis', 'achilles tendinosis', 'mid-portion achilles tendinopathy'],
    'ankle', 'musculoskeletal', 'tendon', 'chronic', 'overuse',
    array[
      'A 45-year-old recreational runner has heel-cord pain that has built up over two months.',
      'It is worst with the first steps in the morning and at the start of a run, then eases.',
      'There is a tender, slightly thickened area a few centimetres above where the tendon meets the heel.',
      'The pain and the thickening move with the ankle when it is dorsiflexed and plantarflexed (a positive arc sign).',
      'Single-leg heel raises are painful and reduced in number compared with the other side.',
      'It is a mid-portion tendinopathy of the Achilles, driven by load.'
    ],
    'Mid-portion Achilles tendinopathy sits 2–6 cm above the calcaneus and responds to progressive loading (including heavy-slow or eccentric work). Insertional tendinopathy, right at the bone, behaves differently and dislikes full dorsiflexion stretch.'
  ),
  (
    'Plantar fasciitis',
    array['plantar heel pain', 'plantar fasciopathy', 'plantar fasciosis'],
    'foot', 'musculoskeletal', 'fascia', 'chronic', 'overuse',
    array[
      'A 50-year-old on their feet all day at work has heel pain that has grown over a couple of months.',
      'The first few steps out of bed in the morning are the worst; it eases after walking, then returns late in the day.',
      'The pain is under the heel, slightly toward the inner side.',
      'There is point tenderness at the medial calcaneal tubercle, where the plantar fascia originates.',
      'Passively extending the big toe (a windlass test) tightens the fascia and reproduces the pain.',
      'It is a degenerative overload of the plantar fascia at its calcaneal origin.'
    ],
    'Plantar fasciitis is defined by first-step morning pain and tenderness at the medial calcaneal tubercle. Management is load management, calf and fascia loading, and footwear/orthoses; imaging is rarely needed.'
  ),
  (
    'Lateral ankle sprain',
    array['ankle sprain', 'inversion ankle sprain', 'atfl sprain', 'rolled ankle'],
    'ankle', 'musculoskeletal', 'ligament', 'acute', 'traumatic',
    array[
      'A 21-year-old basketball player rolled the ankle inward landing from a jump two days ago.',
      'There is swelling and bruising over the outer ankle; they could bear weight, though it was sore.',
      'The pain and swelling are centred just in front of and below the lateral malleolus.',
      'There is tenderness over the anterior talofibular ligament, and the malleoli and midfoot are non-tender.',
      'An anterior drawer test shows increased laxity compared with the other ankle.',
      'It is a sprain of the lateral ligament complex, most often the anterior talofibular ligament, from an inversion mechanism.'
    ],
    'A lateral ankle sprain with the Ottawa ankle rules negative needs no X-ray. Early weight-bearing, a brace, and a proprioceptive rehab programme reduce the high recurrence rate.'
  ),
  (
    'Morton neuroma',
    array['mortons neuroma', 'interdigital neuroma', 'intermetatarsal neuroma'],
    'foot', 'neurological', 'nerve', 'chronic', 'compressive',
    array[
      'A 47-year-old describes walking on a pebble or a sock bunched under the ball of the foot.',
      'There is burning pain and tingling that shoots into two adjacent toes, usually the third and fourth.',
      'Tight or narrow shoes and high heels make it much worse; taking the shoe off and rubbing the foot helps.',
      'Squeezing the forefoot from side to side reproduces the pain, sometimes with a palpable click (Mulder sign).',
      'There is reduced sensation in the web space between the affected toes.',
      'It is a perineural fibrosis of a common plantar digital nerve, typically in the third intermetatarsal space.'
    ],
    'Morton neuroma gives forefoot burning radiating into two toes, worse in tight shoes, with a positive Mulder click. First-line care is a wide toe box, a metatarsal dome, and load modification.'
  ),
  (
    'Deep vein thrombosis',
    array['dvt', 'deep venous thrombosis', 'blood clot in the leg'],
    'calf', 'vascular', 'vein', 'acute', 'vascular',
    array[
      'A 58-year-old presents with a swollen, aching calf four days after a long-haul flight.',
      'There was no injury; the calf is warm and tender at the back.',
      'She is on the combined oral contraceptive pill and her mother had a leg clot.',
      'The calf is more than 3 cm larger than the other side, with pitting oedema along the deep veins.',
      'A Wells score puts her in the "DVT likely" category; she has also become mildly breathless on stairs.',
      'It is a thrombus in the deep veins of the calf — and the new breathlessness raises pulmonary embolism.'
    ],
    'An atraumatic warm, swollen, unilateral calf with thrombotic risk factors is a DVT pathway — a Wells score, D-dimer, and Doppler ultrasound. Any breathlessness makes it a same-day referral. Manual calf treatment is contraindicated until DVT is excluded.'
  ),
  (
    'Peripheral arterial disease',
    array['pad', 'intermittent claudication', 'peripheral vascular disease', 'claudication'],
    'leg', 'vascular', 'artery', 'chronic', 'vascular',
    array[
      'A 66-year-old smoker with diabetes gets a cramping calf pain after walking a set distance.',
      'It comes on sooner walking uphill, and standing still for a minute or two relieves it — no need to sit or bend forward.',
      'The distance to onset is reproducible; downhill and flat walking get further.',
      'The affected foot is cooler than the other, with reduced hair growth and absent foot pulses.',
      'The ankle-brachial pressure index is 0.5 on that side; a small toe ulcer is slow to heal.',
      'It is atherosclerotic narrowing of the leg arteries — and the rest pain and non-healing ulcer make it critical limb ischaemia.'
    ],
    'Vascular claudication is distance-reproducible and relieved by standing still (neurogenic claudication needs spinal flexion). Rest pain, tissue loss, or an ABPI below 0.5 mean urgent vascular referral, not an exercise programme.'
  )
),
base as (select coalesce(max(case_number), 0) as n from public.daily_game_cases)
insert into public.daily_game_cases
  (case_number, diagnosis, synonyms, region, system, tissue, chronicity, mechanism, clues, explanation, status)
select
  base.n + row_number() over (order by nc.diagnosis),
  nc.diagnosis, nc.synonyms, nc.region, nc.system, nc.tissue, nc.chronicity, nc.mechanism, nc.clues, nc.explanation,
  'approved'
from new_cases nc, base;
