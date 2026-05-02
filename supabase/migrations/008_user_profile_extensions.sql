-- Migration: 008_user_profile_extensions.sql
-- Description: Adds gender, age, location, and mobile_number to user_profiles and creates an avatars storage bucket

-- 1. Add new columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 0),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- 2. Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies for the avatars bucket
-- Allow public access to read avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatars." ON storage.objects;
CREATE POLICY "Users can upload their own avatars."
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
CREATE POLICY "Users can update their own avatars."
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars." ON storage.objects;
CREATE POLICY "Users can delete their own avatars."
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
