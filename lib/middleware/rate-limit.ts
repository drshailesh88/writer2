import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory sliding window rate limiter.
 * Each serverless instance has its own counter — limits are approximate
 * but sufficient for abuse prevention. For distributed limiting, use Redis.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const counters = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of counters) {
    if (now - entry.windowStart > 5 * 60 * 1000) {
      counters.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const RATE_LIMITS = {
  search: { limit: 30, windowMs: 60_000 },        // 30/min per IP
  plagiarism: { limit: 5, windowMs: 60_000 },      // 5/min per user
  aiDetection: { limit: 5, windowMs: 60_000 },     // 5/min per user
  draftMode: { limit: 10, windowMs: 60_000 },      // 10/min per user
  learnMode: { limit: 10, windowMs: 60_000 },      // 10/min per user
  deepResearch: { limit: 3, windowMs: 60_000 },    // 3/min per user
} as const;

export type RateLimitCategory = keyof typeof RATE_LIMITS;

export function getRateLimitKey(
  req: NextRequest,
  category: RateLimitCategory,
  userId?: string | null
): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  return userId ? `${category}:user:${userId}` : `${category}:ip:${ip}`;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = counters.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    counters.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const resetAt = entry.windowStart + windowMs;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt };
}

/**
 * Enforce rate limit on a request. Returns a 429 response if exceeded,
 * or null if the request should proceed.
 */
export function enforceRateLimit(
  req: NextRequest,
  category: RateLimitCategory,
  userId?: string | null
): NextResponse | null {
  const { limit, windowMs } = RATE_LIMITS[category];
  const key = getRateLimitKey(req, category, userId);
  const result = checkRateLimit(key, limit, windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    console.warn(`Rate limit exceeded: ${key} (limit: ${limit}/${windowMs}ms)`);

    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(retryAfter, 1)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  return null;
}
