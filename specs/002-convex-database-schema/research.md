# Research: Convex Database Schema

**Feature**: 002-convex-database-schema
**Date**: 2026-02-07

## Decision 1: Convex Schema Design Patterns

**Decision**: Use `defineSchema` with `defineTable` and Convex validators (`v.string()`, `v.number()`, `v.optional()`, `v.union()`, `v.array()`, `v.any()`) for all table definitions.

**Rationale**: Convex's built-in schema system provides TypeScript type safety, automatic validation, and seamless integration with queries/mutations. The `v` validators ensure runtime type checking that matches TypeScript types.

**Alternatives considered**:
- Manual validation in each mutation — rejected because Convex schema validation is automatic and more reliable.
- No schema (schemaless) — rejected because the constitution requires TypeScript strict mode and we need type safety.

## Decision 2: Timestamps as Numbers

**Decision**: Store all timestamps as `v.number()` (Unix epoch milliseconds from `Date.now()`), not ISO strings or Convex's built-in `_creationTime`.

**Rationale**: The existing `users` table already uses `v.number()` for `createdAt`/`updatedAt`. Maintaining consistency is critical. `Date.now()` gives millisecond precision and is easy to compare/sort. Convex's `_creationTime` is auto-generated but not controllable.

**Alternatives considered**:
- ISO 8601 strings — rejected because number comparison is faster for sorting/filtering.
- Convex `_creationTime` only — rejected because we also need `updatedAt` which Convex doesn't auto-manage.

## Decision 3: References via String IDs vs v.id()

**Decision**: Use `v.id("tableName")` for all foreign key references within Convex tables. This leverages Convex's built-in reference validation.

**Rationale**: `v.id("users")` ensures the referenced document actually exists in the users table and provides TypeScript type narrowing. This is the idiomatic Convex approach.

**Alternatives considered**:
- Plain `v.string()` for references — rejected because we lose Convex's built-in referential integrity hints and TypeScript inference.

## Decision 4: JSON Fields (content, metadata, etc.)

**Decision**: Use `v.any()` for flexible JSON fields (document content, metadata, conversation history, feedback, sources, cited papers, sentence results). Use typed objects where the structure is well-defined.

**Rationale**: Fields like Tiptap document content and conversation history have complex, variable structures that don't benefit from strict Convex validation. Using `v.any()` allows flexibility while the application layer handles validation. For well-defined structures, use `v.object()` with specific fields.

**Alternatives considered**:
- `v.string()` with JSON.stringify/parse — rejected because it adds serialization overhead and loses any type information.
- Deeply nested `v.object()` for all JSON — rejected because structures like Tiptap content are defined by external libraries and change frequently.

## Decision 5: Index Strategy

**Decision**: Create indexes on:
- `by_user_id` on `userId` for every table that has userId (scoped data access)
- `by_document_id` on `documentId` for citations, learn mode sessions
- `by_external_id` on `externalId` for papers (dedup on save)
- `by_status` on `status` for plagiarism checks, AI detection checks, deep research reports
- `by_user_and_status` compound index on `[userId, status]` for filtered queries
- `by_clerk_id` on `clerkId` for users (existing)
- `by_collection_id` on `collectionId` for papers in a collection

**Rationale**: Convex indexes are required for efficient queries. Every table will be queried by userId (data scoping). Additional indexes match the query patterns needed by downstream features.

**Alternatives considered**:
- Index everything — rejected because unused indexes slow down writes.
- No compound indexes — rejected because filtering by user AND status is a common pattern.

## Decision 6: File Storage for PDFs

**Decision**: Use Convex's built-in file storage (`ctx.storage.store()`, `ctx.storage.getUrl()`). Store the resulting storage ID as `v.optional(v.id("_storage"))` on the papers table.

**Rationale**: Convex file storage is the native solution — no external S3 bucket needed. It handles uploads, generates URLs, and integrates with Convex's auth system. Aligns with constitution Article 3.4 (no custom code where built-in exists).

**Alternatives considered**:
- AWS S3 with presigned URLs — rejected because it adds external dependency and complexity.
- Store PDFs as base64 in documents — rejected because it wastes storage and has size limits.

## Decision 7: Subscription Limit Enforcement

**Decision**: Create a pure helper function `checkUsageLimit(user, feature)` that reads the user's subscription tier and current usage counters, compares against a hardcoded limits table, and returns `{allowed: boolean, reason?: string}`. This function is called at the start of any mutation that consumes a limited resource.

**Rationale**: Centralizing limits in one function avoids duplication across plagiarism, AI detection, and deep research mutations. Hardcoded limits match the constitution's pricing table and can be updated in one place.

**Alternatives considered**:
- Per-mutation inline checks — rejected because limits would be duplicated in 3+ places.
- External limits service — rejected because over-engineering for a simple lookup table.

## Decision 8: Optional userId for Plagiarism Funnel

**Decision**: The `plagiarismChecks` table uses `v.optional(v.id("users"))` for userId. Anonymous checks (no-signup funnel per constitution Article 6) store null for userId.

**Rationale**: The PRD specifies "1 check (1000 words)" for no-signup users. These checks must be recorded but cannot be linked to a user. Making userId optional is the simplest approach.

**Alternatives considered**:
- Separate table for anonymous checks — rejected because it duplicates schema and logic.
- Require signup before check — rejected because it contradicts the PRD's acquisition funnel.
