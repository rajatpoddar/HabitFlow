# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code

# Testing
npm run test             # Run all tests once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report

# Docker (Production)
./deploy.sh              # Deploy with build
./deploy.sh --no-build   # Deploy without build
sudo docker-compose logs -f    # View logs
sudo docker-compose restart    # Restart
sudo docker-compose down       # Stop

# Database
npx supabase db push     # Push migrations
npx supabase db reset    # Reset database

# VAPID Keys for Push Notifications
npx web-push generate-vapid-keys
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS (Emerald Canopy design system)
- **State**: Zustand for global state
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Validation**: Zod schemas
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Testing**: Jest + React Testing Library
- **Deployment**: Docker on Synology NAS

### Key Architectural Patterns

**Three-Layer Data Access:**
1. **API Routes** (`src/app/api/*/route.ts`) - HTTP endpoints with validation and rate limiting
2. **Data Layer** (`src/lib/api/*.ts`) - Supabase queries and business logic
3. **Client** (`src/lib/supabase.ts`) - Browser Supabase client

**Authentication Flow:**
- Middleware (`src/middleware.ts`) handles route protection and session refresh
- Server-side: `src/lib/supabase-server.ts` for API routes
- Client-side: `src/lib/supabase.ts` for components
- All protected routes check auth status and redirect unauthenticated users

**State Management:**
- Zustand store (`src/store/useStore.ts`) for global UI state
- React Query for server state caching
- Local component state for ephemeral UI

**Validation:**
- Zod schemas in `src/lib/validations.ts` for all user inputs
- API routes validate before processing
- Type-safe with inferred TypeScript types

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (pages)/           # Public pages (landing, login, signup)
│   ├── dashboard/         # Protected dashboard
│   ├── analytics/         # Analytics page
│   ├── journal/           # Journal page
│   ├── settings/          # Settings page
│   ├── admin/             # Admin dashboard (admin only)
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── habits/        # Habit CRUD
│   │   ├── insights/      # AI insights generation
│   │   ├── notifications/ # Push notification management
│   │   ├── emails/        # Email triggers
│   │   └── admin/         # Admin-only endpoints
│   └── debug-pwa/         # PWA debugging page
├── components/            # React components
│   ├── habits/           # Habit-specific components
│   ├── insights/         # AI insights panel
│   ├── notifications/    # Notification components
│   ├── pwa/              # PWA install components
│   ├── ui/               # Reusable UI components
│   └── providers/        # React Query provider
├── lib/                  # Utilities
│   ├── api/              # Data layer (Supabase queries)
│   ├── supabase.ts       # Client Supabase client
│   ├── supabase-server.ts # Server Supabase client
│   ├── validations.ts    # Zod schemas
│   ├── rate-limit.ts     # Rate limiting
│   ├── notifications.ts  # Notification helpers
│   ├── push-notifications.ts # Web push logic
│   └── email.ts          # Email sending (Resend)
├── hooks/                # Custom React hooks
├── store/                # Zustand state management
├── types/                # TypeScript types
├── emails/               # Email templates (React Email)
└── __tests__/            # Test files
```

## Database Schema

### Core Tables
- **habits**: User habits with scheduling (daily, weekdays, weekends, custom)
- **habit_logs**: Daily habit completions (status: done/missed, count for bad habits)
- **journal_entries**: Daily journal entries (good, bad, journal text)
- **alarms**: User alarms
- **user_profiles**: User metadata (plan, is_banned, onboarding_completed)
- **push_subscriptions**: Web push notification subscriptions
- **ai_insights**: Generated AI insights

### Key Relationships
- All user-scoped tables reference `auth.users(id)` with CASCADE delete
- RLS policies enforce `auth.uid() = user_id` for all user data
- `habit_logs` references `habits` with CASCADE delete

### Important Constraints
- `habit_logs` has unique constraint on `(habit_id, date)` - one log per habit per day
- `journal_entries` has unique constraint on `(user_id, date)` - one entry per day
- All tables have `updated_at` trigger for automatic timestamp updates

## Security Model

### Row Level Security (RLS)
- All tables enforce user-scoped access via RLS policies
- Policies use `auth.uid()` to ensure users can only access their own data
- Admin routes check `user_profiles.plan = 'admin'` in middleware

### Route Protection
- **Protected routes**: `/dashboard`, `/analytics`, `/journal`, `/settings`
- **Admin routes**: `/admin`
- **Auth routes**: `/login`, `/signup` (redirect to dashboard if logged in)
- Middleware handles all redirects and session refresh

### Rate Limiting
- Auth endpoints: 5 requests/minute
- API endpoints: 60 requests/minute
- Uses Upstash Redis for distributed rate limiting

### Input Validation
- All user inputs validated with Zod schemas
- API routes reject invalid requests before processing
- Type-safe with inferred TypeScript types

## Plan System

### Plan Limits
- **Free**: 5 habits, basic analytics
- **Pro**: Unlimited habits, advanced analytics, AI insights
- **Admin**: All features + admin dashboard

### Enforcement
- Habit creation checks user's plan limit
- Analytics features gated by plan
- AI insights require Pro or Admin

## PWA & Push Notifications

### PWA Setup
- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`
- Icons: `public/icons/` (192x192, 512x512)
- Install prompt handled in `src/hooks/usePWAInstall.ts`

### Push Notifications
- VAPID keys required (generate with `npx web-push generate-vapid-keys`)
- Subscriptions stored in `push_subscriptions` table
- Service worker handles incoming push messages
- Debug page at `/debug-pwa` for troubleshooting

### Environment Variables
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:support@yourdomain.com
```

## Email System

### Email Types
- Welcome emails
- Streak risk alerts
- Streak milestone celebrations
- Weekly digests

### Setup
- Uses Resend for email delivery
- Templates in `src/emails/` using React Email
- Environment variable: `RESEND_API_KEY`

## Cron Jobs

### Scheduled Tasks
- Daily streak checks and alerts
- Weekly digest emails
- AI insights generation

### Security
- Protected by `CRON_SECRET` environment variable
- Cron endpoints verify secret before processing

## Testing

### Test Structure
- Tests in `src/__tests__/` directory
- Jest with React Testing Library
- jsdom environment for DOM testing
- Path aliases: `@/` maps to `src/`

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

## Deployment

### Docker Deployment
- Dockerfile builds Next.js app
- docker-compose.yml runs on port 3847
- Environment variables from `.env.local`
- Health check at `/api/health`

### Production Environment
Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@yourdomain.com
CRON_SECRET=your-random-secret
```

### Reverse Proxy
- HTTPS (443) → HTTP (3847)
- Enable HSTS
- Add custom headers: X-Forwarded-For, X-Real-IP

## Common Patterns

### API Route Pattern
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { someSchema } from '@/lib/validations'

export async function POST(request: Request) {
  // 1. Validate input
  const body = await request.json()
  const validated = someSchema.parse(body)

  // 2. Get authenticated user
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 3. Process request
  const result = await someApiFunction(user.id, validated)

  // 4. Return response
  return Response.json(result)
}
```

### Data Layer Pattern
```typescript
import { supabase } from '@/lib/supabase'

export async function getHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return data || []
}
```

### Component Pattern
```typescript
'use client'

import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'

export function HabitList() {
  const { habits, setHabits } = useStore()

  useEffect(() => {
    async function loadHabits() {
      const user = await supabase.auth.getUser()
      const data = await getHabits(user.data.user.id)
      setHabits(data)
    }
    loadHabits()
  }, [])

  return (
    <div>
      {habits.map(habit => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  )
}
```

## Important Notes

### Session Management
- Always call `supabase.auth.getUser()` in middleware to refresh session
- Use `createServerClient` for server-side, `createBrowserClient` for client-side
- Session stored in cookies for middleware access

### Error Handling
- API routes return appropriate HTTP status codes
- Client-side errors shown via toast notifications
- Database errors thrown as Error objects

### Performance
- Indexed frequently queried columns
- RLS policies use indexed columns where possible
- React Query caches API responses

### Development Workflow
1. Make changes locally
2. Test with `npm run test`
3. Build with `npm run build`
4. Deploy with `./deploy.sh`
5. Verify at `/debug-pwa`

## Troubleshooting

### Notifications Not Working
1. Check VAPID keys in `.env.local`
2. Rebuild Docker: `./deploy.sh`
3. Visit `/debug-pwa` for diagnostics
4. Check browser console for errors

### Install Button Not Showing
1. Ensure HTTPS enabled
2. Check service worker registered
3. Visit `/debug-pwa` for diagnostics
4. iOS requires manual install

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

## Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment on Synology NAS
- **[PWA Troubleshooting](PWA_TROUBLESHOOTING.md)** - Fix PWA and notification issues
- **[Testing Guide](TESTING_GUIDE.md)** - Step-by-step testing procedures
- **[Quick Reference](QUICK_REFERENCE.md)** - Common commands and patterns