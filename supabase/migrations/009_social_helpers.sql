-- Migration: 009_social_helpers.sql
-- Description: Adds a secure way to search users by email and ensures friendships table is correct

-- 1. Ensure friendships table exists (redundant but safe if 007 was missed)
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

-- Re-apply policies (drop if exists to be safe)
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

-- 2. Create a secure function to find a user by email
-- This avoids having to list all users or use an admin client on the frontend/api routes
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    RETURN v_user_id;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;

-- 3. Ensure social_stats view exists
CREATE OR REPLACE VIEW public.social_stats AS
SELECT 
    u.id AS user_id,
    COALESCE(SUM(get_current_streak(h.id)), 0) AS total_forest_health
FROM auth.users u
LEFT JOIN public.habits h ON u.id = h.user_id AND h.is_active = true
GROUP BY u.id;

GRANT SELECT ON public.social_stats TO authenticated;
