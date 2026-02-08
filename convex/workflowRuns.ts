import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.id("users"),
    documentId: v.id("documents"),
    workflowType: v.union(
      v.literal("draft_guided"),
      v.literal("draft_handsoff"),
      v.literal("learn")
    ),
    currentStep: v.optional(v.string()),
    stepData: v.optional(v.any()),
    runObject: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const WORKFLOW_TTL_MS = 30 * 60 * 1000; // 30 minutes

    return await ctx.db.insert("workflowRuns", {
      userId: args.userId,
      documentId: args.documentId,
      workflowType: args.workflowType,
      status: "running",
      currentStep: args.currentStep,
      stepData: args.stepData,
      runObject: args.runObject,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + WORKFLOW_TTL_MS,
    });
  },
});

export const update = mutation({
  args: {
    workflowRunId: v.id("workflowRuns"),
    status: v.optional(
      v.union(
        v.literal("running"),
        v.literal("suspended"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    currentStep: v.optional(v.string()),
    stepData: v.optional(v.any()),
    runObject: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run) {
      throw new ConvexError("Workflow run not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.status !== undefined) updates.status = args.status;
    if (args.currentStep !== undefined) updates.currentStep = args.currentStep;
    if (args.stepData !== undefined) updates.stepData = args.stepData;
    if (args.runObject !== undefined) updates.runObject = args.runObject;
    if (args.error !== undefined) updates.error = args.error;

    await ctx.db.patch(args.workflowRunId, updates);
  },
});

export const getByDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("workflowRuns")
      .filter((q) => q.eq(q.field("documentId"), args.documentId))
      .order("desc")
      .collect();

    // Return the most recent active run (not completed/failed)
    return (
      runs.find(
        (r) => r.status === "running" || r.status === "suspended"
      ) ?? null
    );
  },
});

export const getById = query({
  args: { workflowRunId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workflowRunId);
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflowRuns")
      .withIndex("by_user_and_document", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const cleanExpiredRuns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("workflowRuns")
      .withIndex("by_expires_at")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    let count = 0;
    for (const run of expired) {
      await ctx.db.delete(run._id);
      count++;
    }

    if (count > 0) {
      console.log(`Cleaned up ${count} expired workflow run(s)`);
    }
  },
});
