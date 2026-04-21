-- ============================================================
-- HabitFlow — Security Fixes Migration
-- Addresses Supabase Security Advisor findings:
--   ERROR  0002: auth_users_exposed   — admin_users_view exposes auth.users to anon
--   ERROR  0010: security_definer_view — admin_users_view uses SECURITY DEFINER
--   WARN   0011: function_search_path_mutable — set_updated_at, handle_new_user,
--                                               is_admin, get_habit_limit
-- ============================================================

-- ── 1. Drop the insecure public view ─────────────────────────────────────────
-- The old view was SECURITY DEFINER and exposed auth.users to the anon role.
-- We replace it with a secure view that:
--   a) Does NOT use SECURITY DEFINER (uses invoker's permissions instead)
--   b) Is NOT accessible to anon (revoke + only grant to authenticated)
--   c) Enforces an admin-only RLS check via the is_admin() function

drop view if exists public.admin_users_view;

-- Recreate without SECURITY DEFINER (SECURITY INVOKER is the safe default).
-- Only authenticated admins can call is_admin() successfully; anon cannot
-- read user_profiles at all, so the view returns no rows for non-admins.
create or replace view public.admin_users_view
  with (security_invoker = true)
as
  select
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    up.name,
    up.plan,
    up.is_banned,
    up.ban_reason,
    up.avatar_url,
    (
      select count(*)
      from public.habits h
      where h.user_id = au.id
        and h.is_active = true
    ) as habit_count,
    (
      select count(*)
      from public.habit_logs hl
      join public.habits h2 on h2.id = hl.habit_id
      where h2.user_id = au.id
        and hl.date >= to_char(now() - interval '7 days', 'YYYY-MM-DD')
    ) as logs_last_7_days
  from auth.users au
  left join public.user_profiles up on up.id = au.id
  where public.is_admin();   -- non-admins see zero rows; anon gets permission denied

-- Revoke from anon (belt-and-suspenders on top of the WHERE clause)
revoke all on public.admin_users_view from anon;
-- Only authenticated users may select; the WHERE clause further restricts to admins
grant select on public.admin_users_view to authenticated;


-- ── 2. Fix mutable search_path on set_updated_at ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 3. Fix mutable search_path on handle_new_user ────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, name, avatar_url, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- ── 4. Fix mutable search_path on is_admin ───────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and plan = 'admin'
  );
$$;


-- ── 5. Fix mutable search_path on get_habit_limit ────────────────────────────
create or replace function public.get_habit_limit(user_plan text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case user_plan
    when 'free'  then 5
    when 'pro'   then 999
    when 'admin' then 999
    else 5
  end;
$$;
