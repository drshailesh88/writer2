import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { checkUsageLimit } from "./lib/subscriptionLimits";

export const create = mutation({
  args: {
    topic: v.string(),
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
      "deepResearch",
      user.deepResearchUsed
    );

    if (!limitCheck.allowed) {
      throw new ConvexError(limitCheck.reason ?? "Usage limit reached");
    }

    // Increment usage counter
    await ctx.db.patch(user._id, {
      deepResearchUsed: (user.deepResearchUsed ?? 0) + 1,
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("deepResearchReports", {
      userId: user._id,
      topic: args.topic,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateResult = mutation({
  args: {
    reportId: v.id("deepResearchReports"),
    report: v.optional(v.string()),
    citedPapers: v.optional(v.any()),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.reportId);
    if (!existing) {
      throw new ConvexError("Report not found");
    }

    const updates: Record<string, unknown> = { status: args.status };
    if (args.report !== undefined) updates.report = args.report;
    if (args.citedPapers !== undefined) updates.citedPapers = args.citedPapers;

    await ctx.db.patch(args.reportId, updates);
  },
});

export const get = query({
  args: { reportId: v.id("deepResearchReports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reportId);
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
      .query("deepResearchReports")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});
