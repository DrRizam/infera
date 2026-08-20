-- Infera schema — B2C, individual accounts, no organizations.
-- Paste this whole file into the Supabase SQL editor (Project -> SQL Editor -> New query) and run it once.
-- This is a first-run schema for a FRESH project, not a migration chain. If you already have the
-- earlier clinic/org schema applied to a live project, use supabase-cleanup-live-project.sql instead.

-- ── profiles (the app's whole gamification/progress blob) ───────────────
-- `state` holds the exact same shape as DEFAULT_PROFILE in src/lib/store.js
-- so gamification.js/caseEngine.js never need to know persistence changed.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  clinic_name text,
  country text,
  role text check (role is null or role in ('student', 'pt', 'dpt', 'other')),
  role_other_label text,
  phone text,
  email_opt_in boolean not null default false,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── case_attempts (append-only per-case-completion log) ─────────────────
create table public.case_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  case_module text not null,
  case_subject text,
  is_daily boolean not null default false,
  accuracy integer not null,
  breakdown jsonb not null,
  errors jsonb not null default '[]'::jsonb,
  missed_red_flags jsonb not null default '[]'::jsonb,
  false_positive_red_flags jsonb not null default '[]'::jsonb,
  xp_earned integer not null default 0,
  attempt_number integer not null default 1,
  played_at timestamptz not null default now()
);
create index case_attempts_user_idx on public.case_attempts (user_id, played_at desc);
create index case_attempts_module_idx on public.case_attempts (user_id, case_module);

-- ── notifications (persisted, per-user, read/unread) ─────────────────────
-- Every row is owned by one user, even a future "broadcast" announcement
-- would just insert one row per recipient — simpler than a shared-row +
-- per-user-read-state join for the scale this app is at.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ── feedback (append-only, user -> founder) ──────────────────────────────
-- No in-app reader needed yet — read via the Supabase table editor.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);
create index feedback_user_idx on public.feedback (user_id, created_at desc);

-- ── daily_game_cases (the "Guess the Diagnosis" case bank) ──────────────
-- One row per daily case. `case_number` (not a date) is what's shown to
-- players and what the client resolves "today's case" against — the client
-- computes which case_number is "today" from its OWN local date, so this
-- table never needs to know about timezones at all. Only `status =
-- 'approved'` rows are ever selectable by players; `pending`/`rejected`
-- exist for the future case-submission pipeline (Phase 3) but aren't
-- writable by users yet in this first pass — seeded/approved directly via
-- the SQL editor for now, same as everything else managed that way so far.
create table public.daily_game_cases (
  id uuid primary key default gen_random_uuid(),
  case_number int not null unique,
  diagnosis text not null,
  synonyms text[] not null default '{}',
  region text not null,
  system text not null,
  tissue text not null,
  chronicity text not null,
  mechanism text not null,
  clues text[] not null,
  explanation text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint daily_game_cases_six_clues check (array_length(clues, 1) = 6)
);
create index daily_game_cases_number_idx on public.daily_game_cases (case_number);

-- ── daily_game_attempts (one row per user per case, ever) ────────────────
-- The unique constraint is what actually enforces "one attempt per day" —
-- not just UI state, so a second attempt is structurally impossible even if
-- the client tried to insert one twice.
create table public.daily_game_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.daily_game_cases(id) on delete cascade,
  guesses jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'won', 'lost')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, case_id)
);
create index daily_game_attempts_user_idx on public.daily_game_attempts (user_id);

-- ── follows (one-way, Twitter-style — no approval needed) ───────────────
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self_follow check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

-- ── RLS ───────────────────────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.case_attempts      enable row level security;
alter table public.notifications      enable row level security;
alter table public.feedback           enable row level security;
alter table public.daily_game_cases   enable row level security;
alter table public.daily_game_attempts enable row level security;
alter table public.follows            enable row level security;

create policy profiles_select on public.profiles
  for select using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles
  for insert with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- No update/delete policy on case_attempts at all -- append-only.
create policy case_attempts_select on public.case_attempts
  for select using (user_id = auth.uid());
create policy case_attempts_insert_own on public.case_attempts
  for insert with check (user_id = auth.uid());

-- Notifications: a user can only see/insert/mark-read their own. No delete
-- policy — clearing is done by marking read, not removing the row.
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());
create policy notifications_insert_own on public.notifications
  for insert with check (user_id = auth.uid());
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- No update/delete policy on feedback either -- append-only.
create policy feedback_select on public.feedback
  for select using (user_id = auth.uid());
create policy feedback_insert_own on public.feedback
  for insert with check (user_id = auth.uid());

-- Anyone signed in can read an approved case (needed both to play today's
-- case and to build the guess-matching dictionary from the rest of the
-- bank) — no insert/update policy yet, since case authoring is founder-only
-- via the SQL editor until the Phase 3 submission form exists.
create policy daily_game_cases_select_approved on public.daily_game_cases
  for select using (status = 'approved');

-- A user can only see/create/update their own attempt rows. The
-- (user_id, case_id) unique constraint is what actually prevents replaying
-- a case, not this policy — this just keeps attempts private per player.
create policy daily_game_attempts_select_own on public.daily_game_attempts
  for select using (user_id = auth.uid());
create policy daily_game_attempts_insert_own on public.daily_game_attempts
  for insert with check (user_id = auth.uid());
create policy daily_game_attempts_update_own on public.daily_game_attempts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A user can see their own follows on either side (who they follow, who
-- follows them), and can only create/remove rows where they're the follower.
create policy follows_select on public.follows
  for select using (follower_id = auth.uid() or followee_id = auth.uid());
create policy follows_insert_own on public.follows
  for insert with check (follower_id = auth.uid());
create policy follows_delete_own on public.follows
  for delete using (follower_id = auth.uid());

-- ── Self-service account deletion ────────────────────────────────────
-- security definer so this runs with the function owner's (postgres)
-- privileges, letting an authenticated client delete their own auth.users
-- row without ever holding a service-role key. profiles/case_attempts both
-- cascade-delete via their FK to auth.users(id), so one call cleans up everything.
create or replace function public.delete_own_account()
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;

-- ── Leaderboard / social — narrow security-definer functions ────────────
-- These never expose the `state` jsonb blob (mastery, caseProgress,
-- achievements) to other users, only the whitelisted columns below. RLS on
-- `profiles` stays fully self-scoped; these are the one deliberate, narrow
-- exception to that, mirroring delete_own_account()'s pattern.
--
-- Lifetime, not windowed — a weekly reset looked empty/broken for a
-- low-traffic early-stage app ("no one's practiced this week yet"), so this
-- is back to a straightforward permanent ranking off `state->>xp`.
--
-- Every `limit limit_n` below is clamped with least(limit_n, 100) — the
-- client passes this value, and nothing stopped it from requesting an
-- unbounded result set otherwise. Low-risk (only display_name+XP), but free
-- to close off.
create or replace function public.leaderboard_global(limit_n int default 50)
returns table(user_id uuid, display_name text, xp int)
language sql security definer set search_path = public stable as $$
  select user_id, coalesce(display_name, 'Anonymous'), coalesce((state->>'xp')::int, 0)
  from public.profiles
  order by coalesce((state->>'xp')::int, 0) desc
  limit least(limit_n, 100);
$$;
grant execute on function public.leaderboard_global(int) to authenticated;

create or replace function public.leaderboard_friends(limit_n int default 50)
returns table(user_id uuid, display_name text, xp int)
language sql security definer set search_path = public stable as $$
  select user_id, coalesce(display_name, 'Anonymous'), coalesce((state->>'xp')::int, 0)
  from public.profiles
  where user_id = auth.uid()
     or user_id in (select followee_id from public.follows where follower_id = auth.uid())
  order by coalesce((state->>'xp')::int, 0) desc
  limit least(limit_n, 100);
$$;
grant execute on function public.leaderboard_friends(int) to authenticated;

-- Cohort-scoped by specialty (case_module) — this one still needs
-- `case_attempts` since per-module XP isn't tracked in `state`, but it's
-- lifetime now too, not windowed to a week.
create or replace function public.leaderboard_specialty(module text, limit_n int default 50)
returns table(user_id uuid, display_name text, xp int)
language sql security definer set search_path = public stable as $$
  select p.user_id, coalesce(p.display_name, 'Anonymous'), sum(ca.xp_earned)::int as xp
  from public.profiles p
  join public.case_attempts ca on ca.user_id = p.user_id
  where ca.case_module = module
  group by p.user_id, p.display_name
  order by xp desc
  limit least(limit_n, 100);
$$;
grant execute on function public.leaderboard_specialty(text, int) to authenticated;

create or replace function public.search_users(query text, limit_n int default 20)
returns table(user_id uuid, display_name text, following boolean)
language sql security definer set search_path = public stable as $$
  select p.user_id, p.display_name,
         exists(select 1 from public.follows f where f.follower_id = auth.uid() and f.followee_id = p.user_id)
  from public.profiles p
  where p.user_id <> auth.uid()
    and p.display_name is not null
    and p.display_name ilike '%' || query || '%'
  limit least(limit_n, 100);
$$;
grant execute on function public.search_users(text, int) to authenticated;

create or replace function public.list_following()
returns table(user_id uuid, display_name text, xp int)
language sql security definer set search_path = public stable as $$
  select p.user_id, coalesce(p.display_name, 'Anonymous'), coalesce((p.state->>'xp')::int, 0)
  from public.follows f join public.profiles p on p.user_id = f.followee_id
  where f.follower_id = auth.uid()
  order by p.display_name;
$$;
grant execute on function public.list_following() to authenticated;

create or replace function public.list_followers()
returns table(user_id uuid, display_name text, xp int)
language sql security definer set search_path = public stable as $$
  select p.user_id, coalesce(p.display_name, 'Anonymous'), coalesce((p.state->>'xp')::int, 0)
  from public.follows f join public.profiles p on p.user_id = f.follower_id
  where f.followee_id = auth.uid()
  order by p.display_name;
$$;
grant execute on function public.list_followers() to authenticated;

-- ── Daily diagnosis game — 5 launch cases, case_number 1-5 ───────────────
-- Original write-ups (not copied from any external source), pre-approved
-- so they're playable immediately. content is intentionally varied across
-- tissue type (tendon/ligament/nerve/capsule/joint-cartilage) so the
-- attribute-badge feedback is meaningfully differentiating from day one.
insert into public.daily_game_cases
  (case_number, diagnosis, synonyms, region, system, tissue, chronicity, mechanism, clues, explanation, status)
values
(
  1,
  'Lateral epicondylalgia',
  array['lateral epicondylalgia', 'tennis elbow', 'lateral epicondylitis', 'lateral epicondyle tendinopathy', 'let'],
  'elbow', 'musculoskeletal', 'tendon', 'chronic', 'overuse',
  array[
    '38-year-old office worker, 6 weeks of aching pain over the outer elbow that started gradually after switching to a new ergonomic mouse.',
    'Pain worsens with gripping (opening jars, shaking hands) and repetitive typing; eases somewhat with rest overnight.',
    'Resisted wrist extension reproduces the pain sharply; Cozen''s test is positive.',
    'Elbow flexion/extension and forearm rotation are full and pain-free; grip strength is reduced about 20% versus the unaffected side; no numbness or tingling.',
    'Imaging not performed — the clinical picture is classic enough that it wasn''t indicated.',
    'Only about 5% of people with this condition actually relate it to playing tennis — most cases come from repetitive occupational gripping and typing, not sport.'
  ],
  'Lateral epicondylalgia is an overuse tendinopathy of the common extensor origin (chiefly extensor carpi radialis brevis) at the lateral epicondyle. It is provoked by resisted wrist/finger extension and gripping, and — despite the name — the large majority of cases have nothing to do with tennis.',
  'approved'
),
(
  2,
  'Anterior cruciate ligament tear',
  array['anterior cruciate ligament tear', 'acl tear', 'acl rupture', 'anterior cruciate ligament injury', 'torn acl'],
  'knee', 'musculoskeletal', 'ligament', 'acute', 'traumatic',
  array[
    '19-year-old collegiate soccer player, sudden right knee injury during a match yesterday while cutting to change direction — no contact from another player.',
    'Felt a pop at the moment of injury; the knee swelled up within the first hour; now feels unstable when trying to pivot.',
    'Lachman test is positive with a soft, mushy endpoint; anterior drawer is also positive but less pronounced.',
    'Knee range of motion is limited by swelling and guarding, with a block to full extension; quadriceps activation is inhibited.',
    'MRI confirms a complete tear, with a small associated lateral meniscal tear.',
    'Rapid swelling within 1-2 hours of a pivoting injury (hemarthrosis) is strongly associated with this diagnosis — a slower, next-day swelling pattern would point more toward an isolated meniscal injury instead.'
  ],
  'A non-contact pivoting mechanism, an audible/felt pop, and rapid hemarthrosis form a classic triad. The Lachman test''s soft endpoint (not just laxity) is the most sensitive clinical sign, and MRI is used to confirm the tear and stage any concurrent meniscal or chondral injury.',
  'approved'
),
(
  3,
  'Carpal tunnel syndrome',
  array['carpal tunnel syndrome', 'carpal tunnel', 'cts', 'median nerve entrapment', 'median nerve compression'],
  'wrist_hand', 'neuro', 'nerve', 'chronic', 'nerve_compression',
  array[
    '52-year-old hairdresser, several months of numbness and tingling in the thumb, index, and middle fingers, worse at night.',
    'Symptoms are eased by shaking the hand out; aggravated by prolonged gripping of scissors and hair dryers.',
    'Tinel''s sign is positive at the wrist; Phalen''s test reproduces symptoms within 30 seconds.',
    'Grip and pinch strength are mildly reduced on the affected side; early thenar eminence atrophy is present; sensation is diminished over the thumb, index, and middle fingers but the palm itself is spared.',
    'Nerve conduction studies show prolonged median nerve latency across the wrist.',
    'Sparing of sensation over the palm itself (not just the fingers) is a key discriminator — the palmar cutaneous branch splits off before the carpal tunnel, so palm numbness should point you toward a more proximal nerve problem instead.'
  ],
  'Carpal tunnel syndrome is a compressive neuropathy of the median nerve at the wrist. Night-dominant symptoms eased by shaking the hand out, a positive Tinel''s/Phalen''s, and palm-sparing sensory loss are the classic clinical picture; nerve conduction studies confirm and grade severity.',
  'approved'
),
(
  4,
  'Adhesive capsulitis',
  array['adhesive capsulitis', 'frozen shoulder', 'shoulder capsulitis'],
  'shoulder', 'musculoskeletal', 'capsule', 'chronic', 'atraumatic',
  array[
    '56-year-old with type 2 diabetes, 4 months of progressively worsening shoulder stiffness and aching pain, with no specific injury.',
    'Pain is worse at night, especially lying on the affected side; stiffness has become the dominant complaint over pain.',
    'Passive external rotation is markedly limited and reproduces pain — the hallmark finding.',
    'Both active and passive range of motion are restricted in a capsular pattern (external rotation most limited, then abduction, then internal rotation); strength is difficult to assess given the pain-limited range.',
    'X-ray is unremarkable, ruling out glenohumeral osteoarthritis as the cause of the stiffness.',
    'Loss of passive (not just active) range of motion is what separates this from a simple rotator cuff problem — if only active motion is limited but passive motion is full, look elsewhere.'
  ],
  'Adhesive capsulitis is a progressive, painful stiffening of the glenohumeral joint capsule of uncertain cause, strongly associated with diabetes. The defining clinical feature is a proportional loss of both active AND passive range of motion in a capsular pattern, especially external rotation.',
  'approved'
),
(
  5,
  'Lumbar disc herniation with radiculopathy',
  array['lumbar disc herniation', 'herniated disc', 'slipped disc', 'disc herniation', 'lumbar radiculopathy', 'herniated lumbar disc', 'l4-l5 disc herniation'],
  'lumbar_spine', 'neuro', 'joint_cartilage', 'subacute', 'degenerative',
  array[
    '34-year-old warehouse worker, 2 weeks of low back pain that now radiates down the back of the left leg to below the knee.',
    'Pain is worse with sitting and forward bending, eases somewhat with walking and lying down; coughing and sneezing sharply increase the leg pain.',
    'Straight leg raise on the left reproduces the radiating leg pain at 35 degrees; slump test is also positive.',
    'Mild weakness of the left extensor hallucis longus (great toe extension); ankle reflexes are symmetric; no saddle anesthesia or bladder/bowel changes.',
    'MRI shows a left paracentral disc herniation at L4-L5 contacting the exiting nerve root.',
    'A positive slump test alongside a positive straight leg raise strengthens the case for true nerve root tension rather than just hamstring tightness or nonspecific back pain — and the absence of saddle anesthesia or bowel/bladder change is what keeps this from being a cauda equina emergency.'
  ],
  'A posterolateral or paracentral disc herniation compressing an exiting nerve root produces radicular leg pain, often worse with flexion/sitting and relieved by extension/walking. Straight leg raise and slump testing assess neural tension, and red-flag screening for cauda equina (saddle anesthesia, bowel/bladder change) is essential before treating it as routine.',
  'approved'
);
