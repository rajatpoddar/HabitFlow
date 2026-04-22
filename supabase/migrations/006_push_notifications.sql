-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 006: Push Notifications & Onboarding
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Push Subscriptions Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
  ON public.push_subscriptions(user_id);

-- ── Add Reminder Columns to Habits ────────────────────────────────────────────

-- Add reminder_time and reminder_enabled if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habits' AND column_name = 'reminder_time'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN reminder_time TIME DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habits' AND column_name = 'reminder_enabled'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN reminder_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ── Add Onboarding Columns to User Profiles ───────────────────────────────────

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN onboarding_step INT DEFAULT 0;
  END IF;
END $$;

-- ── Add Email Preference Columns ───────────────────────────────────────────────

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email_welcome'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email_welcome BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email_streak_risk'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email_streak_risk BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email_weekly_digest'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email_weekly_digest BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email_milestones'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email_milestones BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ── Add Streak Freeze Column ───────────────────────────────────────────────────

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'streak_freezes'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN streak_freezes INT DEFAULT 1;
  END IF;
END $$;

-- ── Add Flexible Scheduling Columns to Habits ──────────────────────────────────

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habits' AND column_name = 'frequency'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN frequency TEXT DEFAULT 'daily';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habits' AND column_name = 'custom_days'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN custom_days INTEGER[] DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habits' AND column_name = 'times_per_week'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN times_per_week INTEGER DEFAULT NULL;
  END IF;
END $$;

-- ── Add Type Column to Habit Logs (for streak freeze) ──────────────────────────

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habit_logs' AND column_name = 'log_type'
  ) THEN
    ALTER TABLE public.habit_logs ADD COLUMN log_type TEXT DEFAULT 'completion';
  END IF;
END $$;

-- Add index for log_type
CREATE INDEX IF NOT EXISTS idx_habit_logs_type 
  ON public.habit_logs(log_type);

-- ══════════════════════════════════════════════════════════════════════════════
-- End of Migration 006
-- ══════════════════════════════════════════════════════════════════════════════
