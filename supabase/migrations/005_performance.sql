-- ============================================================
-- HabitFlow — Performance Indexes
-- Run AFTER 001–004 migrations.
-- ============================================================

-- Composite index for habit_logs date+status queries (analytics, admin stats)
CREATE INDEX IF NOT EXISTS habit_logs_date_status_idx
  ON public.habit_logs(date, status);

-- Composite index for habit_logs habit+date (toggle log lookups)
CREATE INDEX IF NOT EXISTS habit_logs_habit_date_idx
  ON public.habit_logs(habit_id, date DESC);

-- Composite index for user_profiles plan+banned (admin filters)
CREATE INDEX IF NOT EXISTS user_profiles_plan_banned_idx
  ON public.user_profiles(plan, is_banned);

-- Index for habits user+active+created (dashboard load)
CREATE INDEX IF NOT EXISTS habits_user_active_created_idx
  ON public.habits(user_id, is_active, created_at ASC);

-- Index for journal entries user+date (journal page)
CREATE INDEX IF NOT EXISTS journal_user_date_desc_idx
  ON public.journal_entries(user_id, date DESC);
