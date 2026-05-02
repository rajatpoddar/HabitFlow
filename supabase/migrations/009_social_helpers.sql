-- Migration: 009_social_helpers.sql
-- Description: Adds a secure way to search users by email and ensures friendships table is correct

-- 1. Ensure friendships table exists and correctly references user_profiles
-- Referencing public.user_profiles instead of auth.users helps PostgREST resolve joins
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
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

-- 3. Add occupation to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 4. Create a function to search users by name (for Invite System)
CREATE OR REPLACE FUNCTION public.search_users_by_name(p_query TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    avatar_url TEXT,
    occupation TEXT,
    location TEXT,
    total_forest_health BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.name,
        up.avatar_url,
        up.occupation,
        up.location,
        (SELECT total_forest_health FROM public.social_stats ss WHERE ss.user_id = up.id)
    FROM public.user_profiles up
    WHERE 
        (up.name ILIKE '%' || p_query || '%')
        AND up.id != auth.uid()
        AND NOT EXISTS (
            -- Exclude users who are already friends or have pending requests
            SELECT 1 FROM public.friendships f 
            WHERE (f.requester_id = auth.uid() AND f.receiver_id = up.id)
               OR (f.requester_id = up.id AND f.receiver_id = auth.uid())
        )
    LIMIT p_limit;
END;
$$;

-- 5. Create a function to get user suggestions
CREATE OR REPLACE FUNCTION public.get_user_suggestions(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    name TEXT,
    avatar_url TEXT,
    occupation TEXT,
    location TEXT,
    total_forest_health BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.name,
        up.avatar_url,
        up.occupation,
        up.location,
        (SELECT total_forest_health FROM public.social_stats ss WHERE ss.user_id = up.id)
    FROM public.user_profiles up
    WHERE 
        up.id != auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM public.friendships f 
            WHERE (f.requester_id = auth.uid() AND f.receiver_id = up.id)
               OR (f.requester_id = up.id AND f.receiver_id = auth.uid())
        )
    ORDER BY random()
    LIMIT p_limit;
END;
$$;

-- 5.5. Create a secure function to find a user by email (as a helper)
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

-- 6. Ensure social_stats view exists
-- Using public.user_profiles instead of auth.users to avoid "Exposed Auth Users" lint error
CREATE OR REPLACE VIEW public.social_stats AS
SELECT 
    up.id AS user_id,
    COALESCE(SUM(get_current_streak(h.id)), 0) AS total_forest_health
FROM public.user_profiles up
LEFT JOIN public.habits h ON up.id = h.user_id AND h.is_active = true
GROUP BY up.id;

GRANT SELECT ON public.social_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_by_name(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_suggestions(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;
