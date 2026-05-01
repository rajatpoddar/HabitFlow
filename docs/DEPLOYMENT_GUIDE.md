# HabitFlow Deployment Guide

## Production Deployment on Synology NAS

### Prerequisites
- Docker and Docker Compose installed on Synology NAS
- Domain configured (e.g., `habit.palojori.in`)
- SSL certificate configured (via reverse proxy)
- Supabase project created

---

## Step 1: Prepare Environment Variables

Create or update `.env.local` on your NAS with production values:

```bash
# ── Supabase (required) ──────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ── App ───────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://habit.palojori.in

# ── Push Notifications ────────────────────────────────────────────────────────
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:support@habitflow.app

# ── Cron Security ─────────────────────────────────────────────────────────────
CRON_SECRET=your-random-secret

# ── Email (Resend) ────────────────────────────────────────────────────────────
RESEND_API_KEY=your-resend-key

# ── Razorpay (optional) ───────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_ID=plan_...
```

---

## Step 2: Build and Deploy

### Option A: Using docker-compose (Recommended)

The `docker-compose.yml` now automatically reads `.env.local`:

```bash
# Build and start
sudo docker-compose up -d --build

# View logs
sudo docker-compose logs -f

# Stop
sudo docker-compose down

# Restart
sudo docker-compose restart
```

### Option B: Manual Docker Commands

```bash
# Build image
sudo docker build -t habitflow:latest .

# Run container
sudo docker run -d \
  --name habitflow_app \
  --restart unless-stopped \
  -p 3847:3847 \
  --env-file .env.local \
  habitflow:latest

# View logs
sudo docker logs -f habitflow_app

# Stop
sudo docker stop habitflow_app
sudo docker rm habitflow_app
```

---

## Step 3: Configure Reverse Proxy

### Synology DSM Reverse Proxy Settings:

1. **Control Panel** → **Application Portal** → **Reverse Proxy**
2. Click **Create**
3. Configure:
   - **Description**: HabitFlow
   - **Source**:
     - Protocol: HTTPS
     - Hostname: `habit.palojori.in`
     - Port: 443
     - Enable HSTS: ✓
   - **Destination**:
     - Protocol: HTTP
     - Hostname: localhost
     - Port: 3847

4. **Custom Headers** (Advanced):
   ```
   X-Forwarded-For $proxy_add_x_forwarded_for
   X-Forwarded-Proto $scheme
   X-Real-IP $remote_addr
   ```

---

## Step 4: Verify Deployment

### Health Check
```bash
curl https://habit.palojori.in/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-04-22T..."}
```

### PWA Debug Page
Visit: `https://habit.palojori.in/debug-pwa`

Check that all indicators are green (✅):
- HTTPS Enabled
- Service Worker Registered
- VAPID Key Configured
- Manifest Accessible
- Icons Found

---

## Step 5: Database Setup

Ensure Supabase tables exist:

```sql
-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## Troubleshooting

### Issue: VAPID Keys Not Working

**Symptom**: Debug page shows `vapidKeyConfigured: false`

**Solution**:
1. Verify `.env.local` has `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
2. Rebuild Docker image:
   ```bash
   sudo docker-compose down
   sudo docker-compose up -d --build
   ```
3. Check container environment:
   ```bash
   sudo docker exec habitflow_app env | grep VAPID
   ```

### Issue: Install Button Not Showing

**Symptom**: No install prompt on mobile/desktop

**Solution**:
1. Ensure HTTPS is enabled (check reverse proxy)
2. Visit `/debug-pwa` to check manifest and service worker
3. On Android: Visit site twice with 5 minutes between visits
4. On iOS: Manual install only (Share → Add to Home Screen)

### Issue: Notifications Not Working

**Symptom**: "Failed to enable notifications" error

**Solution**:
1. Check VAPID keys are configured
2. Verify `push_subscriptions` table exists
3. Check browser console for errors
4. Visit `/debug-pwa` for diagnostics

### Issue: Docker Container Won't Start

**Symptom**: Container exits immediately

**Solution**:
1. Check logs:
   ```bash
   sudo docker-compose logs
   ```
2. Verify `.env.local` exists and has required variables
3. Check port 3847 is not in use:
   ```bash
   sudo netstat -tulpn | grep 3847
   ```

---

## Updating the App

### Pull Latest Changes
```bash
cd /path/to/habitflow
git pull origin main
```

### Rebuild and Deploy
```bash
sudo docker-compose down
sudo docker-compose up -d --build
```

### Zero-Downtime Update (Advanced)
```bash
# Build new image
sudo docker-compose build

# Start new container
sudo docker-compose up -d --no-deps --build habitflow

# Old container is automatically replaced
```

---

## Monitoring

### View Logs
```bash
# Real-time logs
sudo docker-compose logs -f

# Last 100 lines
sudo docker-compose logs --tail=100

# Specific service
sudo docker-compose logs -f habitflow
```

### Container Status
```bash
# Check if running
sudo docker-compose ps

# Resource usage
sudo docker stats habitflow_app
```

### Health Checks
```bash
# Manual health check
curl https://habit.palojori.in/api/health

# Check from inside container
sudo docker exec habitflow_app wget -qO- http://localhost:3847/api/health
```

---

## Backup

### Backup Environment Variables
```bash
cp .env.local .env.local.backup
```

### Backup Docker Image
```bash
sudo docker save habitflow:latest | gzip > habitflow-backup.tar.gz
```

### Restore from Backup
```bash
gunzip -c habitflow-backup.tar.gz | sudo docker load
```

---

## Security Checklist

- [ ] HTTPS enabled via reverse proxy
- [ ] `.env.local` has strong secrets
- [ ] `CRON_SECRET` is random and secure
- [ ] Supabase RLS policies enabled
- [ ] Service role key never exposed to client
- [ ] VAPID keys are production keys (not dev)
- [ ] Firewall allows only necessary ports
- [ ] Regular security updates applied

---

## Performance Optimization

### Enable Gzip Compression
Add to reverse proxy custom headers:
```
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### Enable Caching
Add to reverse proxy:
```
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Support

If you encounter issues:

1. **Check logs**: `sudo docker-compose logs -f`
2. **Visit debug page**: `https://habit.palojori.in/debug-pwa`
3. **Check browser console** for client-side errors
4. **Verify environment variables** are set correctly
5. **Refer to troubleshooting guides**:
   - `PWA_TROUBLESHOOTING.md`
   - `TESTING_GUIDE.md`

---

## Quick Reference

```bash
# Start
sudo docker-compose up -d

# Stop
sudo docker-compose down

# Restart
sudo docker-compose restart

# Rebuild
sudo docker-compose up -d --build

# Logs
sudo docker-compose logs -f

# Shell access
sudo docker exec -it habitflow_app sh

# Health check
curl https://habit.palojori.in/api/health
```

---

## Production Checklist

Before going live:

- [ ] `.env.local` configured with production values
- [ ] HTTPS enabled and working
- [ ] Domain DNS configured correctly
- [ ] Reverse proxy configured
- [ ] Docker container running
- [ ] Health check passes
- [ ] PWA debug page shows all green
- [ ] Test notifications on real device
- [ ] Test PWA install on Android/iOS
- [ ] Database tables created
- [ ] RLS policies enabled
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

## Notes

- The app runs on port **3847** inside the container
- Reverse proxy should forward HTTPS (443) → HTTP (3847)
- `.env.local` is automatically loaded by docker-compose
- VAPID keys must be configured for notifications to work
- iOS requires manual "Add to Home Screen" (no automatic prompt)
- Service worker requires HTTPS (except localhost)
