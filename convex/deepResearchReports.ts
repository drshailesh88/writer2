import { mutation, query, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
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

// Internal mutation — only callable from within Convex (actions, other mutations)
export const updateResultInternal = internalMutation({
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

    // State-transition guard: only allow valid forward transitions
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ["in_progress"],
      in_progress: ["completed", "failed"],
    };
    const allowed = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(args.status)) {
      throw new ConvexError(
        `Invalid transition: ${existing.status} → ${args.status}`
      );
    }

    const updates: Record<string, unknown> = { status: args.status };
    if (args.report !== undefined) updates.report = args.report;
    if (args.citedPapers !== undefined) updates.citedPapers = args.citedPapers;

    await ctx.db.patch(args.reportId, updates);
  },
});

// Action wrapper — callable from API routes, delegates to internal mutation
export const updateResult = action({
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
    await ctx.runMutation(internal.deepResearchReports.updateResultInternal, args);
  },
});

export const get = query({
  args: { reportId: v.id("deepResearchReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || report.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    return report;
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
