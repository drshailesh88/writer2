export function requireConvexActionSecret(): string {
  const secret = process.env.CONVEX_ACTION_SECRET;
  if (!secret) {
    throw new Error("CONVEX_ACTION_SECRET not configured");
  }
  return secret;
}
