-- ONE-TIME migration for the live project: adds editable profile fields
-- (clinic/country/role), the follows table, and the leaderboard/social RPCs.
-- Safe to re-run — every statement is idempotent (if not exists / create or replace).
-- Run this once in the Supabase SQL editor.

-- 1. Editable profile fields.
alter table public.profiles add column if not exists clinic_name text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists role text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role is null or role in ('dpt_student', 'new_grad', 'practicing_pt', 'other'));

-- 2. follows table (one-way, Twitter-style — no approval needed).
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self_follow check (follower_id <> followee_id)
);
create index if not exists follows_followee_idx on public.follows (followee_id);
alter table public.follows enable row level security;

drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows
  for select using (follower_id = auth.uid() or followee_id = auth.uid());
drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows
  for insert with check (follower_id = auth.uid());
drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows
  for delete using (follower_id = auth.uid());

-- 3. Leaderboard / social RPCs.
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
