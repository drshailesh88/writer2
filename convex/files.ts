import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Verify the authenticated user owns a paper with this storageId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if user owns a paper with this PDF file
    const papers = await ctx.db
      .query("papers")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    const ownsFile = papers.some((p) => p.pdfFileId === args.storageId);
    if (!ownsFile) {
      throw new ConvexError("Access denied — file not found in your library");
    }

    return await ctx.storage.getUrl(args.storageId);
  },
});
