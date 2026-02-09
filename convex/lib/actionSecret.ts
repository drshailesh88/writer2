import { ConvexError } from "convex/values";

/**
 * Require a shared secret for server-only Convex actions.
 * Set CONVEX_ACTION_SECRET in the Convex env and Next.js server env.
 */
export function requireActionSecret(provided: string | undefined): void {
  const secret = process.env.CONVEX_ACTION_SECRET;
  if (!secret) {
    throw new ConvexError("Server action secret not configured");
  }
  if (!provided || provided !== secret) {
    throw new ConvexError("Unauthorized");
  }
}
