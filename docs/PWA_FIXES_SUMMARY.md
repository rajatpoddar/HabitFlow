# PWA & Notifications Fixes Summary

## Issues Fixed

### 1. ❌ "Failed to enable notifications" Error
**Root Cause:** Multiple potential issues with notification setup

**Fixes Applied:**
- ✅ Added VAPID key validation before attempting subscription
- ✅ Improved error handling with specific error messages
- ✅ Wait for service worker to be ready before subscribing
- ✅ Better error reporting from server API
- ✅ Added console logging for debugging

**Files Modified:**
- `src/lib/push-notifications.ts` - Enhanced error handling and validation
- `src/components/notifications/NotificationPermissionBanner.tsx` - Better error messages

### 2. ❌ Missing Install Button (PWA)
**Root Cause:** Manifest configuration and PWA requirements not fully met

**Fixes Applied:**
- ✅ Fixed manifest.json:
  - Changed `start_url` from `/dashboard` to `/` (more reliable)
  - Added `scope: "/"` for proper PWA scope
  - Split icon purposes (separate `any` and `maskable` entries)
  - Removed empty `screenshots` array
- ✅ Added HTTPS detection in install hook
- ✅ Added better logging for install prompt availability
- ✅ Added timeout to detect when prompt never fires

**Files Modified:**
- `public/manifest.json` - Fixed PWA manifest configuration
- `src/hooks/usePWAInstall.ts` - Added HTTPS check and better logging

## New Features Added

### 1. 🐛 Debug Page (`/debug-pwa`)
A comprehensive diagnostic page that shows:
- Security status (HTTPS, protocol)
- PWA installation status
- Service worker registration details
- Notification permissions and support
- Push subscription status
- VAPID key configuration
- Manifest accessibility and validity
- Icon availability
- Browser information

**Features:**
- Real-time status checks with ✅/❌ indicators
- Download debug info as JSON
- Unregister service worker button
- Quick refresh button

**Access:** Settings → PWA Debug Info

### 2. 📚 Troubleshooting Guide
Created `PWA_TROUBLESHOOTING.md` with:
- Detailed explanations of both issues
- Step-by-step solutions
- Browser-specific notes
- Testing commands
- Production deployment checklist
- Common error messages and fixes

## How to Test

### Test Notifications:
1. Open the app in browser
2. Go to Dashboard
3. Click "Enable" on the notification banner
4. Check browser console for any errors
5. If it fails, go to Settings → PWA Debug Info to diagnose

### Test PWA Install:

#### Desktop Chrome/Edge:
1. Visit the app over HTTPS (or localhost)
2. Wait a few seconds for the install prompt
3. Look for install banner on dashboard
4. Or check address bar for install icon

#### Android Chrome:
1. Visit the app over HTTPS
2. Visit at least twice with 5 minutes between visits
3. Look for "Add to Home Screen" banner
4. Or use Chrome menu → "Install app"

#### iOS Safari:
1. Visit the app over HTTPS (localhost won't work)
2. Tap Share button
3. Tap "Add to Home Screen"
4. The app shows manual instructions

## Environment Variables Required

Ensure these are set in `.env.local`:

```env
# Push Notifications (REQUIRED)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:support@habitflow.app

# Generate with: npx web-push generate-vapid-keys
```

## Database Requirements

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

## Common Issues & Quick Fixes

### Issue: Notification button does nothing
**Fix:** Check browser console, likely VAPID key issue or service worker not registered

### Issue: Install button never appears
**Fix:** 
1. Ensure using HTTPS (not HTTP)
2. Check manifest.json is accessible at `/manifest.json`
3. Verify icons exist at `/icons/icon-192.png` and `/icons/icon-512.png`
4. Check service worker is registered
5. Try in incognito mode (clean state)

### Issue: Works on desktop but not mobile
**Fix:**
- Android: Visit site twice with 5 minutes between visits
- iOS: Must manually add to home screen (no automatic prompt)
- Ensure using HTTPS (not localhost)

### Issue: Service worker not registering
**Fix:**
1. Check browser console for errors
2. Verify `/sw.js` file exists and is accessible
3. Try unregistering and refreshing (use debug page)
4. Clear browser cache

## Testing Checklist

Before marking as complete:

- [ ] Notifications work on desktop Chrome
- [ ] Notifications work on Android Chrome
- [ ] Install prompt appears on desktop (or shows manual instructions)
- [ ] Install works on Android
- [ ] iOS shows manual install instructions
- [ ] Service worker registers successfully
- [ ] Manifest is valid and accessible
- [ ] Icons load correctly
- [ ] Debug page shows all green checkmarks
- [ ] Error messages are helpful and specific
- [ ] HTTPS is enabled (for production)

## Production Deployment Notes

1. **Generate Production VAPID Keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Set Environment Variables** on hosting platform (Vercel/Netlify)

3. **Verify HTTPS** is enabled (automatic on Vercel/Netlify)

4. **Test on Real Devices:**
   - Android Chrome
   - iOS Safari
   - Desktop browsers

5. **Monitor Errors:**
   - Check browser console
   - Check server logs
   - Use debug page for diagnostics

## Files Changed

### Modified:
- `public/manifest.json` - Fixed PWA configuration
- `src/lib/push-notifications.ts` - Enhanced error handling
- `src/components/notifications/NotificationPermissionBanner.tsx` - Better errors
- `src/hooks/usePWAInstall.ts` - Added HTTPS check and logging
- `src/app/settings/page.tsx` - Added debug page link

### Created:
- `src/app/debug-pwa/page.tsx` - New debug diagnostic page
- `PWA_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- `PWA_FIXES_SUMMARY.md` - This file

## Next Steps

1. **Test the fixes:**
   - Run `npm run dev`
   - Visit `http://localhost:3000`
   - Try enabling notifications
   - Check if install prompt appears
   - Visit `/debug-pwa` to verify all checks pass

2. **If issues persist:**
   - Check browser console for specific errors
   - Use the debug page to identify the problem
   - Refer to `PWA_TROUBLESHOOTING.md` for solutions

3. **For production:**
   - Deploy to HTTPS hosting (Vercel/Netlify)
   - Generate production VAPID keys
   - Test on real mobile devices
   - Monitor error logs

## Support

If you encounter issues:
1. Visit `/debug-pwa` and download the debug info
2. Check browser console for errors
3. Refer to `PWA_TROUBLESHOOTING.md`
4. Check that all environment variables are set
5. Verify database table exists
