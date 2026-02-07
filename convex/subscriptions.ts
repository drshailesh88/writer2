import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const create = mutation({
  args: {
    razorpaySubscriptionId: v.string(),
    planType: v.union(v.literal("basic"), v.literal("pro")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
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

    // Update user's subscription tier
    await ctx.db.patch(user._id, {
      subscriptionTier: args.planType,
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("subscriptions", {
      userId: user._id,
      razorpaySubscriptionId: args.razorpaySubscriptionId,
      planType: args.planType,
      status: "active",
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: Date.now(),
    });
  },
});

export const getByUser = query({
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

    if (!user) return null;

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return subscriptions[0] ?? null;
  },
});

export const updateStatus = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new ConvexError("Subscription not found");
    }

    const updates: Record<string, unknown> = { status: args.status };
    if (args.currentPeriodStart !== undefined)
      updates.currentPeriodStart = args.currentPeriodStart;
    if (args.currentPeriodEnd !== undefined)
      updates.currentPeriodEnd = args.currentPeriodEnd;

    await ctx.db.patch(args.subscriptionId, updates);

    // Update user subscription tier based on status
    if (args.status === "cancelled" || args.status === "expired") {
      await ctx.db.patch(subscription.userId, {
        subscriptionTier: "free" as const,
        updatedAt: Date.now(),
      });
    }
  },
});
