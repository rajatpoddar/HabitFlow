# Gemini CLI Context: Habit-Tracker

This is a Next.js (App Router) project using TypeScript, Tailwind CSS, and Supabase.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend/Database:** Supabase
- **Features:** PWA capabilities

## Guidelines for Gemini CLI
1. **Routing:** Follow Next.js App Router conventions (`src/app/page.tsx`, `layout.tsx`, `route.ts`).
2. **Components:** Use React Functional Components and hooks. Ensure components are mostly Server Components unless client-side interactivity is needed (add `'use client'` at the top).
3. **Styling:** Use Tailwind CSS for styling. Follow the existing design system if any.
4. **Types:** Use strict TypeScript typing. Define interfaces/types in `src/types/` or inline if specific to a component.
5. **Database:** Use Supabase client (`src/lib/supabase.ts` or `supabase-server.ts`). Ensure RLS (Row Level Security) policies are considered when making database queries.
6. **Testing:** Write tests using Jest (as configured in `jest.config.ts`).
7. **PWA:** Maintain PWA compatibility (service worker in `public/sw.js`).

## Commands
- **Install dependencies:** `npm install`
- **Run local development:** `npm run dev`
- **Build:** `npm run build`
- **Test:** `npm test`
