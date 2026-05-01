# Quick Reference Card

## 🚀 Deployment

```bash
# Deploy (with build)
./deploy.sh

# Deploy (without build)
./deploy.sh --no-build

# Manual deployment
sudo docker-compose down
sudo docker-compose up -d --build
```

## 📋 Docker Commands

```bash
# View logs
sudo docker-compose logs -f

# View last 100 lines
sudo docker-compose logs --tail=100

# Check status
sudo docker-compose ps

# Restart
sudo docker-compose restart

# Stop
sudo docker-compose down

# Shell access
sudo docker exec -it habitflow_app sh

# Check environment
sudo docker exec habitflow_app env | grep VAPID
```

## 🔍 Health Checks

```bash
# Local health check
curl http://localhost:3847/api/health

# Production health check
curl https://habit.palojori.in/api/health

# Expected response
{"status":"ok","timestamp":"2026-04-22T..."}
```

## 🐛 Debug URLs

- **Debug Page**: `https://habit.palojori.in/debug-pwa`
- **Manifest**: `https://habit.palojori.in/manifest.json`
- **Service Worker**: `https://habit.palojori.in/sw.js`
- **Health Check**: `https://habit.palojori.in/api/health`

## 🔑 Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://habit.palojori.in
```

### Push Notifications
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:support@habitflow.app
```

### Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

## 🔧 Troubleshooting

### Notifications Not Working
```bash
# 1. Check VAPID keys
sudo docker exec habitflow_app env | grep VAPID

# 2. Rebuild if missing
sudo docker-compose down
sudo docker-compose up -d --build

# 3. Check debug page
open https://habit.palojori.in/debug-pwa
```

### Install Button Not Showing
```bash
# 1. Check HTTPS
curl -I https://habit.palojori.in

# 2. Check manifest
curl https://habit.palojori.in/manifest.json

# 3. Check service worker
curl https://habit.palojori.in/sw.js

# 4. Visit debug page
open https://habit.palojori.in/debug-pwa
```

### Container Won't Start
```bash
# 1. Check logs
sudo docker-compose logs

# 2. Check .env.local exists
ls -la .env.local

# 3. Check port 3847
sudo netstat -tulpn | grep 3847

# 4. Remove and rebuild
sudo docker-compose down
sudo docker system prune -f
sudo docker-compose up -d --build
```

## 📱 PWA Install

### Desktop (Chrome/Edge)
1. Click "Install App" button
2. Or click install icon in address bar

### Android
1. Click "Install App" button
2. Or Chrome menu → "Install app"

### iOS
1. Tap Share button
2. Tap "Add to Home Screen"
3. Tap "Add"

## ✅ Verification Checklist

After deployment:

```bash
# 1. Container running
sudo docker-compose ps

# 2. Health check passes
curl https://habit.palojori.in/api/health

# 3. VAPID keys configured
sudo docker exec habitflow_app env | grep VAPID

# 4. Debug page shows all green
open https://habit.palojori.in/debug-pwa

# 5. Manifest accessible
curl https://habit.palojori.in/manifest.json

# 6. Service worker accessible
curl https://habit.palojori.in/sw.js
```

## 📊 Monitoring

```bash
# Real-time logs
sudo docker-compose logs -f

# Resource usage
sudo docker stats habitflow_app

# Container info
sudo docker inspect habitflow_app

# Network info
sudo docker network inspect habitflow_default
```

## 🔄 Updates

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and deploy
./deploy.sh

# 3. Verify deployment
curl https://habit.palojori.in/api/health
```

## 📚 Documentation

- **Deployment**: `DEPLOYMENT_GUIDE.md`
- **Troubleshooting**: `PWA_TROUBLESHOOTING.md`
- **Testing**: `TESTING_GUIDE.md`
- **Fixes**: `FIXES_COMPLETE_SUMMARY.md`

## 🆘 Emergency Commands

```bash
# Stop everything
sudo docker-compose down

# Remove all containers and images
sudo docker system prune -a -f

# Fresh start
sudo docker-compose up -d --build --force-recreate

# Restore from backup
gunzip -c habitflow-backup.tar.gz | sudo docker load
sudo docker-compose up -d
```

## 📞 Support

1. Check logs: `sudo docker-compose logs -f`
2. Visit debug page: `/debug-pwa`
3. Check browser console
4. Refer to documentation
5. Check environment variables

---

**Quick Links:**
- App: https://habit.palojori.in
- Debug: https://habit.palojori.in/debug-pwa
- Health: https://habit.palojori.in/api/health
