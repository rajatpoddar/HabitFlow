-- ============================================================
-- HabitFlow — SaaS Upgrade Migration
-- Run AFTER 001 and 002 migrations.
-- ============================================================

-- ── user_profiles (extended user data) ───────────────────────
create table if not exists public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text,
  avatar_url    text,
  plan          text not null default 'free' check (plan in ('free', 'pro', 'admin')),
  is_banned     boolean not null default false,
  ban_reason    text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'inactive',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── ai_insights ───────────────────────────────────────────────
create table if not exists public.ai_insights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  text not null,   -- YYYY-MM-DD (Monday of the week)
  insights    jsonb not null default '[]',
  summary     text,
  generated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ── rate_limit_log (for API rate limiting) ────────────────────
create table if not exists public.rate_limit_log (
  id         uuid primary key default gen_random_uuid(),
  identifier text not null,   -- user_id or IP
  endpoint   text not null,
  hit_at     timestamptz not null default now()
);

-- ── audit_log (admin audit trail) ────────────────────────────
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists user_profiles_plan_idx      on public.user_profiles(plan);
create index if not exists ai_insights_user_week_idx   on public.ai_insights(user_id, week_start);
create index if not exists rate_limit_log_ident_idx    on public.rate_limit_log(identifier, endpoint, hit_at);
create index if not exists audit_log_actor_idx         on public.audit_log(actor_id);
create index if not exists audit_log_created_idx       on public.audit_log(created_at desc);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.user_profiles  enable row level security;
alter table public.ai_insights    enable row level security;
alter table public.rate_limit_log enable row level security;
alter table public.audit_log      enable row level security;

-- user_profiles: users can read/update their own; admins can read all
create policy "profiles: users manage own"
  on public.user_profiles for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admins read all"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.plan = 'admin'
    )
  );

-- ai_insights: users can only see their own
create policy "insights: users manage own"
  on public.ai_insights for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rate_limit_log: service role only (no user access)
create policy "rate_limit: no direct access"
  on public.rate_limit_log for all
  using (false);

-- audit_log: admins can read; service role writes
create policy "audit: admins read"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.plan = 'admin'
    )
  );

-- ── Auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── updated_at triggers ───────────────────────────────────────
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ── Admin helper function ─────────────────────────────────────
-- Returns true if the calling user is an admin
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and plan = 'admin'
  );
$$;

-- ── Admin: view all users (safe view) ────────────────────────
create or replace view public.admin_users_view as
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
    (select count(*) from public.habits h where h.user_id = au.id and h.is_active = true) as habit_count,
    (select count(*) from public.habit_logs hl
       join public.habits h2 on h2.id = hl.habit_id
       where h2.user_id = au.id
         and hl.date >= to_char(now() - interval '7 days', 'YYYY-MM-DD')
    ) as logs_last_7_days
  from auth.users au
  left join public.user_profiles up on up.id = au.id;

-- Grant admin view access
grant select on public.admin_users_view to authenticated;

-- ── Plan limits helper ────────────────────────────────────────
create or replace function public.get_habit_limit(user_plan text)
returns integer language sql immutable as $$
  select case user_plan
    when 'free'  then 5
    when 'pro'   then 999
    when 'admin' then 999
    else 5
  end;
$$;
