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
- **Wake-up Alarms** — Browser-based alarm scheduling
- **Admin Dashboard** — User management, analytics, ban/unban
- **Plan System** — Free (5 habits) / Pro (unlimited) tiers
- **Security** — RLS, JWT, rate limiting, input validation, security headers

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

### 4. Run locally

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
