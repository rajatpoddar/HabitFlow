# HabitFlow — Agentic AI Enhancement Prompt

---

## CONTEXT

You are working on **HabitFlow** — a production habit tracking SaaS built with:
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **State**: Zustand (`src/store/useStore.ts`)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Validation**: Zod
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel + Supabase

The app currently has: habit tracking, analytics, basic AI insights, daily journal, browser-based alarms, an admin dashboard, and a Free/Pro plan system.

**DO NOT implement payment/Stripe/Razorpay** — that comes in a later sprint.

Read the full codebase before making any changes. Understand every existing file, component, API route, Supabase schema, and Zustand store before writing a single line of new code.

---

## MISSION

Implement the following 6 improvement areas in order. Complete each fully before moving to the next. After every area, run `npm run build` and fix all TypeScript and lint errors before proceeding.

---

## AREA 1 — REPLACE BROWSER ALARMS WITH REAL WEB PUSH NOTIFICATIONS

### Goal
Remove the unreliable browser-tab-dependent alarm system and replace it with proper Web Push notifications that work even when the tab is closed.

### Steps

**1.1 — Install dependencies**
```bash
npm install web-push @types/web-push
```

**1.2 — Generate VAPID keys**
Run once and add to `.env.local`:
```bash
npx web-push generate-vapid-keys
```
Add to `.env.example` and `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:support@habitflow.app
```

**1.3 — Create Service Worker**
Create `public/sw.js`:
- Listen for `push` events and show `self.registration.showNotification()`
- Handle `notificationclick` — open `/dashboard` on click
- Handle `notificationclose` event
- Support action buttons: "Mark Done" and "Snooze 10min"
- On "Mark Done" action: `fetch('/api/habits/complete', { method: 'POST', body: ... })`
- On "Snooze" action: schedule another push via `setTimeout` for 10 minutes

**1.4 — Create Supabase table for push subscriptions**
Add to a new migration file `supabase/migrations/004_push_notifications.sql`:
```sql
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

Also add a `reminder_time` column (TIME) and `reminder_enabled` (BOOLEAN DEFAULT false) to the `habits` table if not already present.

**1.5 — Create API routes**

`src/app/api/notifications/subscribe/route.ts` — POST
- Accept `{ subscription: PushSubscription }` from client
- Upsert into `push_subscriptions` table
- Return `{ success: true }`

`src/app/api/notifications/unsubscribe/route.ts` — POST
- Delete subscription by endpoint for the authenticated user

`src/app/api/notifications/send/route.ts` — POST (protected by CRON_SECRET header)
- Query all habits where `reminder_enabled = true` and `reminder_time` matches current hour:minute
- For each matching habit, fetch the user's push subscription
- Send push notification via `web-push` library with payload:
  ```json
  { "title": "Time for: {habit_name}", "body": "Keep your streak alive! 🔥", "habitId": "...", "icon": "/icons/icon-192.png" }
  ```
- Handle and log send errors gracefully without breaking on one failure

**1.6 — Create `src/lib/push-notifications.ts`** client-side helper:
```typescript
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration>
export async function subscribeToPush(userId: string): Promise<void>
export async function unsubscribeFromPush(): Promise<void>
export async function isPushSupported(): Promise<boolean>
export async function isPushSubscribed(): Promise<boolean>
```

**1.7 — Update habit creation/edit form**
- Add "Set Reminder" toggle
- When toggled on, show a time picker `<input type="time">`
- Save `reminder_time` and `reminder_enabled` to Supabase
- On toggle on, call `subscribeToPush()` if not already subscribed
- Show browser permission prompt with explanation before requesting

**1.8 — Create `src/components/notifications/NotificationPermissionBanner.tsx`**
- Dismissible banner on dashboard if push is supported but not subscribed
- "🔔 Enable reminders to never miss a habit" with Enable / Later buttons
- Store dismissal in localStorage

**1.9 — Vercel Cron Job**
Add to `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/notifications/send", "schedule": "* * * * *" }
  ]
}
```

**1.10 — Remove old alarm system**
- Delete all browser-based alarm files, components, API routes
- Remove alarm state from Zustand store
- Add migration to drop alarm-related columns

---

## AREA 2 — EMAIL SYSTEM WITH RESEND

### Goal
Add transactional emails for key lifecycle moments: welcome, streak alerts, weekly digest, and milestones.

### Steps

**2.1 — Install dependencies**
```bash
npm install resend react-email @react-email/components
```

**2.2 — Add env vars**
```
RESEND_API_KEY=re_...
EMAIL_FROM=HabitFlow <hello@habitflow.app>
```

**2.3 — Create `src/lib/email.ts`**
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, react }: {
  to: string;
  subject: string;
  react: React.ReactElement;
}): Promise<void>
```

**2.4 — Create email templates in `src/emails/`**

`src/emails/WelcomeEmail.tsx`:
- HabitFlow logo/wordmark at top
- "Welcome to HabitFlow, {firstName}!" heading
- 3 core features explained briefly
- CTA button "Go to Dashboard"
- Tip: "Start with just 1 habit. Consistency beats quantity."

`src/emails/StreakRiskEmail.tsx`:
- Sent when user hasn't completed any habits by 8 PM with an active streak > 3 days
- Shows current streak count prominently
- Lists incomplete habits for today
- CTA: "Complete Now" → dashboard

`src/emails/WeeklyDigestEmail.tsx`:
- Sent every Sunday at 9 AM IST
- Shows overall completion rate, best streak, most-completed habit
- CTA: "View Full Analytics"

`src/emails/StreakMilestoneEmail.tsx`:
- Triggered at 7, 21, 30, 60, 100 day streaks
- Celebratory design with milestone number prominent

**2.5 — Create email API routes**
- `src/app/api/emails/welcome/route.ts` — called after signup
- `src/app/api/emails/streak-risk/route.ts` — cron endpoint (CRON_SECRET protected)
- `src/app/api/emails/weekly-digest/route.ts` — cron endpoint (CRON_SECRET protected)
- `src/app/api/emails/milestone/route.ts` — called on streak milestone

**2.6 — Wire welcome email into auth signup flow**
After user is created in Supabase, call welcome email route. Use first name from signup form or email prefix.

**2.7 — Wire milestone emails into habit completion**
After updating the streak, check if new streak is in `[7, 21, 30, 60, 100]`. If yes, fire milestone email asynchronously (fire-and-forget, don't await).

**2.8 — Add cron jobs in `vercel.json`**
```json
{ "path": "/api/emails/streak-risk", "schedule": "0 14 * * *" },
{ "path": "/api/emails/weekly-digest", "schedule": "0 3 * * 0" }
```
(14:00 UTC = 8 PM IST; 3:00 UTC = 8:30 AM IST Sunday)

**2.9 — Email preferences**
Add `email_welcome`, `email_streak_risk`, `email_weekly_digest`, `email_milestones` (BOOLEAN DEFAULT true) to `user_profiles`.

Create `src/components/settings/EmailPreferences.tsx` — toggle switches saved to Supabase. Add to settings/profile page.

---

## AREA 3 — ONBOARDING FLOW

### Goal
Build a 4-step onboarding flow that runs once after signup to dramatically improve week-1 retention.

### Steps

**3.1 — Supabase schema**
Add `onboarding_completed BOOLEAN DEFAULT false` and `onboarding_step INT DEFAULT 0` to `user_profiles`.

**3.2 — Create `src/app/(onboarding)/onboarding/page.tsx`**
Full-screen, centered, step-based flow with Framer Motion `AnimatePresence` transitions.

**Step 1 — Welcome**
- "Welcome to HabitFlow 🌿" + subtitle
- "Get Started →" button
- "I'll explore on my own" skip link (marks onboarding complete)

**Step 2 — Pick Your First Habits**
- Headline: "What would you like to work on?"
- Grid of 12 habit template cards with emoji + name:
  - 🏃 Morning Run, 💧 Drink Water, 📚 Read 30min, 🧘 Meditate, 💪 Exercise, 🌙 Sleep by 10pm, 📝 Journal, 🚫 No Social Media, 🥗 Eat Healthy, 🎯 Deep Work, 🙏 Gratitude, 💊 Take Vitamins
- Multi-select, min 1, max 5
- "+ Add custom habit" text link
- "Next →" enabled only when ≥1 selected

**Step 3 — Set Reminder Times**
- For each habit from Step 2: emoji + name + time picker + enable toggle
- "Enable Notifications" button that triggers push permission request
- "Skip this step" option

**Step 4 — You're all set!**
- Framer Motion confetti-style burst (CSS-based, no library)
- Summary: "You've added {n} habits" + habit list
- If notifications enabled: "✅ Reminders are on"
- CTA: "Go to My Dashboard →"

**3.3 — Create `src/app/api/onboarding/complete/route.ts`**
- POST: accepts `{ habits, reminderTimes }`
- Creates habits in Supabase
- Sets reminder times, enables push for habits with times
- Marks `onboarding_completed = true`

**3.4 — Middleware redirect**
In `src/middleware.ts`, after auth check:
- If authenticated AND `onboarding_completed = false` AND not on `/onboarding` or `/api/*` → redirect to `/onboarding`

**3.5 — Progress indicator**
- 4 dots at top, active = filled green, past = gray, future = empty
- "Step 2 of 4" fraction label

**3.6 — Mobile-first design**
- `min-h-screen`, max-width 480px centered
- All touch targets min 44px height
- No horizontal scroll

---

## AREA 4 — PHASE 2 FEATURES

### 4A — Habit Templates Library

**Create `src/app/(pages)/templates/page.tsx`**
- "Browse Templates" button on dashboard links here
- Template packs by category:
  - 🌅 Morning Routines (5 templates)
  - 💪 Fitness & Health (5 templates)
  - 🧠 Mental Wellness (5 templates)
  - 📚 Learning & Growth (5 templates)
  - 🚫 Breaking Bad Habits (4 templates)
- Each card: emoji, name, description, frequency, estimated time
- "Add to My Habits" — one click, redirects to dashboard
- Free users respect 5-habit limit

**Create `src/lib/habit-templates.ts`** — static array, no DB needed:
```typescript
interface HabitTemplate {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  suggestedTime: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | '3x_week';
  estimatedMinutes: number;
}
```

### 4B — Flexible Habit Scheduling

**Update habit form** with frequency selector:
- Daily (default), Weekdays only, Weekends only, Custom days (checkboxes M T W T F S S), X times per week (slider 1–7)

**New migration**:
```sql
ALTER TABLE habits ADD COLUMN frequency TEXT DEFAULT 'daily';
ALTER TABLE habits ADD COLUMN custom_days INTEGER[] DEFAULT NULL;
ALTER TABLE habits ADD COLUMN times_per_week INTEGER DEFAULT NULL;
```

**Update `src/lib/api/habits.ts`**:
- `isHabitDueToday(habit)` function for frequency rules
- Only show habits in today's list if due today
- Analytics must use "expected completions" based on frequency, not raw calendar days
- Streaks must NOT break on days a habit isn't scheduled

### 4C — Habit Correlation Insights

**Create `src/components/insights/CorrelationInsight.tsx`**
- In Analytics/Insights section
- Client-side calculation on last 30 days of completions
- Finds pairs of habits frequently completed together
- Shows: "You complete **Exercise** 84% of days you also complete **Journal** 🔗"
- Max 3 pairs, sorted by correlation score

**Create `src/lib/analytics/correlations.ts`**:
```typescript
export function calculateHabitCorrelations(
  completions: HabitCompletion[],
  habits: Habit[]
): CorrelationPair[]
// Algorithm: for each pair, count(both completed) / count(either completed) = score
```

### 4D — Streak Freeze Feature

**New column**: `streak_freezes INT DEFAULT 1` on `user_profiles`
- Free: 1 freeze; Pro: 3 per month (reset on 1st via cron)

**Create `src/app/api/habits/freeze-streak/route.ts`** — POST
- Deduct 1 freeze
- Create `habit_completions` record with `type = 'freeze'` for today
- Prevents streak break

**Create `src/components/habits/StreakFreezeButton.tsx`**
- Shows only when freezes available
- ❄️ button near streak counter
- Confirmation dialog: "Use 1 Streak Freeze? You have {n} remaining."
- After use: "❄️ Streak protected today"

---

## AREA 5 — MOBILE UI FIXES

### 5A — Dashboard Card Overlap Fix

From the screenshot, the mobile dashboard card has these issues:
1. "Today's Progress" label and "14 Day Streak" badge are overlapping
2. Habit chips (Morning Run, Read 30min, Meditate) overflow horizontally
3. Card is too cramped with insufficient padding
4. Hero icon too large relative to the percentage number

Fix the dashboard stats card component:

```
BEFORE (broken mobile layout):
  [absolute positioned streak badge overlapping percentage]
  [chips in nowrap row clipping off screen]

AFTER (fixed):
  [hero icon — smaller on mobile]
  [68% — large percentage]
  [14 Day Streak — on its own line as a badge/pill]
  [Today's Progress — label]
  [chips in flex-wrap row, wrapping naturally]
```

Specific CSS changes:
- Remove `position: absolute` from streak badge; make it `flex items-center gap-2 mt-1` below the percentage
- Change chip container: `flex flex-wrap gap-2` (was `flex flex-nowrap` or `flex overflow-hidden`)
- Card padding: `p-5 sm:p-6` (ensure mobile gets at least 20px padding)
- Icon: `w-14 h-14 sm:w-20 sm:h-20`
- Stack percentage + streak label vertically on mobile: `flex-col items-center`

### 5B — Global Mobile Audit

Audit every page and apply these fixes:

- All page containers: minimum `px-4` horizontal padding on mobile
- Navigation: verify works on 375px width screens
- All form inputs: `text-base` (16px minimum) to prevent iOS auto-zoom on focus
- All buttons: minimum `h-11` (44px) touch target height
- Admin dashboard tables: wrap in `<div className="overflow-x-auto">` 
- All Recharts components: use `<ResponsiveContainer width="100%" height={300}>` with `minWidth: 0` on parent
- Modals/Dialogs: full width on mobile with `mx-4` margins or convert to bottom sheet pattern

### 5C — PWA Setup

Create `public/manifest.json`:
```json
{
  "name": "HabitFlow",
  "short_name": "HabitFlow",
  "description": "Build habits that stick",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#f0fdf4",
  "theme_color": "#059669",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Update `src/app/layout.tsx` `<head>`:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#059669" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
```

Generate placeholder icons using Node.js canvas or sharp — green square (#059669) with white text "HF".

---

## AREA 6 — RATE LIMITING FIX + QUALITY POLISH

### 6A — Fix Rate Limiting (Serverless-Safe)

Current in-memory rate limiting breaks in Vercel serverless (each lambda = fresh memory).

**Install:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Add env vars:**
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Replace `src/lib/rate-limit.ts`** entirely:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'habitflow:auth',
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: true,
  prefix: 'habitflow:api',
});
```

**Graceful degradation:** If Upstash env vars are missing (local dev), fall back to allowing all requests with a console.warn.

**Update all API routes** to use new call signature:
```typescript
const { success } = await authRateLimit.limit(identifier);
if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
```

### 6B — Error Boundaries
Create `src/components/ErrorBoundary.tsx` — React class component.
Wrap dashboard main content. Show "Something went wrong. Refresh the page." UI on error.

### 6C — Loading Skeletons
Replace all spinners with skeleton screens using `animate-pulse`:
- Habit list: 3 skeleton cards
- Analytics: skeleton chart + 4 stat boxes
- Journal: skeleton text lines

### 6D — Empty States
Every list section must have a proper empty state:
- No habits: "Start your journey. Add your first habit ✨" + Add Habit button
- No completions today: "No completions yet today. You've got this! 💪"
- No journal entries: "Your journal is empty. Write your first entry 📝"
- No analytics data: "Complete habits for 7 days to see your analytics 📊"

### 6E — Toast Notifications
Ensure every mutation shows a toast:
- Habit added: "✅ Habit added!"
- Habit completed: "🔥 {name} completed! Streak: {n} days"
- Habit deleted: "🗑️ Habit removed"
- Journal saved: "✅ Journal saved"
- Settings saved: "✅ Settings updated"

Use existing toast component if present; otherwise install `react-hot-toast`.

### 6F — Final Env + Docs Update

Update `.env.example` with all new vars:
```
# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@habitflow.app

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=HabitFlow <hello@habitflow.app>

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cron Security
CRON_SECRET=your-random-secret-here
```

Update `README.md` with a new "Sprint 2 Setup" section covering VAPID key generation, Resend setup, Upstash Redis setup, new migrations (004+), and all new env vars.

---

## EXECUTION RULES FOR THE AI AGENT

1. **Read before writing.** Read every relevant existing file before modifying or creating. Never guess at existing structure.

2. **No breaking changes.** Every existing feature must continue working after each area is completed.

3. **TypeScript strict.** All new code fully typed. No `any` unless unavoidable, with a comment explaining why.

4. **Build check after each area.** Run `npm run build` after completing each area. Fix all errors before proceeding.

5. **Test new logic.** Add Jest unit tests for `correlations.ts`, `push-notifications.ts`, `email.ts`, and the rate limit module.

6. **Mobile-first CSS.** All new components designed mobile-first. No fixed pixel widths. Scale up with `md:` / `lg:` prefixes.

7. **Accessibility.** All interactive elements have `aria-label`, `role`, or semantic HTML. Modals trap focus. Color is never the only state indicator.

8. **Environment variable safety.** Never log env vars. Server-only vars used only in server components or API routes. Check `NEXT_PUBLIC_` prefix hygiene.

9. **Migrations are additive only.** Never drop existing columns or tables. Always add columns with defaults. New migration files only — never modify existing ones.

10. **Commit after each area:**
    ```
    feat(area-N): description
    - what was done
    ```

---

## FINAL CHECKLIST

- [ ] `npm run build` passes with zero errors
- [ ] `npm run test` passes with zero failures
- [ ] Push notifications work in Chrome/Edge (test with `chrome://serviceworker-internals`)
- [ ] Welcome email sends on new signup
- [ ] Streak risk email sends when cron endpoint is called manually
- [ ] Weekly digest sends when cron endpoint is called manually
- [ ] Onboarding flow completes and sets `onboarding_completed = true`
- [ ] Returning users skip onboarding and go directly to dashboard
- [ ] Habit templates can be browsed and added in one click
- [ ] Custom scheduling works; streaks don't break on off-days
- [ ] Correlation insight appears after 7+ days of data
- [ ] Streak freeze deducts from count and protects streak
- [ ] Mobile dashboard: no overlapping elements at 375px viewport
- [ ] Mobile dashboard: habit chips wrap correctly
- [ ] All form inputs use `text-base` (no iOS zoom)
- [ ] PWA manifest is valid (DevTools → Application → Manifest)
- [ ] Rate limiting works (hit auth endpoints 6+ times rapidly)
- [ ] All new env vars documented in `.env.example`
- [ ] README updated with new setup instructions
