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

-- ── RLS ───────────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.case_attempts enable row level security;

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
