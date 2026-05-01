# Testing Guide: PWA & Notifications Fixes

## Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Open the App
Visit: `http://localhost:3000`

---

## Test Scenario 1: Notification Enable

### Steps:
1. Navigate to Dashboard (`/dashboard`)
2. Look for the notification permission banner
3. Click the **"Enable"** button
4. Allow notifications when browser prompts
5. Check for success message: "Notifications enabled! 🔔"

### Expected Results:
- ✅ No "Failed to enable notifications" error
- ✅ Success toast appears
- ✅ Banner disappears after enabling
- ✅ Browser shows notification permission granted

### If It Fails:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Go to Settings → **PWA Debug Info**
4. Look for red ❌ indicators
5. Common issues:
   - VAPID key not configured → Check `.env.local`
   - Service worker not registered → Refresh page
   - Permission denied → Reset in browser settings

---

## Test Scenario 2: PWA Install (Desktop)

### Steps:
1. Visit the app in Chrome/Edge
2. Wait 3-5 seconds
3. Look for install banner on dashboard
4. OR check address bar for install icon ⊕
5. Click install button

### Expected Results:
- ✅ Install banner appears (or address bar icon)
- ✅ Clicking install opens native prompt
- ✅ App installs to desktop/taskbar
- ✅ Opens in standalone window (no browser UI)

### If Install Button Doesn't Appear:
1. Check you're using HTTPS or localhost
2. Verify manifest: `http://localhost:3000/manifest.json`
3. Check DevTools → Application → Manifest
4. Look for "Installability" warnings
5. Try incognito mode (clean state)
6. Go to Settings → **PWA Debug Info**

---

## Test Scenario 3: PWA Install (Android)

### Requirements:
- Android device with Chrome
- App deployed to HTTPS (not localhost)

### Steps:
1. Visit the app on Android Chrome
2. Browse around for 30 seconds
3. Close and revisit after 5 minutes
4. Look for "Add to Home Screen" banner
5. OR use Chrome menu → "Install app"

### Expected Results:
- ✅ Install banner appears after engagement
- ✅ App installs to home screen
- ✅ Opens in fullscreen (no browser UI)
- ✅ Notifications work when installed

### If It Doesn't Work:
- Ensure using HTTPS (not HTTP or localhost)
- Visit site at least twice
- Wait 5 minutes between visits
- Check Chrome flags: `chrome://flags`

---

## Test Scenario 4: iOS Safari

### Important Notes:
- ❌ No automatic install prompt on iOS
- ✅ Must manually add to home screen
- ✅ App shows instructions instead

### Steps:
1. Visit app on iOS Safari (HTTPS required)
2. Look for install banner with instructions
3. Tap Share button (bottom toolbar)
4. Scroll and tap "Add to Home Screen"
5. Tap "Add" in top right

### Expected Results:
- ✅ Banner shows manual instructions
- ✅ App installs to home screen
- ✅ Opens in fullscreen
- ✅ Notifications work when installed

---

## Debug Page Testing

### Access:
Settings → **PWA Debug Info** or visit `/debug-pwa`

### What to Check:
1. **Security Section:**
   - ✅ HTTPS Enabled (or localhost)
   - ✅ Protocol is https: or http: (localhost only)

2. **Service Worker Section:**
   - ✅ Supported: Yes
   - ✅ Registered: Yes
   - ✅ Active: Yes

3. **Notifications Section:**
   - ✅ Notification API: Supported
   - ✅ Permission: granted (after enabling)
   - ✅ Push API: Supported
   - ✅ Push Subscribed: Yes (after enabling)

4. **Environment Section:**
   - ✅ VAPID Key Configured: Yes
   - ✅ VAPID Key Length: 87 characters

5. **Manifest Section:**
   - ✅ Accessible: Yes
   - ✅ Valid: Yes

6. **Icons Section:**
   - ✅ 192x192 Icon: Found
   - ✅ 512x512 Icon: Found

### Actions to Try:
- **Refresh Page** - Reload debug info
- **Unregister Service Worker** - Reset SW state
- **Download Debug Info** - Save as JSON for troubleshooting

---

## Browser Console Testing

### Open DevTools:
- Chrome/Edge: F12 or Cmd+Option+I (Mac)
- Firefox: F12 or Cmd+Option+K (Mac)
- Safari: Cmd+Option+C (Mac)

### What to Look For:

#### Service Worker Registration:
```
[PWA] Service worker registered: http://localhost:3000/
```

#### Install Prompt:
```
[PWA] Install prompt available
```

#### Notification Subscription:
```
Push subscription successful
```

### Common Errors:

#### "VAPID public key is not configured"
**Fix:** Check `.env.local` has `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

#### "Service worker registration failed"
**Fix:** Check `/sw.js` exists and is accessible

#### "Notification permission denied"
**Fix:** Reset browser permissions and try again

#### "Failed to save subscription to server"
**Fix:** Check database table exists and API works

---

## Production Testing Checklist

Before deploying to production:

### Pre-Deployment:
- [ ] Generate production VAPID keys
- [ ] Set environment variables on hosting platform
- [ ] Verify database table exists
- [ ] Test manifest is valid
- [ ] Verify icons load correctly

### Post-Deployment:
- [ ] Visit app over HTTPS
- [ ] Test notifications on desktop
- [ ] Test notifications on Android
- [ ] Test install on desktop Chrome
- [ ] Test install on Android Chrome
- [ ] Test on iOS Safari (manual install)
- [ ] Check service worker registers
- [ ] Verify manifest loads
- [ ] Check browser console for errors
- [ ] Use debug page to verify all checks

### Real Device Testing:
- [ ] Android Chrome (latest)
- [ ] iOS Safari (latest)
- [ ] Desktop Chrome
- [ ] Desktop Edge
- [ ] Desktop Firefox (limited PWA support)

---

## Troubleshooting Quick Reference

### Notifications Not Working:
1. Check VAPID keys in `.env.local`
2. Verify service worker is registered
3. Check browser permissions
4. Look at browser console errors
5. Visit `/debug-pwa` for diagnostics

### Install Button Missing:
1. Ensure using HTTPS (or localhost)
2. Check manifest is accessible
3. Verify icons exist
4. Check service worker is registered
5. Try incognito mode
6. Visit `/debug-pwa` for diagnostics

### Service Worker Issues:
1. Unregister SW (use debug page)
2. Clear browser cache
3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
4. Check `/sw.js` is accessible
5. Look for console errors

### iOS Specific:
1. Must use HTTPS (localhost won't work)
2. No automatic install prompt
3. Show manual instructions instead
4. Notifications only work when installed
5. Test on real device, not simulator

---

## Success Criteria

### Notifications:
- ✅ Enable button works without errors
- ✅ Success message appears
- ✅ Browser shows permission granted
- ✅ Push subscription saved to database
- ✅ Debug page shows all green checks

### PWA Install:
- ✅ Install prompt appears (or manual instructions on iOS)
- ✅ App installs successfully
- ✅ Opens in standalone mode
- ✅ Icons display correctly
- ✅ Manifest is valid
- ✅ Service worker is active

---

## Need Help?

1. **Check browser console** for specific errors
2. **Visit `/debug-pwa`** to diagnose issues
3. **Read `PWA_TROUBLESHOOTING.md`** for detailed solutions
4. **Download debug info** from debug page
5. **Test in incognito mode** for clean state

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Generate new VAPID keys
npx web-push generate-vapid-keys

# Check environment variables
cat .env.local | grep VAPID

# Verify files exist
ls -la public/sw.js public/manifest.json public/icons/

# Test manifest
curl http://localhost:3000/manifest.json | jq

# Build for production
npm run build

# Start production server
npm start
```

---

## Summary

The fixes address:
1. ✅ Notification enable errors
2. ✅ Missing install button
3. ✅ Better error messages
4. ✅ Improved debugging tools
5. ✅ Comprehensive documentation

Test thoroughly on multiple browsers and devices before marking as complete!
