# Environment File Fix

## Problem

Docker Compose is not reading `.env.local` file, showing warnings:
```
WARN[0000] The "NEXT_PUBLIC_SUPABASE_URL" variable is not set. Defaulting to a blank string.
```

## Root Cause

Docker Compose looks for `.env` by default, not `.env.local`.

## Solution

Choose one of these options:

### Option 1: Rename File (Simplest)

```bash
cd /volume1/docker/Projects/HabitFlow
mv .env.local .env
sudo docker-compose down
sudo docker-compose up -d --build
```

### Option 2: Create Symlink (Recommended)

This keeps `.env.local` for local development and creates `.env` for Docker:

```bash
cd /volume1/docker/Projects/HabitFlow
ln -sf .env.local .env
sudo docker-compose down
sudo docker-compose up -d --build
```

### Option 3: Use Updated Deploy Script

The updated `deploy.sh` automatically creates the symlink:

```bash
cd /volume1/docker/Projects/HabitFlow
git pull origin main
chmod +x deploy.sh
sudo ./deploy.sh
```

## Verification

After applying the fix, verify environment variables are loaded:

```bash
# Check if .env exists
ls -la .env

# Verify VAPID keys are set
sudo docker exec habitflow_app env | grep VAPID

# Should show:
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDYFEvpA73vXF7PPOyK4Hq5cPkFF1_-mtC2mj_u_VjrXwkQF0dQg-Sxqy--Gm_7ibqjqPcZ2Hj2yotSXUgRavY4
# VAPID_PRIVATE_KEY=onH_2v7Y-PCeEwJUO4S0xzOC4PYAb10nqyQLXZxmUbc
# VAPID_SUBJECT=mailto:support@habitflow.app

# Check Supabase keys
sudo docker exec habitflow_app env | grep SUPABASE

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://haplesbirjphzhzhlakk.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Expected Result

No more warnings, and the app should start successfully:

```bash
sudo docker-compose logs -f

# Should show:
# habitflow_app  |   ✓ Ready in 1134ms
# habitflow_app  | (no errors about missing Supabase credentials)
```

## Quick Commands

```bash
# Option 1: Rename
cd /volume1/docker/Projects/HabitFlow
mv .env.local .env
sudo docker-compose down && sudo docker-compose up -d --build

# Option 2: Symlink
cd /volume1/docker/Projects/HabitFlow
ln -sf .env.local .env
sudo docker-compose down && sudo docker-compose up -d --build

# Option 3: Use deploy script
cd /volume1/docker/Projects/HabitFlow
git pull
chmod +x deploy.sh
sudo ./deploy.sh

# Verify
sudo docker exec habitflow_app env | grep -E "VAPID|SUPABASE"
```

## Why This Happened

- `.env.local` is a Next.js convention for local development
- Docker Compose uses `.env` by default
- The `env_file` directive in `docker-compose.yml` was set to `.env.local`
- But Docker Compose also needs `.env` for variable substitution in the compose file itself

## Files Updated

1. **docker-compose.yml** - Changed `env_file` from `.env.local` to `.env`
2. **deploy.sh** - Auto-creates symlink if `.env` doesn't exist
3. **ENV_FILE_FIX.md** - This guide

## Next Steps

1. Apply one of the fixes above
2. Rebuild container: `sudo docker-compose up -d --build`
3. Verify: `sudo docker exec habitflow_app env | grep VAPID`
4. Test: Visit `https://habit.palojori.in/debug-pwa`
5. Should see all green checkmarks (✅)
