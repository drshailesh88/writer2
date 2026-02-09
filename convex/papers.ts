import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const save = mutation({
  args: {
    externalId: v.string(),
    source: v.union(
      v.literal("pubmed"),
      v.literal("semantic_scholar"),
      v.literal("openalex"),
      v.literal("uploaded")
    ),
    title: v.string(),
    authors: v.array(v.string()),
    journal: v.optional(v.string()),
    year: v.optional(v.number()),
    abstract: v.optional(v.string()),
    doi: v.optional(v.string()),
    url: v.optional(v.string()),
    isOpenAccess: v.boolean(),
    metadata: v.optional(v.any()),
    collectionId: v.optional(v.id("collections")),
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

    // Enforce paper library limit for free tier (50 papers)
    if (user.subscriptionTier === "free" || user.subscriptionTier === "none") {
      const userPapers = await ctx.db
        .query("papers")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect();

      if (userPapers.length >= 50) {
        throw new ConvexError(
          "Paper library limit reached (50 papers). Please upgrade to Basic or Pro for unlimited storage."
        );
      }
    }

    // Check for duplicate by externalId for this user
    const existing = await ctx.db
      .query("papers")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .collect();

    const userDuplicate = existing.find((p) => p.userId === user._id);
    if (userDuplicate) {
      return userDuplicate._id;
    }

    return await ctx.db.insert("papers", {
      userId: user._id,
      externalId: args.externalId,
      source: args.source,
      title: args.title,
      authors: args.authors,
      journal: args.journal,
      year: args.year,
      abstract: args.abstract,
      doi: args.doi,
      url: args.url,
      isOpenAccess: args.isOpenAccess,
      metadata: args.metadata,
      collectionId: args.collectionId,
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const paper = await ctx.db.get(args.paperId);
    if (!paper) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || paper.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    return paper;
  },
});

export const list = query({
  args: {
    collectionId: v.optional(v.id("collections")),
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

    if (args.collectionId) {
      return await ctx.db
        .query("papers")
        .withIndex("by_collection_id", (q) =>
          q.eq("collectionId", args.collectionId!)
        )
        .collect()
        .then((papers) => papers.filter((p) => p.userId === user._id));
    }

    return await ctx.db
      .query("papers")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getByExternalId = query({
  args: { externalId: v.string() },
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

    const papers = await ctx.db
      .query("papers")
      .withIndex("by_external_id", (q) =>
        q.eq("externalId", args.externalId)
      )
      .collect();

    return papers.find((p) => p.userId === user._id) ?? null;
  },
});

export const update = mutation({
  args: {
    paperId: v.id("papers"),
    collectionId: v.optional(v.id("collections")),
    pdfFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || paper.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    const updates: Record<string, unknown> = {};
    if (args.collectionId !== undefined) updates.collectionId = args.collectionId;
    if (args.pdfFileId !== undefined) updates.pdfFileId = args.pdfFileId;

    await ctx.db.patch(args.paperId, updates);
  },
});

export const count = query({
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

    if (!user) return 0;

    const papers = await ctx.db
      .query("papers")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    return papers.length;
  },
});

export const remove = mutation({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const paper = await ctx.db.get(args.paperId);
    if (!paper) {
      throw new ConvexError("Paper not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || paper.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    await ctx.db.delete(args.paperId);
  },
});
