import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      return existingUser;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? "",
      avatarUrl: identity.pictureUrl ?? undefined,
      subscriptionTier: "free",
      plagiarismChecksUsed: 0,
      aiDetectionChecksUsed: 0,
      deepResearchUsed: 0,
      learnModeSessionsUsed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    institution: v.optional(v.string()),
    specialization: v.optional(v.string()),
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

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.institution !== undefined) updates.institution = args.institution;
    if (args.specialization !== undefined)
      updates.specialization = args.specialization;

    await ctx.db.patch(user._id, updates);
  },
});

export const resetMonthlyUsage = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      plagiarismChecksUsed: 0,
      aiDetectionChecksUsed: 0,
      deepResearchUsed: 0,
      learnModeSessionsUsed: 0,
      updatedAt: Date.now(),
    });
  },
});

// ─── Usage Queries & Mutations (Task 10) ───

import { SUBSCRIPTION_LIMITS } from "./lib/subscriptionLimits";

export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const tier = user.subscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier];

    return {
      tier,
      plagiarismUsed: user.plagiarismChecksUsed ?? 0,
      plagiarismLimit: limits.plagiarism,
      aiDetectionUsed: user.aiDetectionChecksUsed ?? 0,
      aiDetectionLimit: limits.aiDetection,
      deepResearchUsed: user.deepResearchUsed ?? 0,
      deepResearchLimit: limits.deepResearch,
      learnModeUsed: user.learnModeSessionsUsed ?? 0,
      learnModeLimit: limits.learnMode,
    };
  },
});

export const decrementPlagiarismUsage = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return;

    const currentUsage = user.plagiarismChecksUsed ?? 0;
    if (currentUsage > 0) {
      await ctx.db.patch(user._id, {
        plagiarismChecksUsed: currentUsage - 1,
        updatedAt: Date.now(),
      });
    }
  },
});

export const decrementAiDetectionUsage = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return;

    const currentUsage = user.aiDetectionChecksUsed ?? 0;
    if (currentUsage > 0) {
      await ctx.db.patch(user._id, {
        aiDetectionChecksUsed: currentUsage - 1,
        updatedAt: Date.now(),
      });
    }
  },
});

export const resetAllUsageCounters = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.patch(user._id, {
        plagiarismChecksUsed: 0,
        aiDetectionChecksUsed: 0,
        deepResearchUsed: 0,
        learnModeSessionsUsed: 0,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});
