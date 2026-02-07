import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      return existingUser;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? "",
      avatarUrl: identity.pictureUrl ?? undefined,
      subscriptionTier: "free",
      plagiarismChecksUsed: 0,
      aiDetectionChecksUsed: 0,
      deepResearchUsed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    institution: v.optional(v.string()),
    specialization: v.optional(v.string()),
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

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.institution !== undefined) updates.institution = args.institution;
    if (args.specialization !== undefined)
      updates.specialization = args.specialization;

    await ctx.db.patch(user._id, updates);
  },
});

export const resetMonthlyUsage = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      plagiarismChecksUsed: 0,
      aiDetectionChecksUsed: 0,
      deepResearchUsed: 0,
      updatedAt: Date.now(),
    });
  },
});
