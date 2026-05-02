-- Migration: 007_social_features.sql
-- Description: Adds friendships table and a view for social_stats (Forest Health)

CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE(requester_id, receiver_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" 
ON public.friendships FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships" 
ON public.friendships FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update friendships" ON public.friendships;
CREATE POLICY "Users can update friendships" 
ON public.friendships FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete friendships" ON public.friendships;
CREATE POLICY "Users can delete friendships" 
ON public.friendships FOR DELETE 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Create a helper function to calculate the current streak for a given habit
CREATE OR REPLACE FUNCTION get_current_streak(p_habit_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_last_date DATE := CURRENT_DATE;
    v_log_date DATE;
BEGIN
    FOR v_log_date IN 
        SELECT date::DATE 
        FROM public.habit_logs 
        WHERE habit_id = p_habit_id AND status = 'done' 
        ORDER BY date DESC
    LOOP
        IF v_log_date = v_last_date OR v_log_date = v_last_date - INTERVAL '1 day' THEN
            v_streak := v_streak + 1;
            v_last_date := v_log_date;
        ELSIF v_log_date < v_last_date - INTERVAL '1 day' THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the social_stats view which sums the current streaks of all active habits for a user
-- Using public.user_profiles instead of auth.users to avoid "Exposed Auth Users" lint error
-- Explicitly setting security_invoker = true to satisfy Supabase security lint
CREATE OR REPLACE VIEW public.social_stats 
WITH (security_invoker = true)
AS
SELECT 
    up.id AS user_id,
    COALESCE(SUM(get_current_streak(h.id)), 0) AS total_forest_health
FROM public.user_profiles up
LEFT JOIN public.habits h ON up.id = h.user_id AND h.is_active = true
GROUP BY up.id;
