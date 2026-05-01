# HabitFlow - Cron Jobs Setup Guide

## 🎯 Quick Reference

Your HabitFlow app requires **3 scheduled tasks** to function fully. This guide shows you exactly how to set them up on Synology NAS.

---

## 📋 Prerequisites

1. ✅ Docker container running on port 3847
2. ✅ `CRON_SECRET` configured in `.env.local`
3. ✅ Container accessible via `http://localhost:3847`

---

## 🔧 Synology Task Scheduler Setup

### Step 1: Open Task Scheduler

1. Open **Control Panel**
2. Click **Task Scheduler**
3. Click **Create** → **Scheduled Task** → **User-defined script**

---

### Task 1: Push Notifications (Every Minute)

**Purpose:** Sends habit reminders at the scheduled time

#### Settings:
- **General Tab:**
  - Task: `HabitFlow - Push Notifications`
  - User: `root` (or your admin user)
  - Enabled: ✅

- **Schedule Tab:**
  - Run on the following days: **Daily**
  - First run time: `00:00`
  - Frequency: **Every 1 minute**
  - Last run time: `23:59`

- **Task Settings Tab:**
  - Send run details by email: ❌ (optional)
  - User-defined script:
```bash
curl -X POST http://localhost:3847/api/notifications/send \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json" \
  >> /volume1/docker/habitflow/logs/push-notifications.log 2>&1
```

**Replace `YOUR_CRON_SECRET_HERE` with your actual CRON_SECRET from `.env.local`**

---

### Task 2: Streak Risk Emails (Daily at 8 PM)

**Purpose:** Alerts users if they haven't completed their habits today

#### Settings:
- **General Tab:**
  - Task: `HabitFlow - Streak Risk Emails`
  - User: `root` (or your admin user)
  - Enabled: ✅

- **Schedule Tab:**
  - Run on the following days: **Daily**
  - Time: `20:00` (8:00 PM)

- **Task Settings Tab:**
  - User-defined script:
```bash
curl -X POST http://localhost:3847/api/emails/streak-risk \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json" \
  >> /volume1/docker/habitflow/logs/streak-risk.log 2>&1
```

**Replace `YOUR_CRON_SECRET_HERE` with your actual CRON_SECRET from `.env.local`**

---

### Task 3: Weekly Digest (Sunday at 9 AM)

**Purpose:** Sends weekly summary emails to users

#### Settings:
- **General Tab:**
  - Task: `HabitFlow - Weekly Digest`
  - User: `root` (or your admin user)
  - Enabled: ✅

- **Schedule Tab:**
  - Run on the following days: **Sunday**
  - Time: `09:00` (9:00 AM)

- **Task Settings Tab:**
  - User-defined script:
```bash
curl -X POST http://localhost:3847/api/emails/weekly-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json" \
  >> /volume1/docker/habitflow/logs/weekly-digest.log 2>&1
```

**Replace `YOUR_CRON_SECRET_HERE` with your actual CRON_SECRET from `.env.local`**

---

## 📝 Create Log Directory

Before running the tasks, create a log directory:

```bash
# SSH into your Synology NAS
ssh admin@your-nas-ip

# Create logs directory
mkdir -p /volume1/docker/habitflow/logs
chmod 755 /volume1/docker/habitflow/logs
```

---

## ✅ Verify Setup

### 1. Check Task Scheduler

After creating all 3 tasks, you should see:

| Task Name | Status | Next Run Time |
|-----------|--------|---------------|
| HabitFlow - Push Notifications | Enabled | Every minute |
| HabitFlow - Streak Risk Emails | Enabled | Today at 20:00 |
| HabitFlow - Weekly Digest | Enabled | Next Sunday at 09:00 |

### 2. Test Manually

You can test each task by:
1. Select the task in Task Scheduler
2. Click **Action** → **Run**
3. Wait a few seconds
4. Click **Action** → **View Result**

### 3. Check Logs

```bash
# SSH into your NAS
ssh admin@your-nas-ip

# View push notifications log
tail -f /volume1/docker/habitflow/logs/push-notifications.log

# View streak risk log
tail -f /volume1/docker/habitflow/logs/streak-risk.log

# View weekly digest log
tail -f /volume1/docker/habitflow/logs/weekly-digest.log
```

### 4. Expected Responses

**Push Notifications:**
```json
{"success":true,"sent":0,"message":"No habits to notify"}
```
*Note: `sent:0` is normal if no habits have reminders at the current time*

**Streak Risk Emails:**
```json
{"success":true,"sent":0}
```
*Note: `sent:0` is normal if no users have incomplete habits*

**Weekly Digest:**
```json
{"success":true,"sent":0}
```
*Note: `sent:0` is normal if no users have weekly digest enabled*

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" error

**Cause:** CRON_SECRET doesn't match

**Solution:**
1. Check your `.env.local` file for the correct CRON_SECRET
2. Update the Task Scheduler scripts with the correct secret
3. Make sure there are no extra spaces or quotes

### Issue: "Connection refused"

**Cause:** Docker container not running or not accessible

**Solution:**
```bash
# Check if container is running
docker ps | grep habitflow

# Check if port is accessible
curl http://localhost:3847/api/health

# Check container logs
docker-compose logs habitflow
```

### Issue: Task not running

**Cause:** Task disabled or schedule incorrect

**Solution:**
1. Open Task Scheduler
2. Select the task
3. Click **Edit**
4. Verify **Enabled** is checked
5. Verify schedule settings
6. Click **OK** to save

### Issue: No logs being created

**Cause:** Log directory doesn't exist or no permissions

**Solution:**
```bash
# Create log directory
mkdir -p /volume1/docker/habitflow/logs

# Set permissions
chmod 755 /volume1/docker/habitflow/logs

# Test write access
echo "test" > /volume1/docker/habitflow/logs/test.log
```

---

## 📊 Monitoring

### View Task History

1. Open **Task Scheduler**
2. Select a task
3. Click **Action** → **View Result**
4. Check the **Run result** column

### Monitor Logs in Real-Time

```bash
# SSH into your NAS
ssh admin@your-nas-ip

# Watch all logs
tail -f /volume1/docker/habitflow/logs/*.log
```

### Check for Errors

```bash
# Search for errors in logs
grep -i error /volume1/docker/habitflow/logs/*.log

# Check last 24 hours of push notifications
grep "$(date +%Y-%m-%d)" /volume1/docker/habitflow/logs/push-notifications.log
```

---

## 🔄 Maintenance

### Rotate Logs (Prevent Disk Fill)

Add a 4th task to rotate logs weekly:

**Task Name:** `HabitFlow - Rotate Logs`
**Schedule:** Weekly on Monday at 00:00
**Script:**
```bash
#!/bin/bash
LOG_DIR="/volume1/docker/habitflow/logs"
ARCHIVE_DIR="$LOG_DIR/archive"

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Archive old logs
cd "$LOG_DIR"
for log in *.log; do
  if [ -f "$log" ]; then
    gzip -c "$log" > "$ARCHIVE_DIR/$log.$(date +%Y%m%d).gz"
    > "$log"  # Clear the log file
  fi
done

# Delete archives older than 30 days
find "$ARCHIVE_DIR" -name "*.gz" -mtime +30 -delete
```

---

## 🎯 Quick Copy-Paste Scripts

### All 3 Tasks in One Script

If you prefer to set up via SSH instead of GUI:

```bash
#!/bin/bash

# Variables
CRON_SECRET="your-cron-secret-here"
APP_URL="http://localhost:3847"
LOG_DIR="/volume1/docker/habitflow/logs"

# Create log directory
mkdir -p "$LOG_DIR"

# Task 1: Push Notifications (every minute)
echo "* * * * * curl -X POST $APP_URL/api/notifications/send -H 'Authorization: Bearer $CRON_SECRET' -H 'Content-Type: application/json' >> $LOG_DIR/push-notifications.log 2>&1" | crontab -

# Task 2: Streak Risk Emails (daily at 8 PM)
echo "0 20 * * * curl -X POST $APP_URL/api/emails/streak-risk -H 'Authorization: Bearer $CRON_SECRET' -H 'Content-Type: application/json' >> $LOG_DIR/streak-risk.log 2>&1" | crontab -

# Task 3: Weekly Digest (Sunday at 9 AM)
echo "0 9 * * 0 curl -X POST $APP_URL/api/emails/weekly-digest -H 'Authorization: Bearer $CRON_SECRET' -H 'Content-Type: application/json' >> $LOG_DIR/weekly-digest.log 2>&1" | crontab -

echo "Cron jobs installed successfully!"
```

**Note:** This uses system cron instead of Synology Task Scheduler. Task Scheduler is recommended for easier management.

---

## 📞 Need Help?

### Check These First:
1. ✅ Docker container is running: `docker ps`
2. ✅ Health endpoint works: `curl http://localhost:3847/api/health`
3. ✅ CRON_SECRET is correct in `.env.local`
4. ✅ Tasks are enabled in Task Scheduler
5. ✅ Log directory exists and is writable

### Still Having Issues?

Check the logs:
```bash
# Container logs
docker-compose logs -f habitflow

# Cron logs
tail -f /volume1/docker/habitflow/logs/*.log

# System logs
cat /var/log/messages | grep habitflow
```

---

## ✅ Success Checklist

After setup, verify:

- [ ] All 3 tasks created in Task Scheduler
- [ ] All tasks are **Enabled**
- [ ] CRON_SECRET matches in all scripts
- [ ] Log directory exists: `/volume1/docker/habitflow/logs`
- [ ] Tested each task manually (Action → Run)
- [ ] Checked logs for successful responses
- [ ] Push notifications task runs every minute
- [ ] Streak risk task scheduled for 8 PM daily
- [ ] Weekly digest task scheduled for Sunday 9 AM

---

**Setup Time:** ~10 minutes

**Maintenance:** Check logs weekly, rotate logs monthly

**Status:** Production-ready ✅
