/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, replace with Redis (Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 20, windowSec: 60 }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + options.windowSec * 1000;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: options.limit - 1, resetAt };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    remaining: options.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Stricter limits for auth endpoints */
export const AUTH_RATE_LIMIT: RateLimitOptions = { limit: 5, windowSec: 60 };
/** Standard API limit */
export const API_RATE_LIMIT: RateLimitOptions = { limit: 60, windowSec: 60 };
/** Admin operations */
export const ADMIN_RATE_LIMIT: RateLimitOptions = { limit: 30, windowSec: 60 };

/** Helper to get client IP from request */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
