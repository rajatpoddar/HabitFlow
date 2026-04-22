import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Browser Supabase client — uses cookies for session storage so the
 * middleware can read the session server-side without a mismatch.
 * This is a singleton; calling createBrowserClient multiple times is safe.
 *
 * Falls back to empty strings during Docker build so Next.js static
 * analysis doesn't throw — real values are injected at runtime via env vars.
 */
export const supabase = createBrowserClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder"
);
