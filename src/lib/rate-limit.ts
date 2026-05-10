/**
 * Local rate limiter memory fallback.
 */

// We track request timestamps locally per identifier and limit type.
const limits = new Map<string, number[]>();

function checkLimit(identifier: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now();
  let history = limits.get(identifier) || [];

  // Clean up old entries
  history = history.filter(time => now - time < windowMs);

  if (history.length >= limit) {
    limits.set(identifier, history);
    return { success: false, remaining: 0 };
  }

  history.push(now);
  limits.set(identifier, history);
  return { success: true, remaining: limit - history.length };
}

export async function checkAuthRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  return checkLimit(`auth:${identifier}`, 5, 60000);
}

export async function checkApiRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  return checkLimit(`api:${identifier}`, 60, 60000);
}

export async function checkAdminRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  return checkLimit(`admin:${identifier}`, 30, 60000);
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
