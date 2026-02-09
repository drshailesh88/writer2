import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { checkUsageLimit } from "./lib/subscriptionLimits";

export const create = mutation({
  args: {
    documentId: v.id("documents"),
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
      throw new ConvexError("Document not found or not authorized");
    }

    // Check Learn Mode usage limit
    const tier = user.subscriptionTier;
    const usageCheck = checkUsageLimit(tier, "learnMode", user.learnModeSessionsUsed);
    if (!usageCheck.allowed) {
      throw new ConvexError(usageCheck.reason ?? "Learn Mode session limit reached. Please upgrade your plan.");
    }

    // Increment usage counter
    await ctx.db.patch(user._id, {
      learnModeSessionsUsed: (user.learnModeSessionsUsed ?? 0) + 1,
      updatedAt: Date.now(),
    });

    const now = Date.now();
    return await ctx.db.insert("learnModeSessions", {
      userId: user._id,
      documentId: args.documentId,
      currentStage: "understand",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const get = query({
  args: { sessionId: v.id("learnModeSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || session.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    return session;
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

    const sessions = await ctx.db
      .query("learnModeSessions")
      .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
      .collect();

    return sessions.find((s) => s.userId === user._id) ?? null;
  },
});

export const update = mutation({
  args: {
    sessionId: v.id("learnModeSessions"),
    currentStage: v.optional(
      v.union(
        v.literal("understand"),
        v.literal("literature"),
        v.literal("outline"),
        v.literal("drafting"),
        v.literal("feedback")
      )
    ),
    conversationHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("coach"), v.literal("student")),
          content: v.string(),
          stage: v.union(
            v.literal("understand"),
            v.literal("literature"),
            v.literal("outline"),
            v.literal("drafting"),
            v.literal("feedback")
          ),
          timestamp: v.number(),
        })
      )
    ),
    feedbackGiven: v.optional(
      v.array(
        v.object({
          category: v.union(
            v.literal("thesis_focus"),
            v.literal("evidence_reasoning"),
            v.literal("methodology_rigor"),
            v.literal("structure_organization"),
            v.literal("language_tone")
          ),
          suggestion: v.string(),
          example: v.optional(v.string()),
          addressed: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new ConvexError("Session not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || session.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.currentStage !== undefined) updates.currentStage = args.currentStage;
    if (args.conversationHistory !== undefined)
      updates.conversationHistory = args.conversationHistory;
    if (args.feedbackGiven !== undefined)
      updates.feedbackGiven = args.feedbackGiven;

    await ctx.db.patch(args.sessionId, updates);
  },
});
