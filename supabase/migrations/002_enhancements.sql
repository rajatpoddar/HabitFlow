-- ============================================================
-- HabitFlow — Enhancement Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Only run if you already have the base schema (001) applied.
-- ============================================================

-- ── Add new columns to habits ─────────────────────────────────
alter table public.habits
  add column if not exists reminder_time    text,           -- HH:MM (e.g., "09:00")
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists daily_limit      integer;        -- For bad habits: max allowed per day

-- ── Add count column to habit_logs ───────────────────────────
alter table public.habit_logs
  add column if not exists count integer not null default 0; -- For bad habits: usage count today

-- ── Create alarms table ───────────────────────────────────────
create table if not exists public.alarms (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  time       text not null,           -- HH:MM format (e.g., "07:00")
  label      text default 'Wake up',
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists alarms_user_id_idx on public.alarms(user_id);

-- ── RLS for alarms ────────────────────────────────────────────
alter table public.alarms enable row level security;

drop policy if exists "alarms: users manage own" on public.alarms;
create policy "alarms: users manage own"
  on public.alarms for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── updated_at trigger for alarms ────────────────────────────
drop trigger if exists alarms_updated_at on public.alarms;
create trigger alarms_updated_at
  before update on public.alarms
  for each row execute function public.set_updated_at();
