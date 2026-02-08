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

    const limitCheck = checkUsageLimit(
      user.subscriptionTier,
      "aiDetection",
      user.aiDetectionChecksUsed
    );

    if (!limitCheck.allowed) {
      throw new ConvexError(limitCheck.reason ?? "Usage limit reached");
    }

    // Increment usage counter
    await ctx.db.patch(user._id, {
      aiDetectionChecksUsed: (user.aiDetectionChecksUsed ?? 0) + 1,
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("aiDetectionChecks", {
      userId: user._id,
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
    checkId: v.id("aiDetectionChecks"),
    overallAiScore: v.number(),
    sentenceResults: v.any(),
    copyleaksScanId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    const check = await ctx.db.get(args.checkId);
    if (!check) {
      throw new ConvexError("Check not found");
    }

    await ctx.db.patch(args.checkId, {
      overallAiScore: args.overallAiScore,
      sentenceResults: args.sentenceResults,
      copyleaksScanId: args.copyleaksScanId,
      status: args.status,
    });
  },
});

// Public action wrapper for webhook/API calls
export const updateResult = action({
  args: {
    checkId: v.id("aiDetectionChecks"),
    overallAiScore: v.number(),
    sentenceResults: v.any(),
    copyleaksScanId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.aiDetectionChecks.updateResultInternal, args);
  },
});

export const get = query({
  args: { checkId: v.id("aiDetectionChecks") },
  handler: async (ctx, args) => {
    const check = await ctx.db.get(args.checkId);
    if (!check) return null;

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
      .query("aiDetectionChecks")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});
