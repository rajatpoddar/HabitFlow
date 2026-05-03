ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "friend_updates_enabled" boolean DEFAULT true NOT NULL;
