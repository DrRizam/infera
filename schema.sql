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
alter table public.profiles      enable row level security;
alter table public.case_attempts enable row level security;
alter table public.notifications enable row level security;
alter table public.feedback      enable row level security;
alter table public.follows       enable row level security;

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
create or replace function public.leaderboard_global(limit_n int default 50)
returns table(user_id uuid, display_name text, xp int)
language sql security definer set search_path = public stable as $$
  select user_id, coalesce(display_name, 'Anonymous'), coalesce((state->>'xp')::int, 0)
  from public.profiles
  order by coalesce((state->>'xp')::int, 0) desc
  limit limit_n;
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
  limit limit_n;
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
  limit limit_n;
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
  limit limit_n;
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
