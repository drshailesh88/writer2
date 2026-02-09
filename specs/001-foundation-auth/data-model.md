# Data Model: Foundation and Authentication

**Feature**: 001-foundation-auth
**Date**: 2026-02-06

## Entities

### User

Represents a registered V1 Drafts user. Synced from Clerk on first authenticated access.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clerkId | string | Yes | Clerk user ID (unique, indexed) |
| email | string | Yes | User's email address |
| name | string | Yes | Display name (from Clerk profile) |
| avatarUrl | string | No | Profile image URL (from Google or Clerk) |
| subscriptionTier | string | Yes | One of: "none", "free", "basic", "pro". Defaults to "free" |
| createdAt | number | Yes | Unix timestamp of account creation in V1 Drafts |
| updatedAt | number | Yes | Unix timestamp of last profile update |

**Indexes**:
- `by_clerk_id` on `clerkId` (unique lookup)
- `by_email` on `email` (duplicate prevention)

**Validation Rules**:
- `clerkId` must be non-empty string
- `email` must be valid email format
- `name` must be non-empty string (1-200 characters)
- `subscriptionTier` must be one of the allowed values
- `createdAt` and `updatedAt` must be positive integers

**State Transitions**:
- `subscriptionTier`: "none" (pre-signup) -> "free" (on account creation) -> "basic" (on payment) -> "pro" (future upgrade)
- Note: Tier transitions are managed by the payments feature, not this feature. This feature only sets the initial "free" default.

## Relationships

```text
Clerk Identity (external) --[1:1]--> User (Convex)
```

- Each Clerk identity maps to exactly one Convex User record
- The User record is created on first authenticated access (not via webhook in V1)
- If no User record exists for the authenticated Clerk identity, one is created automatically

## Notes

- No Session entity needed in Convex: Clerk manages sessions externally
- No password storage: Clerk handles all credential management
- The User entity is intentionally minimal for this feature; additional fields (usage counts, preferences) will be added by subsequent features
