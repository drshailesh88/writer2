import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
  search: { limit: 30, windowMs: 60_000 },            // 30/min per IP
  plagiarism: { limit: 5, windowMs: 60_000 },          // 5/min per user
  plagiarismFree: { limit: 1, windowMs: 86_400_000 },  // 1/day per IP (anonymous)
  aiDetection: { limit: 5, windowMs: 60_000 },         // 5/min per user
  draftMode: { limit: 10, windowMs: 60_000 },          // 10/min per user
  learnMode: { limit: 10, windowMs: 60_000 },          // 10/min per user
  deepResearch: { limit: 3, windowMs: 60_000 },        // 3/min per user
  export: { limit: 5, windowMs: 60_000 },              // 5/min per user
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

const upstashEnabled =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const upstashRedis = upstashEnabled ? Redis.fromEnv() : null;

const upstashLimiters: Partial<Record<RateLimitCategory, Ratelimit>> | null =
  upstashRedis
    ? Object.fromEntries(
      Object.entries(RATE_LIMITS).map(([category, config]) => {
        const windowSeconds = Math.ceil(config.windowMs / 1000);
        return [
          category,
          new Ratelimit({
            redis: upstashRedis,
            limiter: Ratelimit.slidingWindow(config.limit, `${windowSeconds} s`),
            analytics: true,
          }),
        ];
      })
    )
    : null;

/**
 * Enforce rate limit on a request. Returns a 429 response if exceeded,
 * or null if the request should proceed.
 */
export async function enforceRateLimit(
  req: NextRequest,
  category: RateLimitCategory,
  userId?: string | null
): Promise<NextResponse | null> {
  const { limit, windowMs } = RATE_LIMITS[category];
  const key = getRateLimitKey(req, category, userId);
  const upstashLimiter = upstashLimiters?.[category];
  if (upstashLimiter) {
    try {
      const result = await upstashLimiter.limit(key);
      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
        console.warn(`Rate limit exceeded: ${key} (upstash)`);
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(retryAfter, 1)),
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(result.reset),
            },
          }
        );
      }
      return null;
    } catch (error) {
      console.warn("Upstash rate limit failed, falling back to in-memory:", error);
    }
  }

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
