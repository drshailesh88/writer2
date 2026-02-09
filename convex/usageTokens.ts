import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ─── Token Cost Constants ───

export const TOKEN_COSTS = {
  DRAFT_SECTION: 100,
  LEARN_MESSAGE: 10,
  DEEP_RESEARCH: 500,
  PLAGIARISM: 50,
  AI_DETECTION: 50,
  EXPORT: 25,
} as const;

export const TOKEN_LIMITS_BY_TIER: Record<string, number> = {
  none: 0,
  free: 200,
  basic: 5000,
  pro: 15000,
};

/** Deduct tokens from a user's balance. Throws if insufficient. */
export const deductTokens = mutation({
  args: {
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const used = user.tokensUsed ?? 0;
    const limit = user.tokensLimit ?? TOKEN_LIMITS_BY_TIER[user.subscriptionTier] ?? 0;

    if (limit === 0) {
      throw new ConvexError("This feature is not available on your plan. Please upgrade.");
    }

    if (used + args.cost > limit) {
      throw new ConvexError(
        `Insufficient tokens. You need ${args.cost} but have ${limit - used} remaining. Please upgrade.`
      );
    }

    await ctx.db.patch(user._id, {
      tokensUsed: used + args.cost,
      updatedAt: Date.now(),
    });

    return { success: true, remaining: limit - used - args.cost };
  },
});

/** Get current token balance for the authenticated user. */
export const getTokenBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const used = user.tokensUsed ?? 0;
    const limit = user.tokensLimit ?? TOKEN_LIMITS_BY_TIER[user.subscriptionTier] ?? 0;

    return {
      tokensUsed: used,
      tokensLimit: limit,
      tokensRemaining: Math.max(0, limit - used),
    };
  },
});

/** Check if the user has sufficient tokens for an operation. */
export const checkTokenLimit = query({
  args: {
    operationCost: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { allowed: false, reason: "Not authenticated" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return { allowed: false, reason: "User not found" };

    const used = user.tokensUsed ?? 0;
    const limit = user.tokensLimit ?? TOKEN_LIMITS_BY_TIER[user.subscriptionTier] ?? 0;

    if (limit === 0) {
      return { allowed: false, reason: "Feature not available on your plan" };
    }

    if (used + args.operationCost > limit) {
      return {
        allowed: false,
        reason: `Insufficient tokens: need ${args.operationCost}, have ${limit - used} remaining`,
        remaining: limit - used,
      };
    }

    return { allowed: true, remaining: limit - used };
  },
});

/** Internal mutation: reset tokens for all users. Called by monthly cron. */
export const resetAllTokens = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    for (const user of users) {
      const limit = TOKEN_LIMITS_BY_TIER[user.subscriptionTier] ?? 200;
      await ctx.db.patch(user._id, {
        tokensUsed: 0,
        tokensLimit: limit,
        lastTokenReset: now,
        updatedAt: now,
      });
    }
  },
});
