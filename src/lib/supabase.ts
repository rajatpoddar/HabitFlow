import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser Supabase client — uses cookies for session storage so the
 * middleware can read the session server-side without a mismatch.
 * This is a singleton; calling createBrowserClient multiple times is safe.
 */
export const supabase = createBrowserClient(url, anonKey);
