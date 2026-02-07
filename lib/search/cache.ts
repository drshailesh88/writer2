import type { SearchResponse } from "./types";

interface CacheEntry {
  data: SearchResponse;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const cache = new Map<string, CacheEntry>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
      }
    }
    // Stop timer if cache is empty
    if (cache.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
}

export function buildCacheKey(
  query: string,
  filters: Record<string, unknown>,
  sort: string,
  page: number
): string {
  const normalizedQuery = query.toLowerCase().trim();
  const sortedFilters = JSON.stringify(filters, Object.keys(filters).sort());
  return `${normalizedQuery}|${sortedFilters}|${sort}|${page}`;
}

export function getCachedResponse(key: string): SearchResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCachedResponse(key: string, data: SearchResponse): void {
  cache.set(key, { data, timestamp: Date.now() });
  ensureCleanupTimer();
}
