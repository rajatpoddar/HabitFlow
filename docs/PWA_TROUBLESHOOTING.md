# PWA & Notifications Troubleshooting Guide

## Issue 1: "Failed to enable notifications" Error

### Root Causes:
1. **Missing or Invalid VAPID Keys**
2. **Service Worker Not Registered**
3. **Browser Permissions Blocked**
4. **HTTPS Not Enabled (on non-localhost)**

### Solutions:

#### 1. Verify VAPID Keys
Check that your `.env.local` has valid VAPID keys:

```bash
# Generate new VAPID keys if needed
npx web-push generate-vapid-keys
```

Add to `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDYFEvpA73vXF7PPOyK4Hq5cPkFF1_-mtC2mj_u_VjrXwkQF0dQg-Sxqy--Gm_7ibqjqPcZ2Hj2yotSXUgRavY4
VAPID_PRIVATE_KEY=onH_2v7Y-PCeEwJUO4S0xzOC4PYAb10nqyQLXZxmUbc
VAPID_SUBJECT=mailto:support@habitflow.app
```

#### 2. Check Service Worker Registration
Open browser DevTools → Application → Service Workers

- Should show `/sw.js` as "activated and running"
- If not, check console for errors
- Try unregistering and refreshing the page

#### 3. Reset Browser Permissions
**Chrome/Edge:**
1. Click the lock icon in address bar
2. Click "Site settings"
3. Reset "Notifications" to "Ask"
4. Refresh page and try again

**Firefox:**
1. Click the lock icon
2. Click "Clear permissions and reload"

**Safari (iOS):**
- Notifications only work when app is installed to home screen
- Must use HTTPS (not localhost)

#### 4. Check Database Table
Ensure `push_subscriptions` table exists in Supabase:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

---

## Issue 2: Missing Install Button (PWA)

### Why the Install Button Doesn't Show:

#### Chrome/Edge Requirements:
1. **HTTPS Required** (except localhost)
2. **Valid manifest.json** with:
   - `name` or `short_name`
   - `icons` (192px and 512px)
   - `start_url`
   - `display: standalone`
3. **Service Worker Registered**
4. **Not Already Installed**
5. **User Engagement** (visited site at least once)

#### Android Chrome Additional Requirements:
- Must visit site at least twice with 5 minutes between visits
- Site must be HTTPS
- Must have valid icons

#### iOS Safari:
- **No automatic install prompt**
- Users must manually: Share → Add to Home Screen
- App shows manual instructions instead

### Solutions:

#### 1. Verify Manifest is Valid
Check: `https://your-domain.com/manifest.json`

Should return valid JSON with all required fields.

#### 2. Test Install Criteria
Open DevTools → Application → Manifest

- Check for any warnings
- Verify all icons load correctly
- Check "Installability" section

#### 3. Force Install Prompt (Testing Only)
In Chrome DevTools:
1. Application → Manifest
2. Click "Update" to reload manifest
3. Check "Installability" errors

#### 4. Deploy to HTTPS
The install prompt **will not work** on:
- HTTP (non-localhost)
- IP addresses (except 127.0.0.1)
- Self-signed certificates

**Recommended hosting:**
- Vercel (automatic HTTPS)
- Netlify (automatic HTTPS)
- Cloudflare Pages (automatic HTTPS)

#### 5. Test on Real Device
Desktop Chrome is more lenient than mobile:
- Test on actual Android device
- Use Chrome Remote Debugging
- Check mobile Chrome flags: `chrome://flags`

---

## Quick Debugging Checklist

### For Notifications:
- [ ] VAPID keys are set in `.env.local`
- [ ] Service worker is registered (check DevTools)
- [ ] Browser permissions are not blocked
- [ ] Using HTTPS (or localhost)
- [ ] `push_subscriptions` table exists in database
- [ ] Check browser console for errors

### For PWA Install:
- [ ] Using HTTPS (or localhost)
- [ ] `manifest.json` is accessible and valid
- [ ] Icons (192px, 512px) exist and load
- [ ] Service worker is registered
- [ ] Not already installed (check standalone mode)
- [ ] On iOS: Show manual instructions instead

---

## Testing Commands

```bash
# 1. Verify environment variables
cat .env.local | grep VAPID

# 2. Check if service worker file exists
ls -la public/sw.js

# 3. Check if manifest exists
ls -la public/manifest.json

# 4. Check if icons exist
ls -la public/icons/

# 5. Test manifest validity
curl http://localhost:3000/manifest.json | jq

# 6. Restart dev server
npm run dev
```

---

## Browser-Specific Notes

### Chrome/Edge (Desktop & Android)
- Best PWA support
- Install prompt shows automatically when criteria met
- Notifications work in background

### Firefox
- Limited PWA support
- Install prompt may not show
- Notifications work but no background sync

### Safari (iOS)
- No automatic install prompt
- Must manually add to home screen
- Notifications **only work when installed**
- Requires HTTPS (localhost doesn't work)

### Safari (macOS)
- Limited PWA support
- Install via File → Add to Dock
- Notifications work

---

## Common Error Messages

### "Failed to enable notifications"
→ Check VAPID keys and service worker registration

### "Notification permission denied"
→ User blocked notifications, must reset in browser settings

### "Push notifications are not supported"
→ Browser doesn't support Push API (very old browser)

### "Failed to save subscription to server"
→ Check database table exists and API endpoint works

### No install button appears
→ Check HTTPS, manifest validity, and browser requirements

---

## Production Deployment Checklist

Before deploying to production:

1. **Generate Production VAPID Keys**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Set Environment Variables** on hosting platform

3. **Enable HTTPS** (automatic on Vercel/Netlify)

4. **Test on Real Devices**
   - Android Chrome
   - iOS Safari
   - Desktop browsers

5. **Verify Service Worker** loads on production domain

6. **Test Notification Flow** end-to-end

7. **Check Manifest** is accessible at `/manifest.json`

---

## Need More Help?

1. Check browser console for specific errors
2. Use Chrome DevTools → Application tab
3. Test in incognito mode (clean state)
4. Try different browser/device
5. Check Supabase logs for API errors
