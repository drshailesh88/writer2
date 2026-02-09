import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { checkUsageLimit } from "./lib/subscriptionLimits";

export const create = mutation({
  args: {
    title: v.string(),
    mode: v.union(
      v.literal("learn"),
      v.literal("draft_guided"),
      v.literal("draft_handsoff")
    ),
    citationStyle: v.union(
      v.literal("vancouver"),
      v.literal("apa"),
      v.literal("ama"),
      v.literal("chicago")
    ),
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

    // Enforce Draft Mode gating for free/none tiers
    if (args.mode === "draft_guided" || args.mode === "draft_handsoff") {
      const draftCheck = checkUsageLimit(user.subscriptionTier, "draftMode", 0);
      if (!draftCheck.allowed) {
        throw new ConvexError(
          "Draft Mode is not available on the free plan. Please upgrade to Basic or Pro."
        );
      }
    }

    const now = Date.now();
    return await ctx.db.insert("documents", {
      userId: user._id,
      title: args.title,
      mode: args.mode,
      citationStyle: args.citationStyle,
      wordCount: 0,
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const get = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const doc = await ctx.db.get(args.documentId);
    if (!doc) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || doc.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    return doc;
  },
});

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
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
      return [];
    }

    if (args.status) {
      return await ctx.db
        .query("documents")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", user._id).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("documents")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const update = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.any()),
    currentStage: v.optional(v.string()),
    outlineData: v.optional(v.any()),
    approvedPapers: v.optional(v.any()),
    citationStyle: v.optional(
      v.union(
        v.literal("vancouver"),
        v.literal("apa"),
        v.literal("ama"),
        v.literal("chicago")
      )
    ),
    wordCount: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new ConvexError("Document not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || doc.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    // Size guard: reject excessively large opaque JSON payloads (> 2MB serialized)
    const MAX_JSON_SIZE = 2 * 1024 * 1024;
    for (const field of ["content", "outlineData", "approvedPapers"] as const) {
      const val = args[field];
      if (val !== undefined && JSON.stringify(val).length > MAX_JSON_SIZE) {
        throw new ConvexError(`${field} exceeds maximum allowed size`);
      }
    }

    const { documentId, ...updates } = args;
    await ctx.db.patch(documentId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const archive = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new ConvexError("Document not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || doc.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    await ctx.db.patch(args.documentId, {
      status: "archived" as const,
      updatedAt: Date.now(),
    });
  },
});
