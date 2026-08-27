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
  -- Subscription columns are real Postgres columns, deliberately NOT part
  -- of `state` — state is client-writable (see the profiles_update_own
  -- policy + the column grant below), and letting a user set their own
  -- subscription status would be a free-upgrade exploit. Only the Paddle
  -- and RevenueCat webhook Edge Functions (service-role key, bypasses RLS)
  -- ever write these.
  subscription_status text not null default 'free'
    check (subscription_status in ('free', 'active', 'past_due', 'canceled')),
  paddle_customer_id text,
  paddle_subscription_id text,
  subscription_current_period_end timestamptz,
  -- Which processor currently grants premium — null for free users. Needed
  -- because "Manage subscription" has to send a Play Billing subscriber to
  -- the Play Store's own subscription page, not Paddle's portal (a
  -- play_store subscriber has no Paddle customer/subscription record).
  subscription_source text
    check (subscription_source is null or subscription_source in ('paddle', 'play_store')),
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

-- ── osce_attempts (append-only per-checkpoint-session log) ───────────────
-- One row per finished OSCE checkpoint (standalone or a tree boss round),
-- added 2026-08-21 for the attempt-history/trend view on Profile — OSCE
-- results themselves stay ephemeral in OsceCheckpoint.jsx's own state
-- (shown once at the end of a session), this table is purely a read-only
-- history log alongside it. Exactly one of module_id/region_id is set,
-- matching the axis the session was run under (see bossRoundKey in
-- modules.js); both null means a "Mixed" standalone checkpoint.
create table public.osce_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text,
  region_id text,
  is_boss boolean not null default false,
  boss_level int,
  case_count int not null,
  overall_accuracy int not null,
  passed boolean not null,
  xp_earned integer not null default 0,
  played_at timestamptz not null default now()
);
create index osce_attempts_user_idx on public.osce_attempts (user_id, played_at desc);

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
  -- Null for a pending user submission — assigned only once it's approved
  -- and scheduled into the rotation (still unique whenever it is set).
  case_number int unique,
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
  constraint daily_game_cases_six_clues check (array_length(clues, 1) = 6),
  constraint daily_game_cases_approved_has_number check (status <> 'approved' or case_number is not null)
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
  score int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, case_id)
);
create index daily_game_attempts_user_idx on public.daily_game_attempts (user_id);

-- ── daily_game_stats (one row per user — streak state for the daily game) ─
-- Deliberately separate from profile.streak_count: that tracks the main
-- app's flexible practice cadence, this tracks the strict once-a-day daily
-- game. `last_completed_case_number` (not a date) is what streak
-- continuation is checked against, consistent with the rest of the game
-- treating case_number as the day index rather than a calendar date.
create table public.daily_game_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  total_played int not null default 0,
  total_won int not null default 0,
  last_completed_case_number int,
  updated_at timestamptz not null default now()
);

-- ── game_groups / game_group_members (clinic/team groups for the daily game) ─
-- Join-code + security-definer create/join RPC pattern, same shape as the
-- clinic-org join flow from the earlier (since-reverted) B2B pivot — that
-- mechanic was solid, just attached to a product direction that got rolled
-- back. A plain client insert can't join a group by code (would need to
-- SELECT the group by code first, which RLS doesn't allow pre-membership),
-- hence the RPCs below.
create table public.game_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.game_group_members (
  group_id uuid not null references public.game_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

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
alter table public.osce_attempts       enable row level security;
alter table public.notifications      enable row level security;
alter table public.feedback           enable row level security;
alter table public.daily_game_cases    enable row level security;
alter table public.daily_game_attempts enable row level security;
alter table public.daily_game_stats    enable row level security;
alter table public.game_groups         enable row level security;
alter table public.game_group_members  enable row level security;
alter table public.follows             enable row level security;

create policy profiles_select on public.profiles
  for select using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles
  for insert with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- RLS is row-scoped, not column-scoped -- profiles_update_own above would
-- otherwise let a signed-in user set their own subscription_status via a
-- raw .update() call from devtools. Column-level grants close that: an
-- authenticated client can only ever touch the columns listed here. The
-- subscription_* columns are deliberately absent -- only the service-role
-- key (used by the Paddle webhook Edge Function) can write them.
revoke update on public.profiles from authenticated;
grant update (display_name, clinic_name, country, role, role_other_label, phone, email_opt_in, state, updated_at)
  on public.profiles to authenticated;

-- No update/delete policy on case_attempts at all -- append-only.
create policy case_attempts_select on public.case_attempts
  for select using (user_id = auth.uid());
create policy case_attempts_insert_own on public.case_attempts
  for insert with check (user_id = auth.uid());

-- No update/delete policy on osce_attempts either -- append-only.
create policy osce_attempts_select on public.osce_attempts
  for select using (user_id = auth.uid());
create policy osce_attempts_insert_own on public.osce_attempts
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
-- case and to build the guess-matching dictionary from the rest of the bank).
create policy daily_game_cases_select_approved on public.daily_game_cases
  for select using (status = 'approved');

-- A submitter can also see their own case regardless of status, so the
-- submission form can show "pending review" / "rejected" back to them.
create policy daily_game_cases_select_own on public.daily_game_cases
  for select using (submitted_by = auth.uid());

-- Users can submit new cases, but never a self-approved or self-scheduled
-- one: status must be 'pending' and case_number must be null. Review and
-- scheduling stay founder-only via the SQL editor, same as approval.
create policy daily_game_cases_insert_own on public.daily_game_cases
  for insert with check (submitted_by = auth.uid() and status = 'pending' and case_number is null);

-- A user can only see/create/update their own attempt rows. The
-- (user_id, case_id) unique constraint is what actually prevents replaying
-- a case, not this policy — this just keeps attempts private per player.
create policy daily_game_attempts_select_own on public.daily_game_attempts
  for select using (user_id = auth.uid());
create policy daily_game_attempts_insert_own on public.daily_game_attempts
  for insert with check (user_id = auth.uid());
create policy daily_game_attempts_update_own on public.daily_game_attempts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A user can read/write only their own streak row directly. The group
-- standings RPC below reads across users' rows via security definer, which
-- is the one deliberate exception, same pattern as the leaderboard functions.
create policy daily_game_stats_select_own on public.daily_game_stats
  for select using (user_id = auth.uid());
create policy daily_game_stats_upsert_own on public.daily_game_stats
  for insert with check (user_id = auth.uid());
create policy daily_game_stats_update_own on public.daily_game_stats
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A user can only see groups they're a member of — no insert/update policy,
-- creation and joining both go through security-definer RPCs below so a
-- join-by-code lookup doesn't need a pre-membership SELECT.
create policy game_groups_select_member on public.game_groups
  for select using (
    exists (select 1 from public.game_group_members m where m.group_id = game_groups.id and m.user_id = auth.uid())
  );

-- A member can see every member row for groups they're in (not just their
-- own), so a "who's in this group" list is possible without a separate RPC.
-- Routed through a security-definer helper rather than a plain EXISTS
-- subquery on game_group_members itself -- a policy on a table can't query
-- that same table directly, Postgres raises "infinite recursion detected
-- in policy" (42P17) because evaluating the subquery re-triggers the
-- policy. The helper function bypasses RLS internally, breaking the loop.
create or replace function public.is_game_group_member(target_group_id uuid)
returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.game_group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;
grant execute on function public.is_game_group_member(uuid) to authenticated;

create policy game_group_members_select on public.game_group_members
  for select using (
    user_id = auth.uid()
    or public.is_game_group_member(group_id)
  );

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
-- row without ever holding a service-role key. profiles/case_attempts/
-- osce_attempts all cascade-delete via their FK to auth.users(id), so one
-- call cleans up everything.
create or replace function public.delete_own_account()
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;

-- ── Daily game groups — create/join by code, group standings ────────────
-- security definer for the same reason as the org-join flow this pattern
-- is borrowed from: joining by code needs to look up a group the caller
-- isn't a member of yet, which plain RLS can't allow.
create or replace function public.create_daily_game_group(group_name text)
returns public.game_groups
language plpgsql security definer set search_path = public as $$
declare
  new_group public.game_groups;
  code text;
begin
  code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  insert into public.game_groups (name, join_code, created_by)
  values (group_name, code, auth.uid())
  returning * into new_group;
  insert into public.game_group_members (group_id, user_id) values (new_group.id, auth.uid());
  return new_group;
end;
$$;
grant execute on function public.create_daily_game_group(text) to authenticated;

create or replace function public.join_daily_game_group(code text)
returns public.game_groups
language plpgsql security definer set search_path = public as $$
declare
  target public.game_groups;
begin
  select * into target from public.game_groups where join_code = upper(code);
  if target.id is null then
    raise exception 'No group found for that code';
  end if;
  insert into public.game_group_members (group_id, user_id)
  values (target.id, auth.uid())
  on conflict (group_id, user_id) do nothing;
  return target;
end;
$$;
grant execute on function public.join_daily_game_group(text) to authenticated;

-- Lifetime standings (not weekly/monthly-windowed) — a windowed board looks
-- empty/broken for small, low-traffic groups; revisit once there's enough
-- real usage to sustain a window, same lesson learned on the main
-- leaderboard earlier. Guards membership explicitly since security definer
-- bypasses RLS — a non-member passing a guessed group_id gets nothing back.
create or replace function public.daily_game_group_standings(target_group_id uuid)
returns table(user_id uuid, display_name text, total_score int, total_won int, current_streak int)
language plpgsql security definer set search_path = public stable as $$
begin
  if not exists (
    select 1 from public.game_group_members where group_id = target_group_id and user_id = auth.uid()
  ) then
    return;
  end if;

  return query
    select
      m.user_id,
      coalesce(p.display_name, 'Anonymous'),
      coalesce(sum(a.score), 0)::int as total_score,
      coalesce(count(*) filter (where a.status = 'won'), 0)::int as total_won,
      coalesce(s.current_streak, 0) as current_streak
    from public.game_group_members m
    join public.profiles p on p.user_id = m.user_id
    left join public.daily_game_attempts a on a.user_id = m.user_id
    left join public.daily_game_stats s on s.user_id = m.user_id
    where m.group_id = target_group_id
    group by m.user_id, p.display_name, s.current_streak
    order by total_score desc;
end;
$$;
grant execute on function public.daily_game_group_standings(uuid) to authenticated;

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

-- A single user's public-facing profile — same whitelist discipline as the
-- leaderboard functions above (never the raw `state` blob, only specific
-- keys pulled out of it), plus follower/following counts and whether the
-- caller already follows them, so a "visit profile" page needs exactly one
-- RPC call. The metric columns are exactly the set isAchievementEarned()/
-- achievementProgress() in gamification.js read (see ACHIEVEMENTS in
-- data/achievements.js) — achievements aren't stored anywhere, they're
-- computed live from these same stats, so the client can reuse
-- AchievementBadge unchanged for someone else's profile too.
create or replace function public.get_public_profile(target_user_id uuid)
returns table(
  user_id uuid,
  display_name text,
  xp int,
  streak_count int,
  longest_streak int,
  total_cases_completed int,
  perfect_cases int,
  speed_rounds_played int,
  follower_count int,
  following_count int,
  following boolean
)
language sql security definer set search_path = public stable as $$
  select
    p.user_id,
    coalesce(p.display_name, 'Anonymous'),
    coalesce((p.state->>'xp')::int, 0),
    coalesce((p.state->>'streak_count')::int, 0),
    coalesce((p.state->>'longest_streak')::int, 0),
    coalesce((p.state->>'total_cases_completed')::int, 0),
    coalesce((p.state->>'perfect_cases')::int, 0),
    coalesce((p.state->>'speed_rounds_played')::int, 0),
    (select count(*)::int from public.follows f where f.followee_id = p.user_id),
    (select count(*)::int from public.follows f where f.follower_id = p.user_id),
    exists(select 1 from public.follows f where f.follower_id = auth.uid() and f.followee_id = p.user_id)
  from public.profiles p
  where p.user_id = target_user_id;
$$;
grant execute on function public.get_public_profile(uuid) to authenticated;

-- Admin-only read across every user's feedback row — feedback_select above
-- stays self-scoped (append-only, users only ever see their own), this is
-- the one deliberate exception, gated on auth.email() rather than any
-- client-supplied value. Keep this allowlist in sync with ADMIN_EMAILS in
-- src/lib/subscription.js if it ever grows past one address.
create or replace function public.admin_list_feedback()
returns table(id uuid, user_id uuid, display_name text, message text, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select f.id, f.user_id, coalesce(p.display_name, 'Anonymous'), f.message, f.created_at
  from public.feedback f
  join public.profiles p on p.user_id = f.user_id
  where auth.email() = 'rizamshaar2014@gmail.com'
  order by f.created_at desc;
$$;
grant execute on function public.admin_list_feedback() to authenticated;

-- ── Admin moderation queue for user-submitted daily game cases ───────────
-- Added 2026-08-21 so review/approval doesn't require the Supabase table
-- editor — same single-admin allowlist pattern as admin_list_feedback
-- above (keep both in sync with ADMIN_EMAILS if it ever grows past one
-- address). RLS alone can't let an admin see another user's pending row
-- (daily_game_cases_select_own only covers the submitter themselves), so
-- this has to be a security-definer RPC like admin_list_feedback.
create or replace function public.admin_list_pending_daily_game_cases()
returns table(
  id uuid, diagnosis text, synonyms text[], region text, system text, tissue text,
  chronicity text, mechanism text, clues text[], explanation text,
  submitted_by_name text, created_at timestamptz
)
language sql security definer set search_path = public stable as $$
  select c.id, c.diagnosis, c.synonyms, c.region, c.system, c.tissue, c.chronicity,
         c.mechanism, c.clues, c.explanation, coalesce(p.display_name, 'Anonymous'), c.created_at
  from public.daily_game_cases c
  left join public.profiles p on p.user_id = c.submitted_by
  where auth.email() = 'rizamshaar2014@gmail.com' and c.status = 'pending'
  order by c.created_at asc;
$$;
grant execute on function public.admin_list_pending_daily_game_cases() to authenticated;

-- Approve assigns the next sequential case_number (matching how cases 1-10
-- were scheduled by hand); reject just flags the row. Re-running on an
-- already-decided row is a no-op (the `and status = 'pending'` guard).
create or replace function public.admin_review_daily_game_case(case_id uuid, decision text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  next_number int;
begin
  if auth.email() <> 'rizamshaar2014@gmail.com' then
    raise exception 'not authorized';
  end if;
  if decision = 'approved' then
    select coalesce(max(case_number), 0) + 1 into next_number from public.daily_game_cases;
    update public.daily_game_cases set status = 'approved', case_number = next_number
      where id = case_id and status = 'pending';
  elsif decision = 'rejected' then
    update public.daily_game_cases set status = 'rejected' where id = case_id and status = 'pending';
  else
    raise exception 'invalid decision: %', decision;
  end if;
end;
$$;
grant execute on function public.admin_review_daily_game_case(uuid, text) to authenticated;

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
    '38-year-old, 6 weeks of gradually worsening pain near the elbow, with no specific injury they can recall.',
    'The pain worsens with gripping tasks — opening jars, shaking hands, turning a key — and eases somewhat overnight.',
    'The pain is localized to the outer side of the elbow, and it started not long after a change in a repetitive daily activity involving the hand and wrist.',
    'Resisted wrist extension reproduces the pain sharply; Cozen''s test is positive.',
    'Elbow flexion/extension and forearm rotation are full and pain-free; grip strength is reduced about 20% versus the unaffected side; no numbness or tingling.',
    'Imaging wasn''t needed — the clinical picture was classic enough. Only about 5% of people with this condition actually relate it to playing tennis; most cases come from repetitive occupational gripping and typing, not sport.'
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
    '19-year-old athlete, sudden knee injury during a change-of-direction movement in a team sport — no contact from another player.',
    'Felt a pop at the moment of injury; the knee swelled up quickly, within the first hour; now feels unstable when trying to pivot.',
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
    '52-year-old, several months of numbness and tingling in the hand, worse at night.',
    'Symptoms are eased by shaking the hand out and worsen with prolonged gripping tasks.',
    'She works as a hairdresser, using scissors and a hair dryer for hours each day; the numbness and tingling are concentrated in the thumb, index, and middle fingers.',
    'Tinel''s sign is positive at the wrist; Phalen''s test reproduces symptoms within 30 seconds.',
    'Grip and pinch strength are mildly reduced on the affected side; early thenar eminence atrophy is present; sensation is diminished over the thumb, index, and middle fingers but the palm itself is spared.',
    'Nerve conduction studies show prolonged median nerve latency across the wrist. Sparing of sensation over the palm itself (not just the fingers) is a key discriminator — the palmar cutaneous branch splits off before the carpal tunnel, so palm numbness should point you toward a more proximal nerve problem instead.'
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
    '56-year-old, 4 months of progressively worsening shoulder stiffness and aching pain, with no specific injury.',
    'Pain is worse at night, especially lying on the affected side; stiffness has become the dominant complaint over pain.',
    'The patient has type 2 diabetes; passive external rotation of the shoulder is markedly limited and reproduces pain — the hallmark finding on exam.',
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
    '34-year-old, 2 weeks of low back pain that now radiates down the back of one leg to below the knee.',
    'Pain is worse with sitting and forward bending, eases somewhat with walking and lying down; coughing and sneezing sharply increase the leg pain.',
    'He works in a physically demanding warehouse job; straight leg raise on the affected side reproduces the radiating leg pain at 35 degrees, and the slump test is also positive.',
    'Mild weakness of the left extensor hallucis longus (great toe extension); ankle reflexes are symmetric; no saddle anesthesia or bladder/bowel changes.',
    'MRI shows a left paracentral disc herniation at L4-L5 contacting the exiting nerve root.',
    'A positive slump test alongside a positive straight leg raise strengthens the case for true nerve root tension rather than just hamstring tightness or nonspecific back pain — and the absence of saddle anesthesia or bowel/bladder change is what keeps this from being a cauda equina emergency.'
  ],
  'A posterolateral or paracentral disc herniation compressing an exiting nerve root produces radicular leg pain, often worse with flexion/sitting and relieved by extension/walking. Straight leg raise and slump testing assess neural tension, and red-flag screening for cauda equina (saddle anesthesia, bowel/bladder change) is essential before treating it as routine.',
  'approved'
);

-- ── Daily diagnosis game — cases 6-10, added 2026-08-21 ──────────────────
-- Grows the recognized-diagnosis dictionary past the original 5 launch
-- cases (see the Phase-1 limitation note above findMatchingCase in
-- dailyGame.js: an unrecognized guess still costs an attempt but can't
-- show attribute matches). Chosen to overlap/contrast usefully with cases
-- 1-5 — shared regions, tissues, or mechanisms — so badge feedback stays
-- informative even on a wrong-but-recognized guess.
insert into public.daily_game_cases
  (case_number, diagnosis, synonyms, region, system, tissue, chronicity, mechanism, clues, explanation, status)
values
(
  6,
  'Meniscus tear',
  array['meniscus tear', 'meniscal tear', 'torn meniscus', 'meniscus injury', 'torn cartilage in the knee'],
  'knee', 'musculoskeletal', 'joint_cartilage', 'subacute', 'traumatic',
  array[
    '22-year-old recreational basketball player, twisting knee injury two days ago while landing awkwardly and pivoting on a planted foot.',
    'Knee swelling built up gradually over the following day, not immediately; occasional catching and a sense of the knee locking when straightening it.',
    'McMurray''s test reproduces a painful click along the joint line; joint line tenderness is present on palpation.',
    'Terminal extension is mildly blocked and uncomfortable; there is no gross instability on Lachman or anterior drawer testing.',
    'MRI shows a horizontal tear of the medial meniscus posterior horn, with an intact ACL.',
    'A next-day, rather than within-the-hour, swelling pattern after a twisting injury points more toward an isolated meniscal tear than a ligament tear — the opposite timing pattern from an ACL rupture.'
  ],
  'An isolated meniscus tear typically follows a twisting or pivoting mechanism and produces joint-line tenderness, a positive McMurray''s test, and mechanical symptoms like catching or locking. The slower, next-day swelling pattern and a negative Lachman/anterior drawer help distinguish it from an ACL injury.',
  'approved'
),
(
  7,
  'Achilles tendinopathy',
  array['achilles tendinopathy', 'achilles tendinitis', 'achilles tendonitis', 'achilles tendon pain'],
  'ankle_foot', 'musculoskeletal', 'tendon', 'chronic', 'overuse',
  array[
    '45-year-old, 8 weeks of gradually worsening pain at the back of the heel, with no specific injury.',
    'Pain and stiffness are worst with the first steps out of bed in the morning, ease somewhat after warming up, then return after being on his feet for a while.',
    'He''s a recreational runner who recently increased his weekly mileage; the area 2-6 cm above the heel bone is thickened and tender to palpation, and resisted plantarflexion reproduces the pain.',
    'The Thompson test is negative — squeezing the calf still produces plantarflexion, ruling out a complete rupture; ankle dorsiflexion is mildly restricted with the knee straight.',
    'Ultrasound shows thickening and disorganized fibers within the mid-portion of the tendon, without a full-thickness tear.',
    'A negative Thompson test is the key safety check here — it separates a painful but intact tendinopathy from a complete Achilles rupture, which needs a very different, urgent management pathway.'
  ],
  'Achilles tendinopathy is an overuse degeneration of the mid-portion tendon, classically triggered by a training-load spike. Morning stiffness that eases with movement, localized thickening/tenderness, and pain with resisted plantarflexion are typical; a negative Thompson test confirms the tendon is still in continuity.',
  'approved'
),
(
  8,
  'Rotator cuff tear',
  array['rotator cuff tear', 'rotator cuff tendinopathy', 'supraspinatus tear', 'torn rotator cuff'],
  'shoulder', 'musculoskeletal', 'tendon', 'chronic', 'degenerative',
  array[
    '61-year-old, several months of aching shoulder pain and progressive weakness reaching overhead, with no single injury he can recall.',
    'Pain is worse at night when lying on the shoulder; he has started avoiding overhead reaching because the arm gives way.',
    'He spent his working life as a painter, with decades of repetitive overhead work; the empty can test and external rotation lag sign are both positive, and the drop-arm test shows he cannot lower the arm smoothly from full abduction.',
    'Active abduction is limited and painful, but passive range of motion is nearly full — the opposite pattern from a capsular restriction.',
    'MRI confirms a full-thickness tear of the supraspinatus tendon with mild retraction.',
    'Preserved passive range of motion despite major active weakness is the key discriminator from adhesive capsulitis, where both active AND passive motion are restricted.'
  ],
  'A degenerative rotator cuff tear presents with painful, weak active elevation — often with a positive drop-arm sign — while passive range of motion stays comparatively preserved, unlike the proportional active-and-passive restriction seen in adhesive capsulitis. MRI confirms tear size and retraction, which guides whether surgical repair is being considered.',
  'approved'
),
(
  9,
  'Cervical radiculopathy',
  array['cervical radiculopathy', 'pinched nerve in the neck', 'cervical nerve root compression', 'herniated cervical disc'],
  'neck', 'neuro', 'nerve', 'subacute', 'nerve_compression',
  array[
    '48-year-old, 10 days of neck pain radiating down one arm into the thumb and index finger.',
    'Turning the head toward the painful side and looking up both sharply increase the arm pain; resting the hand on top of the head eases it somewhat.',
    'Symptoms started after a weekend of unusually heavy yard work; Spurling''s test reproduces the radiating arm pain, and the cervical distraction test relieves it.',
    'Mild weakness of wrist extension and reduced biceps reflex on the right; sensation is diminished over the thumb and index finger, consistent with a C6 pattern.',
    'MRI shows a right-sided C5-C6 disc herniation contacting the exiting C6 nerve root.',
    'Relief with the shoulder-abduction (hand-on-head) maneuver and cervical distraction, alongside matching myotomal weakness and dermatomal sensory change, points to true nerve root involvement rather than a musculoskeletal neck strain radiating locally.'
  ],
  'Cervical radiculopathy results from nerve root compression, most often by disc herniation or foraminal narrowing, producing arm pain that follows a specific nerve root pattern. A positive Spurling''s test, relief with distraction or shoulder abduction, and matching myotomal/dermatomal findings support the diagnosis; MRI confirms the level and cause of compression.',
  'approved'
),
(
  10,
  'Patellofemoral pain syndrome',
  array['patellofemoral pain syndrome', 'runner''s knee', 'anterior knee pain', 'patellofemoral syndrome'],
  'knee', 'musculoskeletal', 'joint_cartilage', 'chronic', 'overuse',
  array[
    '17-year-old, several months of a dull ache around the front of the knee, worse with running and stairs.',
    'Pain is aggravated by prolonged sitting with the knees bent and by descending stairs; there was no specific injury.',
    'She''s a cross-country runner; pain is reproduced by resisted knee extension and by compressing the kneecap against the thigh bone during a quad contraction — a positive patellar grind test.',
    'The knee is stable on ligamentous testing with no effusion; there is mild weakness of hip abductor and external rotator strength on the affected side.',
    'X-rays are unremarkable, ruling out significant patellofemoral osteoarthritis or a structural cause for the pain.',
    'Reproducing pain with patellar compression during a quad contraction, in a knee that is otherwise stable with no swelling, points to a cartilage-loading problem at the patellofemoral joint rather than a meniscal or ligamentous injury.'
  ],
  'Patellofemoral pain syndrome is an overuse pattern of anterior knee pain from abnormal patellofemoral joint loading, often linked to proximal hip weakness that changes lower-limb mechanics. Pain with sitting, stairs, and a positive patellar compression/grind test in a stable, non-swollen knee are the classic picture; imaging mainly rules out other structural causes.',
  'approved'
);
