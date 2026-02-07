import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
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

// --- Functions for webhook handler (no Clerk auth context) ---
// Security: Razorpay signature is verified in the API route before calling these.

export const getByRazorpayId = query({
  args: { razorpaySubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_razorpay_id", (q) =>
        q.eq("razorpaySubscriptionId", args.razorpaySubscriptionId)
      )
      .unique();
  },
});

export const activateFromWebhook = mutation({
  args: {
    userId: v.id("users"),
    razorpaySubscriptionId: v.string(),
    planType: v.union(v.literal("basic"), v.literal("pro")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for existing subscription with this Razorpay ID (idempotency)
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_razorpay_id", (q) =>
        q.eq("razorpaySubscriptionId", args.razorpaySubscriptionId)
      )
      .unique();

    if (existing) {
      // Already processed — update status if needed
      if (existing.status !== "active") {
        await ctx.db.patch(existing._id, { status: "active" });
        await ctx.db.patch(args.userId, {
          subscriptionTier: args.planType,
          updatedAt: Date.now(),
        });
      }
      return existing._id;
    }

    // Update user's subscription tier
    await ctx.db.patch(args.userId, {
      subscriptionTier: args.planType,
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("subscriptions", {
      userId: args.userId,
      razorpaySubscriptionId: args.razorpaySubscriptionId,
      planType: args.planType,
      status: "active",
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: Date.now(),
    });
  },
});

export const updateFromWebhook = mutation({
  args: {
    razorpaySubscriptionId: v.string(),
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
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_razorpay_id", (q) =>
        q.eq("razorpaySubscriptionId", args.razorpaySubscriptionId)
      )
      .unique();

    if (!subscription) return;

    const updates: Record<string, unknown> = { status: args.status };
    if (args.currentPeriodStart !== undefined)
      updates.currentPeriodStart = args.currentPeriodStart;
    if (args.currentPeriodEnd !== undefined)
      updates.currentPeriodEnd = args.currentPeriodEnd;

    await ctx.db.patch(subscription._id, updates);

    // Update user subscription tier based on status
    if (args.status === "cancelled" || args.status === "expired") {
      await ctx.db.patch(subscription.userId, {
        subscriptionTier: "free" as const,
        updatedAt: Date.now(),
      });
      return; // Early exit to prevent any subsequent overwrite
    }

    if (args.status === "active") {
      const sub = await ctx.db.get(subscription._id);
      if (sub) {
        await ctx.db.patch(subscription.userId, {
          subscriptionTier: sub.planType,
          updatedAt: Date.now(),
        });
      }
    }
  },
});
