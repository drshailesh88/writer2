import { ConvexError, v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";

const MAX_CONCURRENT_SESSIONS = 2;
const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes — sessions expire after inactivity

/** Register or refresh a session heartbeat. Returns error if session limit exceeded. */
export const heartbeat = mutation({
  args: { sessionId: v.string() },
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

    const now = Date.now();

    // Check if this session already exists
    const existingSession = await ctx.db
      .query("sessionPresence")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession) {
      // Refresh existing session
      await ctx.db.patch(existingSession._id, { lastActive: now });
      return { allowed: true };
    }

    // Count active sessions for this user (exclude expired ones)
    const cutoff = now - SESSION_TIMEOUT_MS;
    const activeSessions = await ctx.db
      .query("sessionPresence")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    const liveSessionCount = activeSessions.filter(
      (s) => s.lastActive > cutoff
    ).length;

    // Clean up expired sessions
    for (const session of activeSessions) {
      if (session.lastActive <= cutoff) {
        await ctx.db.delete(session._id);
      }
    }

    if (liveSessionCount >= MAX_CONCURRENT_SESSIONS) {
      throw new ConvexError(
        `Maximum ${MAX_CONCURRENT_SESSIONS} concurrent sessions allowed. Please close another session first.`
      );
    }

    // Register new session
    await ctx.db.insert("sessionPresence", {
      userId: user._id,
      sessionId: args.sessionId,
      lastActive: now,
    });

    return { allowed: true };
  },
});

/** Remove a session on logout/close. */
export const removeSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessionPresence")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

/** Internal: clean up expired sessions. Called by cron. */
export const cleanExpiredSessions = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - SESSION_TIMEOUT_MS;
    const expired = await ctx.db.query("sessionPresence").collect();
    for (const session of expired) {
      if (session.lastActive <= cutoff) {
        await ctx.db.delete(session._id);
      }
    }
  },
});
