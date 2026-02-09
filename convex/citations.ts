import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const insert = mutation({
  args: {
    documentId: v.id("documents"),
    paperId: v.id("papers"),
    sectionName: v.string(),
    position: v.number(),
    citationText: v.string(),
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

    // Verify paper ownership
    const paper = await ctx.db.get(args.paperId);
    if (!paper || paper.userId !== user._id) {
      throw new ConvexError("Paper not found or not authorized");
    }

    return await ctx.db.insert("citations", {
      documentId: args.documentId,
      paperId: args.paperId,
      sectionName: args.sectionName,
      position: args.position,
      citationText: args.citationText,
    });
  },
});

export const listByDocument = query({
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

    if (!user) {
      return [];
    }

    // Verify document ownership
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== user._id) {
      return [];
    }

    const citations = await ctx.db
      .query("citations")
      .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
      .collect();

    return citations.sort((a, b) => a.position - b.position);
  },
});

export const update = mutation({
  args: {
    citationId: v.id("citations"),
    position: v.optional(v.number()),
    citationText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const citation = await ctx.db.get(args.citationId);
    if (!citation) {
      throw new ConvexError("Citation not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Verify document ownership through the citation's document
    const doc = await ctx.db.get(citation.documentId);
    if (!doc || doc.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    const updates: Record<string, unknown> = {};
    if (args.position !== undefined) updates.position = args.position;
    if (args.citationText !== undefined) updates.citationText = args.citationText;

    await ctx.db.patch(args.citationId, updates);
  },
});

export const remove = mutation({
  args: { citationId: v.id("citations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const citation = await ctx.db.get(args.citationId);
    if (!citation) {
      throw new ConvexError("Citation not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const doc = await ctx.db.get(citation.documentId);
    if (!doc || doc.userId !== user._id) {
      throw new ConvexError("Not authorized");
    }

    await ctx.db.delete(args.citationId);
  },
});

// Fetch citations with full paper data for bibliography generation
export const listWithPapers = query({
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

    if (!user) {
      return [];
    }

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== user._id) {
      return [];
    }

    const citations = await ctx.db
      .query("citations")
      .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
      .collect();

    const sorted = citations.sort((a, b) => a.position - b.position);

    // Resolve paper data for each citation
    const withPapers = await Promise.all(
      sorted.map(async (citation) => {
        const paper = await ctx.db.get(citation.paperId);
        return { ...citation, paper };
      })
    );

    return withPapers.filter((c) => c.paper !== null);
  },
});
