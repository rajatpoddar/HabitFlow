# HabitFlow - Synology NAS Deployment Guide

## 📋 Log Analysis Summary

Your development logs show the app is running successfully with these observations:

### ✅ Working Fine
- Next.js 14.2.3 compiling successfully
- All routes compiling without errors
- API endpoints responding correctly
- Middleware working properly

### ⚠️ Warnings (Non-Critical)
1. **Metadata warnings** - `themeColor` and `viewport` should be moved to `viewport` export
   - This is a Next.js 14 deprecation warning
   - App works fine, but should be fixed for future compatibility
2. **Upstash not configured** - Rate limiting falls back to in-memory mode
   - Works fine for single-server deployment
   - Optional: Configure Upstash Redis for distributed rate limiting

---

## 🐳 Docker Deployment on Synology NAS

### Prerequisites
1. Synology NAS with Docker package installed
2. SSH access to your NAS
3. Supabase project set up (database + auth)
4. Domain name or DynDNS configured (optional but recommended)

---

## 📦 Step 1: Prepare Environment File

Create `.env.local` with all required variables:

```bash
# ── Supabase (REQUIRED) ──────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── App (REQUIRED) ───────────────────────────────────────────────────────────
# Use your NAS IP or domain name
NEXT_PUBLIC_APP_URL=http://192.168.1.100:3847
# Or with domain: https://habitflow.yourdomain.com

# ── Push Notifications (REQUIRED for reminders) ──────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDYFEvpA73vXF7PPOyK4Hq5cPkFF1_-mtC2mj_u_VjrXwkQF0dQg-Sxqy--Gm_7ibqjqPcZ2Hj2yotSXUgRavY4
VAPID_PRIVATE_KEY=your-vapid-private-key-here
VAPID_SUBJECT=mailto:support@habitflow.app

# ── Cron Security (REQUIRED for scheduled tasks) ─────────────────────────────
CRON_SECRET=your-random-secret-here-use-strong-password

# ── Email (OPTIONAL - for welcome emails, digests) ───────────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=HabitFlow <hello@habitflow.app>

# ── OpenAI (OPTIONAL - for enhanced AI insights) ─────────────────────────────
OPENAI_API_KEY=sk-...

# ── Rate Limiting (OPTIONAL - for production scale) ──────────────────────────
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ── Razorpay (OPTIONAL - for payments) ───────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_ID=plan_...
```

---

## 🚀 Step 2: Build and Deploy with Docker Compose

### Option A: Using Docker Compose (Recommended)

1. **SSH into your Synology NAS:**
```bash
ssh admin@your-nas-ip
```

2. **Navigate to your project directory:**
```bash
cd /volume1/docker/habitflow
```

3. **Copy your project files to NAS** (from your Mac):
```bash
# From your Mac terminal
rsync -avz --exclude 'node_modules' --exclude '.next' \
  ~/path/to/Habit-Tracker/ admin@your-nas-ip:/volume1/docker/habitflow/
```

4. **Build and start the container:**
```bash
docker-compose up -d --build
```

5. **Check logs:**
```bash
docker-compose logs -f habitflow
```

### Option B: Using Synology Docker GUI

1. Open **Docker** package in DSM
2. Go to **Image** tab
3. Click **Add** → **Add from File**
4. Build the image first on your Mac:
   ```bash
   docker build -t habitflow:latest .
   docker save habitflow:latest > habitflow.tar
   ```
5. Upload `habitflow.tar` to your NAS
6. Create a container with these settings:
   - **Port**: Local 3847 → Container 3847
   - **Environment**: Add all variables from `.env.local`
   - **Auto-restart**: Yes
   - **Volume** (optional): Mount `/app/.next/cache` for persistence

---

## ⏰ Step 3: Set Up Cron Jobs (CRITICAL)

Your app has **3 scheduled tasks** that need to run automatically:

### 1. **Push Notifications** (Every Minute)
Sends habit reminders at the scheduled time.

### 2. **Streak Risk Emails** (Daily at 8 PM)
Alerts users if they haven't completed habits today.

### 3. **Weekly Digest Emails** (Sunday at 9 AM)
Sends weekly summary to users.

---

### ⚠️ IMPORTANT: Cron Jobs Are NOT Automatic

The Docker container **does NOT include a cron scheduler**. You must set up external cron jobs.

### Setup Methods:

#### Method A: Synology Task Scheduler (Easiest)

1. Open **Control Panel** → **Task Scheduler**
2. Create 3 new tasks:

**Task 1: Push Notifications (Every Minute)**
- **Task**: User-defined script
- **Schedule**: Run on the following days: Daily, Every 1 minute
- **User-defined script**:
```bash
curl -X POST http://localhost:3847/api/notifications/send \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json"
```

**Task 2: Streak Risk Emails (Daily at 8 PM)**
- **Schedule**: Daily at 20:00
- **User-defined script**:
```bash
curl -X POST http://localhost:3847/api/emails/streak-risk \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json"
```

**Task 3: Weekly Digest (Sunday at 9 AM)**
- **Schedule**: Weekly on Sunday at 09:00
- **User-defined script**:
```bash
curl -X POST http://localhost:3847/api/emails/weekly-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json"
```

Replace `YOUR_CRON_SECRET_HERE` with the value from your `.env.local`.

---

#### Method B: External Cron Service (Alternative)

If you want external monitoring, use services like:

1. **Cron-job.org** (Free)
   - Create account at https://cron-job.org
   - Add 3 jobs with URLs:
     - `http://your-nas-ip:3847/api/notifications/send` (every minute)
     - `http://your-nas-ip:3847/api/emails/streak-risk` (daily 8 PM)
     - `http://your-nas-ip:3847/api/emails/weekly-digest` (Sunday 9 AM)
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`

2. **EasyCron** (Free tier available)
3. **GitHub Actions** (if you have a repo)

---

#### Method C: Add Cron to Docker Container (Advanced)

Modify your Dockerfile to include cron:

```dockerfile
# In the runner stage, add:
RUN apk add --no-cache curl

# Create cron file
RUN echo "* * * * * curl -X POST http://localhost:3847/api/notifications/send -H 'Authorization: Bearer ${CRON_SECRET}' >> /var/log/cron.log 2>&1" > /etc/crontabs/root
RUN echo "0 20 * * * curl -X POST http://localhost:3847/api/emails/streak-risk -H 'Authorization: Bearer ${CRON_SECRET}' >> /var/log/cron.log 2>&1" >> /etc/crontabs/root
RUN echo "0 9 * * 0 curl -X POST http://localhost:3847/api/emails/weekly-digest -H 'Authorization: Bearer ${CRON_SECRET}' >> /var/log/cron.log 2>&1" >> /etc/crontabs/root

# Modify CMD to start cron
CMD crond && node server.js
```

---

## 🔒 Step 4: Security Considerations

### 1. **Firewall Rules**
- Open port 3847 only if you need external access
- Use Synology Firewall to restrict access

### 2. **Reverse Proxy (Recommended)**
Set up Nginx reverse proxy in Synology:
- **Control Panel** → **Login Portal** → **Advanced** → **Reverse Proxy**
- Source: `habitflow.yourdomain.com` (HTTPS)
- Destination: `localhost:3847` (HTTP)
- Enable HTTPS with Let's Encrypt certificate

### 3. **HTTPS for Push Notifications**
Push notifications **require HTTPS** in production. Options:
- Use Cloudflare Tunnel (free)
- Use Synology's built-in reverse proxy with Let's Encrypt
- Use Tailscale for secure access

---

## 🧪 Step 5: Verify Deployment

### 1. **Check Health Endpoint**
```bash
curl http://your-nas-ip:3847/api/health
```
Should return: `{"status":"ok"}`

### 2. **Test Cron Endpoints**
```bash
# Test push notifications
curl -X POST http://your-nas-ip:3847/api/notifications/send \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Should return: {"success":true,"sent":0,"message":"No habits to notify"}
```

### 3. **Access the App**
Open browser: `http://your-nas-ip:3847`

---

## 📊 Monitoring

### View Docker Logs
```bash
# Real-time logs
docker-compose logs -f habitflow

# Last 100 lines
docker-compose logs --tail=100 habitflow
```

### Check Container Status
```bash
docker-compose ps
```

### Restart Container
```bash
docker-compose restart habitflow
```

---

## 🔄 Updates and Maintenance

### Update the App
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or without downtime
docker-compose build
docker-compose up -d
```

### Backup Data
Your data is in Supabase (cloud), but backup environment variables:
```bash
cp .env.local .env.local.backup
```

---

## 🐛 Troubleshooting

### Issue: Container won't start
```bash
# Check logs
docker-compose logs habitflow

# Common fixes:
# 1. Check .env.local has all required variables
# 2. Ensure port 3847 is not in use
# 3. Verify Supabase credentials are correct
```

### Issue: Push notifications not working
- Ensure HTTPS is enabled (required for push)
- Check VAPID keys are set correctly
- Verify service worker is registered: Open DevTools → Application → Service Workers

### Issue: Cron jobs not running
- Check Task Scheduler logs in Synology
- Verify CRON_SECRET matches in both .env.local and cron tasks
- Test endpoints manually with curl

### Issue: "Upstash not configured" warnings
- This is normal if you haven't set up Upstash Redis
- App falls back to in-memory rate limiting
- For single-server deployment, this is fine

---

## 📝 Summary Checklist

- [ ] Supabase project created and migrations run
- [ ] `.env.local` configured with all required variables
- [ ] VAPID keys generated for push notifications
- [ ] Docker container built and running
- [ ] Health endpoint responding
- [ ] 3 cron jobs set up in Task Scheduler
- [ ] Cron endpoints tested manually
- [ ] HTTPS configured (for push notifications)
- [ ] Reverse proxy configured (optional)
- [ ] Firewall rules configured

---

## 🎯 Next Steps After Deployment

1. **Create your first user** - Sign up at your app URL
2. **Make yourself admin** - Run SQL in Supabase:
   ```sql
   UPDATE public.user_profiles
   SET plan = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
   ```
3. **Test push notifications** - Create a habit with a reminder
4. **Monitor cron jobs** - Check Task Scheduler logs after first runs
5. **Set up monitoring** - Consider Uptime Robot or similar

---

## 📞 Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs -f`
2. Check Synology Task Scheduler logs
3. Verify Supabase connection in logs
4. Test API endpoints with curl

---

**Deployment Status: Ready for Production** ✅

Your app is production-ready and will run reliably on Synology NAS with proper cron job setup.
