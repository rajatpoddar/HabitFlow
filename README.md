# HabitFlow — Production SaaS Platform

A production-ready habit tracking SaaS built with Next.js 14, Supabase, and Zustand.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS (Emerald Canopy design system) |
| State | Zustand |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Validation | Zod |
| Charts | Recharts |
| Animations | Framer Motion |
| Testing | Jest + React Testing Library |

---

## Features

- **Habit Tracking** — Good habits to build, bad habits to break
- **Analytics** — Weekly charts, heatmaps, streaks, completion rates
- **AI Insights** — Statistical analysis of your habit patterns
- **Daily Journal** — 3-prompt structured journaling
- **Push Notifications** — Web push reminders for habits (works when tab is closed)
- **Email System** — Welcome emails, streak alerts, weekly digests, milestone celebrations
- **Onboarding Flow** — 4-step guided setup for new users
- **Habit Templates** — 24+ curated templates across 5 categories
- **Flexible Scheduling** — Daily, weekdays, weekends, custom days, or X times per week
- **Habit Correlations** — Discover which habits you complete together
- **Streak Freeze** — Protect your streaks with freeze tokens
- **Admin Dashboard** — User management, analytics, ban/unban
- **Plan System** — Free (5 habits) / Pro (unlimited) tiers
- **Security** — RLS, JWT, rate limiting, input validation, security headers
- **PWA Support** — Install as a mobile app

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd habitflow
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials (see `.env.example` for all variables).

### 3. Set up the database

Run migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/001_habitflow_schema.sql`
2. `supabase/migrations/002_enhancements.sql`
3. `supabase/migrations/003_saas_upgrade.sql`
4. `supabase/migrations/004_security_fixes.sql`
5. `supabase/migrations/005_performance.sql`
6. `supabase/migrations/006_push_notifications.sql`

### 4. Generate VAPID keys for push notifications

```bash
npx web-push generate-vapid-keys
```

Add the keys to your `.env.local` file.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel + Supabase)

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run all 3 migration files in order
3. Copy your **Project URL** and **anon key** from Settings → API
4. Copy your **service_role key** (keep this secret — server-side only)

### Vercel Deployment

1. Push your code to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

4. Deploy — Vercel auto-detects Next.js

### Making a User an Admin

Run this in the Supabase SQL Editor (replace the email):

```sql
UPDATE public.user_profiles
SET plan = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com'
);
```

---

## Project Structure

```
src/
├── app/
│   ├── (pages)/          # Next.js App Router pages
│   ├── admin/            # Admin dashboard
│   ├── api/              # API route handlers
│   │   ├── auth/         # Login, signup, logout
│   │   ├── habits/       # Habit CRUD with plan limits
│   │   ├── insights/     # AI insights generation
│   │   └── admin/        # Admin-only endpoints
│   └── globals.css
├── components/
│   ├── habits/           # Habit-specific components
│   ├── insights/         # AI insights panel
│   ├── providers/        # React Query provider
│   └── ui/               # Reusable UI components
├── lib/
│   ├── api/              # Supabase data layer
│   ├── rate-limit.ts     # In-memory rate limiting
│   ├── supabase.ts       # Client-side Supabase
│   ├── supabase-server.ts # Server-side Supabase
│   └── validations.ts    # Zod schemas
├── middleware.ts          # Auth + admin route protection
├── store/
│   └── useStore.ts       # Zustand global state
└── types/
    └── index.ts          # TypeScript types
```

---

## Security

- **Row Level Security (RLS)** — All tables enforce user-scoped access
- **Middleware** — Server-side route protection for all protected pages
- **Rate Limiting** — Auth endpoints: 5 req/min, API: 60 req/min
- **Input Validation** — Zod schemas on all user inputs
- **Security Headers** — HSTS, X-Frame-Options, CSP, etc.
- **Admin Guard** — Admin routes check `user_profiles.plan = 'admin'`
- **Banned User Guard** — Banned users are redirected on every request

---

## Plan Limits

| Feature | Free | Pro |
|---------|------|-----|
| Habits | 5 | Unlimited |
| Analytics | Basic | Advanced |
| AI Insights | ✓ | ✓ |
| Journal | ✓ | ✓ |
| Alarms | ✓ | ✓ |

---

## Running Tests

```bash
npm run test          # Run all tests once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

---

## Sprint 2 Setup

### Push Notifications

1. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Add to `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:support@habitflow.app
```

### Email System (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Add to `.env.local`:
```
RESEND_API_KEY=re_...
EMAIL_FROM=HabitFlow <hello@habitflow.app>
```

### Rate Limiting (Upstash Redis)

1. Sign up at [console.upstash.com](https://console.upstash.com)
2. Create a Redis database and add to `.env.local`:
```
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### Cron Jobs

Set `CRON_SECRET` in `.env.local` to protect cron endpoints.

---

## Environment Variables

See `.env.example` for the full list with descriptions.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `OPENAI_API_KEY` — Enhanced AI insights with GPT-4o-mini
- `STRIPE_SECRET_KEY` — Monetization (structure ready)
- `NEXT_PUBLIC_SENTRY_DSN` — Error monitoring


---

## 📱 PWA & Notifications

### Install as App

**Desktop (Chrome/Edge):**
- Click "Install App" button on landing page
- Or click install icon in address bar

**Android:**
- Click "Install App" button or banner
- Or use Chrome menu → "Install app"

**iOS:**
- Tap Share button in Safari
- Tap "Add to Home Screen"
- Tap "Add"

### Push Notifications Setup

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
   VAPID_PRIVATE_KEY=your-private-key
   VAPID_SUBJECT=mailto:support@habitflow.app
   ```

3. Rebuild Docker container:
   ```bash
   ./deploy.sh
   ```

### Debugging

Visit `/debug-pwa` to check:
- ✅ HTTPS status
- ✅ Service worker registration
- ✅ VAPID key configuration
- ✅ Notification permissions
- ✅ Manifest validity

---

## 🚀 Production Deployment

### Using Docker (Recommended)

```bash
# 1. Configure environment
cp .env.example .env.local
# Edit .env.local with your production values

# 2. Deploy
./deploy.sh

# Or manually:
sudo docker-compose up -d --build
```

### Environment Variables

Required for production:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@your-domain.com
```

### Reverse Proxy (Synology NAS)

Configure reverse proxy to forward:
- HTTPS (443) → HTTP (3847)
- Enable HSTS
- Add custom headers for X-Forwarded-For, X-Real-IP

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment on Synology NAS
- **[PWA Troubleshooting](PWA_TROUBLESHOOTING.md)** - Fix PWA and notification issues
- **[Testing Guide](TESTING_GUIDE.md)** - Step-by-step testing procedures
- **[Fixes Summary](FIXES_COMPLETE_SUMMARY.md)** - Recent fixes and improvements

---

## 🐛 Common Issues

### Notifications Not Working
1. Check VAPID keys are in `.env.local`
2. Rebuild Docker container: `./deploy.sh`
3. Visit `/debug-pwa` to verify configuration
4. On iOS: Must install to home screen first

### Install Button Not Showing
1. Ensure HTTPS is enabled
2. Check service worker is registered
3. Visit `/debug-pwa` for diagnostics
4. On iOS: No automatic prompt (manual install only)

### Docker Issues
```bash
# View logs
sudo docker-compose logs -f

# Check environment
sudo docker exec habitflow_app env | grep VAPID

# Restart
sudo docker-compose restart

# Rebuild
sudo docker-compose down
sudo docker-compose up -d --build
```

---

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Lint code
npm run test             # Run tests

# Docker
./deploy.sh              # Deploy with build
./deploy.sh --no-build   # Deploy without build
sudo docker-compose logs -f    # View logs
sudo docker-compose restart    # Restart
sudo docker-compose down       # Stop

# Database
npx supabase db push     # Push migrations
npx supabase db reset    # Reset database
```

---

## 📦 Project Structure

```
habitflow/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Dashboard page
│   │   ├── analytics/    # Analytics page
│   │   ├── settings/     # Settings page
│   │   └── debug-pwa/    # PWA debug page
│   ├── components/       # React components
│   │   ├── habits/       # Habit-related components
│   │   ├── notifications/# Notification components
│   │   ├── pwa/          # PWA components
│   │   └── ui/           # UI components
│   ├── lib/              # Utilities and API clients
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript types
│   └── emails/           # Email templates
├── public/
│   ├── icons/            # PWA icons (192px, 512px)
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── supabase/
│   └── migrations/       # Database migrations
├── docker-compose.yml    # Docker configuration
├── Dockerfile            # Docker image
├── deploy.sh             # Deployment script
└── .env.local            # Environment variables
```

---

## 🌐 Live Demo

- **App**: [habit.palojori.in](https://habit.palojori.in)
- **Debug**: [habit.palojori.in/debug-pwa](https://habit.palojori.in/debug-pwa)

---

## 📄 License

MIT License - see LICENSE file for details
