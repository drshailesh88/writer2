import { action, mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { checkUsageLimit } from "./lib/subscriptionLimits";

export const create = mutation({
  args: {
    inputText: v.string(),
    wordCount: v.number(),
    documentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Anonymous funnel — no auth required for plagiarism
    let userId = undefined;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (user) {
        // Check usage limit
        const limitCheck = checkUsageLimit(
          user.subscriptionTier,
          "plagiarism",
          user.plagiarismChecksUsed
        );

        if (!limitCheck.allowed) {
          throw new ConvexError(limitCheck.reason ?? "Usage limit reached");
        }

        // Increment usage counter
        await ctx.db.patch(user._id, {
          plagiarismChecksUsed: (user.plagiarismChecksUsed ?? 0) + 1,
          updatedAt: Date.now(),
        });

        userId = user._id;
      }
    } else {
      // Anonymous: enforce 1-check limit via word count cap
      if (args.wordCount > 1000) {
        throw new ConvexError(
          "Anonymous plagiarism checks are limited to 1000 words. Please sign up for more."
        );
      }
    }

    return await ctx.db.insert("plagiarismChecks", {
      userId,
      documentId: args.documentId,
      inputText: args.inputText,
      wordCount: args.wordCount,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Internal mutation — only callable from server-side actions, not from clients
export const updateResultInternal = internalMutation({
  args: {
    checkId: v.id("plagiarismChecks"),
    overallSimilarity: v.number(),
    sources: v.any(),
    copyleaksScanId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    const check = await ctx.db.get(args.checkId);
    if (!check) {
      throw new ConvexError("Check not found");
    }

    // State-transition guard: only allow pending → completed/failed
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ["completed", "failed"],
    };
    const allowed = VALID_TRANSITIONS[check.status] ?? [];
    if (!allowed.includes(args.status)) {
      throw new ConvexError(
        `Invalid transition: ${check.status} → ${args.status}`
      );
    }

    await ctx.db.patch(args.checkId, {
      overallSimilarity: args.overallSimilarity,
      sources: args.sources,
      copyleaksScanId: args.copyleaksScanId,
      status: args.status,
    });
  },
});

// Public action wrapper for webhook calls (actions can invoke internalMutation)
export const updateResult = action({
  args: {
    checkId: v.id("plagiarismChecks"),
    overallSimilarity: v.number(),
    sources: v.any(),
    copyleaksScanId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.plagiarismChecks.updateResultInternal, args);
  },
});

// Internal mutation — only callable from server-side actions
export const setScanIdInternal = internalMutation({
  args: {
    checkId: v.id("plagiarismChecks"),
    copyleaksScanId: v.string(),
  },
  handler: async (ctx, args) => {
    const check = await ctx.db.get(args.checkId);
    if (!check) {
      throw new ConvexError("Check not found");
    }
    // Only allow setting scanId on pending checks
    if (check.status !== "pending") {
      throw new ConvexError("Can only set scanId on pending checks");
    }
    await ctx.db.patch(args.checkId, {
      copyleaksScanId: args.copyleaksScanId,
    });
  },
});

// Action wrapper for API route calls
export const setScanId = action({
  args: {
    checkId: v.id("plagiarismChecks"),
    copyleaksScanId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.plagiarismChecks.setScanIdInternal, args);
  },
});

export const get = query({
  args: { checkId: v.id("plagiarismChecks") },
  handler: async (ctx, args) => {
    const check = await ctx.db.get(args.checkId);
    if (!check) return null;

    // Ownership check: if check has a userId, verify caller owns it
    // Anonymous checks (no userId) are accessible by checkId (acts as a token)
    if (check.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new ConvexError("Not authenticated");
      }
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!user || check.userId !== user._id) {
        throw new ConvexError("Not authorized");
      }
    }

    return check;
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("plagiarismChecks")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});
