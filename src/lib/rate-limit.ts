/**
 * Serverless-safe rate limiter using Upstash Redis
 * Falls back to allowing all requests if Upstash is not configured (local dev)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Upstash is configured
const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
let authRateLimit: Ratelimit | null = null;
let apiRateLimit: Ratelimit | null = null;
let adminRateLimit: Ratelimit | null = null;

if (isUpstashConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  authRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: true,
    prefix: 'habitflow:auth',
  });

  apiRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    analytics: true,
    prefix: 'habitflow:api',
  });

  adminRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    analytics: true,
    prefix: 'habitflow:admin',
  });
}

/**
 * Rate limit for auth endpoints (5 requests per minute)
 */
export async function checkAuthRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (!authRateLimit) {
    console.warn('Upstash not configured, skipping auth rate limit');
    return { success: true, remaining: 999 };
  }

  const { success, remaining } = await authRateLimit.limit(identifier);
  return { success, remaining };
}

/**
 * Rate limit for API endpoints (60 requests per minute)
 */
export async function checkApiRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (!apiRateLimit) {
    console.warn('Upstash not configured, skipping API rate limit');
    return { success: true, remaining: 999 };
  }

  const { success, remaining } = await apiRateLimit.limit(identifier);
  return { success, remaining };
}

/**
 * Rate limit for admin endpoints (30 requests per minute)
 */
export async function checkAdminRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (!adminRateLimit) {
    console.warn('Upstash not configured, skipping admin rate limit');
    return { success: true, remaining: 999 };
  }

  const { success, remaining } = await adminRateLimit.limit(identifier);
  return { success, remaining };
}

/**
 * Helper to get client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
