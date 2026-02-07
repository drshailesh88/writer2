# API Contracts: Convex Functions

**Feature**: 001-foundation-auth
**Date**: 2026-02-06

## Overview

All backend operations use Convex TypeScript functions (zero SQL, per Constitution Article 3.1). These functions are called from Next.js via the Convex React client.

---

## Users Module (`convex/users.ts`)

### `users.getOrCreate` — Mutation

Creates a user record on first authenticated access, or returns existing user.

**Auth**: Required (Clerk identity must be present)

**Input**: None (reads from `ctx.auth.getUserIdentity()`)

**Output**:
```typescript
{
  _id: Id<"users">;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string | undefined;
  subscriptionTier: "none" | "free" | "basic" | "pro";
  createdAt: number;
  updatedAt: number;
}
```

**Behavior**:
1. Get authenticated identity from `ctx.auth.getUserIdentity()`
2. If no identity, throw `ConvexError("Not authenticated")`
3. Query `users` table by `clerkId` index
4. If user exists, return it
5. If not, insert new user with: `clerkId`, `email`, `name`, `avatarUrl` from identity, `subscriptionTier: "free"`, `createdAt: Date.now()`, `updatedAt: Date.now()`
6. Return the new user

---

### `users.getCurrent` — Query

Returns the current authenticated user's record.

**Auth**: Required

**Input**: None

**Output**:
```typescript
{
  _id: Id<"users">;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string | undefined;
  subscriptionTier: "none" | "free" | "basic" | "pro";
  createdAt: number;
  updatedAt: number;
} | null
```

**Behavior**:
1. Get authenticated identity from `ctx.auth.getUserIdentity()`
2. If no identity, return `null`
3. Query `users` table by `clerkId` index
4. Return user or `null`

---

## Schema (`convex/schema.ts`)

```typescript
// Convex schema definition
{
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("none"),
      v.literal("free"),
      v.literal("basic"),
      v.literal("pro")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
}
```

---

## Middleware (`middleware.ts`)

### Route Protection

**Public routes** (no auth required):
- `/` (landing page)
- `/sign-in(.*)` (Clerk sign-in)
- `/sign-up(.*)` (Clerk sign-up)

**Protected routes** (auth required, redirect to `/sign-in` if unauthenticated):
- `/dashboard`
- `/dashboard/(.*)`
- All other routes under `(protected)` group

**After sign-in redirect**: `/dashboard`
**After sign-up redirect**: `/dashboard`
