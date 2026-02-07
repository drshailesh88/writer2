import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
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

    return await ctx.db.insert("collections", {
      userId: user._id,
      name: args.name,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
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
      .query("collections")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const update = mutation({
  args: {
    collectionId: v.id("collections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new ConvexError("Collection not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || collection.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.collectionId, updates);
  },
});

export const remove = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new ConvexError("Collection not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || collection.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    // Unlink papers from this collection
    const papers = await ctx.db
      .query("papers")
      .withIndex("by_collection_id", (q) =>
        q.eq("collectionId", args.collectionId)
      )
      .collect();

    for (const paper of papers) {
      await ctx.db.patch(paper._id, { collectionId: undefined });
    }

    await ctx.db.delete(args.collectionId);
  },
});
