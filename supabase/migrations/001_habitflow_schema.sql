-- ============================================================
-- HabitFlow — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── habits ────────────────────────────────────────────────────
create table if not exists public.habits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  type          text not null check (type in ('good', 'bad')),
  category      text not null default 'Health',
  icon          text not null default 'check_circle',
  color         text not null default '#005237',
  frequency     text not null default 'daily' check (frequency in ('daily', 'weekly')),
  target_per_day integer not null default 1 check (target_per_day >= 1),
  is_active     boolean not null default true,
  reminder_time text,                        -- HH:MM format (e.g., "09:00")
  reminder_enabled boolean not null default false,
  daily_limit   integer,                     -- For bad habits: max allowed per day
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── habit_logs ────────────────────────────────────────────────
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits(id) on delete cascade,
  date       text not null,           -- YYYY-MM-DD
  status     text not null check (status in ('done', 'missed')),
  count      integer not null default 0,  -- For bad habits: how many times done today
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, date)             -- one log per habit per day
);

-- ── journal_entries ───────────────────────────────────────────
create table if not exists public.journal_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         text not null,         -- YYYY-MM-DD
  good_text    text default '',
  bad_text     text default '',
  journal_text text default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, date)              -- one entry per user per day
);

-- ── alarms ────────────────────────────────────────────────────
create table if not exists public.alarms (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  time       text not null,           -- HH:MM format (e.g., "07:00")
  label      text default 'Wake up',
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Indexes for fast queries ──────────────────────────────────
create index if not exists habits_user_id_idx       on public.habits(user_id);
create index if not exists habits_user_active_idx   on public.habits(user_id, is_active);
create index if not exists habit_logs_habit_id_idx  on public.habit_logs(habit_id);
create index if not exists habit_logs_date_idx      on public.habit_logs(date);
create index if not exists journal_user_date_idx    on public.journal_entries(user_id, date);
create index if not exists alarms_user_id_idx       on public.alarms(user_id);

-- ── Row Level Security ────────────────────────────────────────
alter table public.habits          enable row level security;
alter table public.habit_logs      enable row level security;
alter table public.journal_entries enable row level security;
alter table public.alarms          enable row level security;

-- habits policies
create policy "habits: users manage own"
  on public.habits for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- habit_logs policies
create policy "habit_logs: users manage own"
  on public.habit_logs for all
  using  (auth.uid() = (select user_id from public.habits where id = habit_id))
  with check (auth.uid() = (select user_id from public.habits where id = habit_id));

-- journal_entries policies
create policy "journal: users manage own"
  on public.journal_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- alarms policies
create policy "alarms: users manage own"
  on public.alarms for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

create trigger habit_logs_updated_at
  before update on public.habit_logs
  for each row execute function public.set_updated_at();

create trigger journal_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

create trigger alarms_updated_at
  before update on public.alarms
  for each row execute function public.set_updated_at();
