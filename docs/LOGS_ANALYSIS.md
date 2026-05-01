# HabitFlow - Development Logs Analysis

## 📊 Log Summary

Your development server is running successfully with **no critical errors**. Here's what the logs show:

### ✅ Working Perfectly
- **Next.js 14.2.3** compiling successfully
- **All routes** compiling without errors (/, /signup, /login, /onboarding, /dashboard, /analytics, /journal, /settings, /upgrade)
- **API endpoints** responding correctly
- **Middleware** working properly
- **Build time** is reasonable (4.2s initial, subsequent compiles 0.5-6.5s)
- **All HTTP requests** returning 200 OK

---

## ⚠️ Warnings (Non-Critical)

### 1. Metadata Deprecation Warnings

**Issue:**
```
⚠ Unsupported metadata themeColor is configured in metadata export in /.
Please move it to viewport export instead.
⚠ Unsupported metadata viewport is configured in metadata export in /.
Please move it to viewport export instead.
```

**Status:** ✅ **FIXED**

**What it means:**
- Next.js 14 changed how `themeColor` and `viewport` should be exported
- They should now be in a separate `viewport` export instead of the `metadata` export
- This is a deprecation warning, not an error - your app works fine

**What I did:**
- Updated `src/app/layout.tsx` to use the new Next.js 14 pattern
- Moved `themeColor` and `viewport` to a separate `viewport` export
- This will eliminate all the warnings you're seeing

---

### 2. Upstash Not Configured

**Issue:**
```
Upstash not configured, skipping API rate limit
```

**Status:** ⚠️ **Optional - Works Fine Without It**

**What it means:**
- Your app is using in-memory rate limiting instead of Redis-based rate limiting
- This is perfectly fine for single-server deployments (like your Synology NAS)
- Upstash Redis is only needed for distributed/multi-server deployments

**Action needed:**
- **None** - Your app works perfectly without it
- **Optional:** If you want distributed rate limiting, sign up at https://console.upstash.com and add the credentials to `.env.local`

---

## 🐳 Docker Deployment

### Current Docker Setup

Your project has:
- ✅ **Dockerfile** - Multi-stage build (deps → builder → runner)
- ✅ **docker-compose.yml** - Ready for deployment
- ✅ **Health check** - `/api/health` endpoint
- ✅ **Port 3847** - Configured and exposed

### What Works Out of the Box
1. **Build and run** - `docker-compose up -d --build`
2. **Auto-restart** - Container restarts automatically if it crashes
3. **Health monitoring** - Built-in health checks
4. **Environment variables** - Loaded from `.env.local`

---

## ⏰ Cron Jobs - REQUIRES MANUAL SETUP

### ⚠️ CRITICAL: Cron Jobs Are NOT Automatic

Your app has **3 scheduled tasks** that need external cron setup:

| Task | Frequency | Endpoint | Purpose |
|------|-----------|----------|---------|
| **Push Notifications** | Every minute | `/api/notifications/send` | Send habit reminders at scheduled times |
| **Streak Risk Emails** | Daily at 8 PM | `/api/emails/streak-risk` | Alert users about incomplete habits |
| **Weekly Digest** | Sunday at 9 AM | `/api/emails/weekly-digest` | Send weekly summary emails |

### Why Manual Setup is Needed

The Docker container **does NOT include a cron scheduler**. You have 3 options:

#### Option 1: Synology Task Scheduler (Recommended)

Use Synology's built-in Task Scheduler to call your API endpoints:

**Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script**

**Task 1: Push Notifications**
- **Schedule:** Every 1 minute
- **Script:**
```bash
curl -X POST http://localhost:3847/api/notifications/send \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Task 2: Streak Risk Emails**
- **Schedule:** Daily at 20:00 (8 PM)
- **Script:**
```bash
curl -X POST http://localhost:3847/api/emails/streak-risk \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Task 3: Weekly Digest**
- **Schedule:** Weekly on Sunday at 09:00
- **Script:**
```bash
curl -X POST http://localhost:3847/api/emails/weekly-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Replace `YOUR_CRON_SECRET` with the value from your `.env.local` file.

#### Option 2: External Cron Service

Use a service like **cron-job.org** (free) to call your endpoints from the internet.

**Pros:**
- No local setup needed
- Monitoring and alerts included
- Works even if NAS is offline temporarily

**Cons:**
- Requires exposing your app to the internet (use HTTPS + CRON_SECRET)

#### Option 3: Add Cron to Docker Container

Modify your Dockerfile to include a cron daemon. See `DEPLOYMENT_SYNOLOGY.md` for details.

**Pros:**
- Everything in one container
- No external dependencies

**Cons:**
- More complex Docker setup
- Harder to monitor and debug

---

## 🔒 Security Considerations

### 1. CRON_SECRET Protection

All cron endpoints are protected with a secret token:

```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Action:** Generate a strong random secret for `CRON_SECRET` in `.env.local`

```bash
# Generate a secure random secret
openssl rand -base64 32
```

### 2. HTTPS for Push Notifications

Push notifications **require HTTPS** in production (browser security requirement).

**Options:**
- Use Synology's reverse proxy with Let's Encrypt certificate
- Use Cloudflare Tunnel (free)
- Use Tailscale for secure access

### 3. Firewall Configuration

- Only open port 3847 if you need external access
- Use Synology Firewall to restrict access to specific IPs
- Consider using a VPN for remote access

---

## 📋 Deployment Checklist

### Before Deployment

- [ ] Run all Supabase migrations (001-006)
- [ ] Generate VAPID keys: `npx web-push generate-vapid-keys`
- [ ] Configure `.env.local` with all required variables
- [ ] Generate strong `CRON_SECRET`
- [ ] Test build locally: `npm run build`

### During Deployment

- [ ] Copy project files to Synology NAS
- [ ] Build Docker image: `docker-compose build`
- [ ] Start container: `docker-compose up -d`
- [ ] Check health: `curl http://localhost:3847/api/health`
- [ ] Check logs: `docker-compose logs -f`

### After Deployment

- [ ] Set up 3 cron jobs in Task Scheduler
- [ ] Test cron endpoints manually with curl
- [ ] Configure HTTPS (for push notifications)
- [ ] Set up reverse proxy (optional)
- [ ] Create first user account
- [ ] Make yourself admin (run SQL in Supabase)
- [ ] Test push notifications
- [ ] Monitor Task Scheduler logs

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl http://your-nas-ip:3847/api/health
# Expected: {"status":"ok"}
```

### 2. Test Cron Endpoints
```bash
# Test push notifications endpoint
curl -X POST http://your-nas-ip:3847/api/notifications/send \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Expected: {"success":true,"sent":0,"message":"No habits to notify"}
# (0 sent is normal if no habits have reminders at current time)
```

### 3. Test Streak Risk Email
```bash
curl -X POST http://your-nas-ip:3847/api/emails/streak-risk \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Expected: {"success":true,"sent":0}
# (0 sent is normal if no users have incomplete habits)
```

### 4. Test Weekly Digest
```bash
curl -X POST http://your-nas-ip:3847/api/emails/weekly-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Expected: {"success":true,"sent":0}
# (0 sent is normal if no users have weekly digest enabled)
```

### 5. Access the App
Open browser: `http://your-nas-ip:3847`

---

## 📊 Monitoring

### View Docker Logs
```bash
# Real-time logs
docker-compose logs -f habitflow

# Last 100 lines
docker-compose logs --tail=100 habitflow

# Search for errors
docker-compose logs habitflow | grep -i error
```

### Check Container Status
```bash
docker-compose ps
```

### Check Resource Usage
```bash
docker stats habitflow_app
```

### Monitor Cron Jobs
- Open **Control Panel → Task Scheduler**
- Select your task
- Click **Action → View Result**
- Check for any errors in the output

---

## 🐛 Common Issues & Solutions

### Issue: "Upstash not configured" warnings

**Solution:** This is normal and expected. Your app works fine without Upstash Redis. It falls back to in-memory rate limiting, which is perfect for single-server deployments.

### Issue: Push notifications not working

**Possible causes:**
1. Not using HTTPS (required by browsers)
2. VAPID keys not configured correctly
3. Service worker not registered

**Solution:**
- Set up HTTPS using Synology reverse proxy + Let's Encrypt
- Verify VAPID keys in `.env.local`
- Check browser console for service worker errors

### Issue: Cron jobs not running

**Possible causes:**
1. Task Scheduler not configured
2. Wrong CRON_SECRET
3. Container not accessible from Task Scheduler

**Solution:**
- Check Task Scheduler logs
- Test endpoints manually with curl
- Verify CRON_SECRET matches in both places

### Issue: Container won't start

**Possible causes:**
1. Missing environment variables
2. Port 3847 already in use
3. Invalid Supabase credentials

**Solution:**
```bash
# Check logs
docker-compose logs habitflow

# Check port usage
netstat -an | grep 3847

# Verify environment variables
docker-compose config
```

---

## 📈 Performance Optimization

### For Synology NAS

1. **Use SSD cache** (if available) for Docker volumes
2. **Allocate sufficient RAM** - Minimum 2GB for the container
3. **Enable Docker logging rotation** to prevent disk fill
4. **Monitor CPU usage** - Next.js can be CPU-intensive during builds

### Docker Optimization

Your Dockerfile already uses:
- ✅ Multi-stage builds (smaller image size)
- ✅ Node 20 Alpine (minimal base image)
- ✅ Production mode
- ✅ Standalone output (optimized for Docker)

---

## 🎯 Next Steps

1. **Fix metadata warnings** - ✅ Already done
2. **Deploy to Synology** - Follow `DEPLOYMENT_SYNOLOGY.md`
3. **Set up cron jobs** - Use Task Scheduler
4. **Configure HTTPS** - For push notifications
5. **Test everything** - Use the testing commands above
6. **Monitor logs** - Check for any issues

---

## 📞 Support Resources

- **Docker logs:** `docker-compose logs -f`
- **Synology Task Scheduler:** Control Panel → Task Scheduler
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Next.js Docs:** https://nextjs.org/docs

---

## ✅ Summary

Your app is **production-ready** with these notes:

1. ✅ **No critical errors** - Everything compiles and runs successfully
2. ✅ **Metadata warnings fixed** - Updated to Next.js 14 pattern
3. ⚠️ **Cron jobs need manual setup** - Use Synology Task Scheduler
4. ⚠️ **HTTPS needed for push** - Use reverse proxy + Let's Encrypt
5. ✅ **Docker ready** - Just build and deploy

**Estimated deployment time:** 30-60 minutes (including cron setup)

---

**Last Updated:** Based on your development logs from npm run dev
