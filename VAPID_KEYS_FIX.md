# VAPID Keys Fix

## Issue

Debug page shows:
```json
"env": {
  "vapidKeyConfigured": false,
  "vapidKeyLength": 0
}
```

Even though the container has VAPID keys in environment.

## Root Cause

The VAPID keys in `.env` file have **quotes** around them:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BAErEI3Y0g1jpbMEBiB5WKzblJ9iil4a0wh9G_AXZ0ov8DUcyEi_OgNDJ5qD9L6T7s18H-IMrI5oS_JbBRr_aP8"
```

This causes Next.js to include the quotes as part of the value, making it invalid.

## Solution

Remove quotes from VAPID keys in your `.env` file on the NAS:

### On Your Synology NAS:

```bash
cd /volume1/docker/Projects/HabitFlow

# Edit .env file
nano .env

# Change from:
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BAErEI3Y0g1jpbMEBiB5WKzblJ9iil4a0wh9G_AXZ0ov8DUcyEi_OgNDJ5qD9L6T7s18H-IMrI5oS_JbBRr_aP8"
VAPID_PRIVATE_KEY="ImAkUZdU2BEkXJAzAdutlsJQ4xHuHxFCn9Cma0-PnDU"

# To (no quotes):
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAErEI3Y0g1jpbMEBiB5WKzblJ9iil4a0wh9G_AXZ0ov8DUcyEi_OgNDJ5qD9L6T7s18H-IMrI5oS_JbBRr_aP8
VAPID_PRIVATE_KEY=ImAkUZdU2BEkXJAzAdutlsJQ4xHuHxFCn9Cma0-PnDU

# Save and exit (Ctrl+X, Y, Enter)
```

### Or Use sed (Quick Fix):

```bash
cd /volume1/docker/Projects/HabitFlow

# Remove quotes from VAPID keys
sed -i 's/NEXT_PUBLIC_VAPID_PUBLIC_KEY=".*"/NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAErEI3Y0g1jpbMEBiB5WKzblJ9iil4a0wh9G_AXZ0ov8DUcyEi_OgNDJ5qD9L6T7s18H-IMrI5oS_JbBRr_aP8/' .env
sed -i 's/VAPID_PRIVATE_KEY=".*"/VAPID_PRIVATE_KEY=ImAkUZdU2BEkXJAzAdutlsJQ4xHuHxFCn9Cma0-PnDU/' .env

# Verify
cat .env | grep VAPID
```

### Rebuild Container:

```bash
sudo docker-compose down
sudo docker-compose up -d --build
```

## Verification

After rebuilding, check:

```bash
# 1. Check environment variables (should have no quotes)
sudo docker exec habitflow_app env | grep VAPID

# Should show:
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAErEI3Y0g1jpbMEBiB5WKzblJ9iil4a0wh9G_AXZ0ov8DUcyEi_OgNDJ5qD9L6T7s18H-IMrI5oS_JbBRr_aP8
# VAPID_PRIVATE_KEY=ImAkUZdU2BEkXJAzAdutlsJQ4xHuHxFCn9Cma0-PnDU

# 2. Visit debug page
# https://habit.palojori.in/debug-pwa

# Should show:
# "env": {
#   "vapidKeyConfigured": true,  ✅
#   "vapidKeyLength": 87         ✅
# }
```

## Why This Matters

- `NEXT_PUBLIC_*` variables are baked into the Next.js build at **build time**
- If they have quotes, the quotes become part of the value
- This makes the VAPID key invalid
- Notifications won't work

## Correct Format

```env
# ✅ CORRECT (no quotes)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAErEI3Y0g1jpbMEBiB5WKzblJ9iil4a0wh9G_AXZ0ov8DUcyEi_OgNDJ5qD9L6T7s18H-IMrI5oS_JbBRr_aP8
VAPID_PRIVATE_KEY=ImAkUZdU2BEkXJAzAdutlsJQ4xHuHxFCn9Cma0-PnDU

# ❌ WRONG (has quotes)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BAErEI3Y0g1jpbMEBiB5WKzblJ9iil4a0wh9G_AXZ0ov8DUcyEi_OgNDJ5qD9L6T7s18H-IMrI5oS_JbBRr_aP8"
VAPID_PRIVATE_KEY="ImAkUZdU2BEkXJAzAdutlsJQ4xHuHxFCn9Cma0-PnDU"
```

## Quick Fix Commands

```bash
# On your NAS
cd /volume1/docker/Projects/HabitFlow

# Remove quotes
sed -i 's/"//g' .env

# Or manually edit
nano .env
# Remove all quotes from VAPID keys
# Save and exit

# Rebuild
sudo docker-compose down
sudo docker-compose up -d --build

# Verify
sudo docker exec habitflow_app env | grep VAPID
curl https://habit.palojori.in/debug-pwa | jq '.env'
```

## Expected Result

After fix:
- ✅ `vapidKeyConfigured: true`
- ✅ `vapidKeyLength: 87`
- ✅ Notifications work on desktop/Android
- ✅ Notifications work on iOS after installing to home screen
