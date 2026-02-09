import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { ConvexError, v } from "convex/values";

// ─── Auth-gated mutations (called from API routes with Clerk token) ───

export const create = mutation({
  args: {
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

    // Verify document ownership
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== user._id) {
      throw new ConvexError("Document not found or access denied");
    }

    // Size guard: reject excessively large opaque JSON payloads (> 2MB serialized)
    const MAX_JSON_SIZE = 2 * 1024 * 1024;
    for (const field of ["stepData", "runObject"] as const) {
      const val = args[field];
      if (val !== undefined && JSON.stringify(val).length > MAX_JSON_SIZE) {
        throw new ConvexError(`${field} exceeds maximum allowed size`);
      }
    }

    const now = Date.now();
    const WORKFLOW_TTL_MS = 30 * 60 * 1000; // 30 minutes

    return await ctx.db.insert("workflowRuns", {
      userId: user._id,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const run = await ctx.db.get(args.workflowRunId);
    if (!run) {
      throw new ConvexError("Workflow run not found");
    }

    // Verify the authenticated user owns this workflow run
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || run.userId !== user._id) {
      throw new ConvexError("Access denied");
    }

    // Size guard: reject excessively large opaque JSON payloads (> 2MB serialized)
    const MAX_SIZE = 2 * 1024 * 1024;
    for (const field of ["stepData", "runObject"] as const) {
      const val = args[field];
      if (val !== undefined && JSON.stringify(val).length > MAX_SIZE) {
        throw new ConvexError(`${field} exceeds maximum allowed size`);
      }
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const runs = await ctx.db
      .query("workflowRuns")
      .withIndex("by_user_and_document", (q) =>
        q.eq("userId", user._id).eq("documentId", args.documentId)
      )
      .order("desc")
      .collect();

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const run = await ctx.db.get(args.workflowRunId);
    if (!run) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || run.userId !== user._id) return null;

    return run;
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
    if (!user) return [];

    return await ctx.db
      .query("workflowRuns")
      .withIndex("by_user_and_document", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// ─── Internal functions (called from within Convex only) ───

export const internalGetByDocument = internalQuery({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("workflowRuns")
      .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .collect();

    return (
      runs.find(
        (r) => r.status === "running" || r.status === "suspended"
      ) ?? null
    );
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
