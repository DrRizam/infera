-- ONE-TIME cleanup for a live Supabase project that already has the old
-- clinic/org schema applied (organizations, memberships, case_attempts.org_id,
-- the create_organization/join_organization RPCs, etc). Run this instead of
-- schema.sql, which assumes a fresh project and can't `create table` over
-- ones that already exist.
--
-- This is DESTRUCTIVE: it drops the organizations/memberships tables and
-- everything referencing them, and drops case_attempts.org_id along with
-- whatever values are in it. There's no org concept in the B2C app anymore,
-- so nothing here is worth preserving. profiles and case_attempts (minus
-- org_id) are left untouched — existing users and their progress are safe.
--
-- Run this ONCE in the Supabase SQL editor.

-- 1. Drop the trigger that populated case_attempts.org_id, and its function.
drop trigger if exists case_attempts_set_org on public.case_attempts;
drop function if exists public.set_case_attempt_org();

-- 2. Replace the two org-aware RLS policies with user-only versions
--    (must happen before dropping same_org_admin(), which they reference).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (user_id = auth.uid());

drop policy if exists case_attempts_select on public.case_attempts;
create policy case_attempts_select on public.case_attempts
  for select using (user_id = auth.uid());

-- 3. Drop the now-unused org column.
alter table public.case_attempts drop column if exists org_id;

-- 4. Drop the org RLS helper functions and RPCs.
drop function if exists public.same_org_admin(uuid);
drop function if exists public.is_org_admin(uuid);
drop function if exists public.current_org_id();
drop function if exists public.join_organization(text);
drop function if exists public.create_organization(text);

-- 5. Drop the org tables themselves (memberships first — it FKs to organizations).
drop table if exists public.memberships;
drop table if exists public.organizations;

-- 6. Add the new self-service account deletion RPC (see schema.sql for details).
create or replace function public.delete_own_account()
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
