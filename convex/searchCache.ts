import { v } from "convex/values";
import { internalQuery, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Internal: look up a cached search response by query hash. */
export const getCachedSearchInternal = internalQuery({
  args: { queryHash: v.string() },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("searchCache")
      .withIndex("by_query_hash", (q) => q.eq("queryHash", args.queryHash))
      .first();

    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      return null;
    }

    return {
      results: entry.results,
      totalResults: entry.totalResults,
      sourceStatus: entry.sourceStatus,
    };
  },
});

/** Internal: store or update a cached search response. */
export const setCachedSearchInternal = internalMutation({
  args: {
    queryHash: v.string(),
    results: v.any(),
    totalResults: v.number(),
    sourceStatus: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("searchCache")
      .withIndex("by_query_hash", (q) => q.eq("queryHash", args.queryHash))
      .first();

    if (existing) {
      await ctx.db.replace(existing._id, {
        queryHash: args.queryHash,
        results: args.results,
        totalResults: args.totalResults,
        sourceStatus: args.sourceStatus,
        createdAt: now,
        expiresAt: now + CACHE_TTL_MS,
      });
    } else {
      await ctx.db.insert("searchCache", {
        queryHash: args.queryHash,
        results: args.results,
        totalResults: args.totalResults,
        sourceStatus: args.sourceStatus,
        createdAt: now,
        expiresAt: now + CACHE_TTL_MS,
      });
    }
  },
});

// ─── Action wrappers (callable from API routes/lib via ConvexHttpClient) ───

export const getCachedSearch = action({
  args: { queryHash: v.string() },
  handler: async (ctx, args): Promise<{ results: unknown; totalResults: number; sourceStatus: unknown } | null> => {
    return await ctx.runQuery(internal.searchCache.getCachedSearchInternal, args);
  },
});

export const setCachedSearch = action({
  args: {
    queryHash: v.string(),
    results: v.any(),
    totalResults: v.number(),
    sourceStatus: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.searchCache.setCachedSearchInternal, args);
  },
});

/** Internal mutation: delete all expired cache entries. Called by cron. */
export const cleanExpiredCache = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("searchCache")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .collect();

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }
  },
});
