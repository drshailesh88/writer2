# Implementation Plan: Convex Database Schema

**Branch**: `002-convex-database-schema` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-convex-database-schema/spec.md`

## Summary

Implement the complete Convex database schema for V1 Drafts: 10 entity tables (extending the existing users table + 9 new tables), with indexes for all common query patterns, CRUD mutations/queries for each table, PDF file storage via Convex's built-in file storage, and subscription tier checking with usage limit enforcement. All operations are TypeScript-only (zero SQL per constitution).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Convex 1.31.7 (defineSchema, defineTable, v validators, mutation, query, internalMutation)
**Storage**: Convex (serverless document database with built-in file storage)
**Testing**: Convex test helpers for unit tests; Playwright 1.58.2 for E2E
**Target Platform**: Web (Next.js 14+ on Vercel)
**Project Type**: Web application (Next.js frontend + Convex serverless backend)
**Performance Goals**: Sub-second queries for up to 10,000 records per table; document operations under 500ms
**Constraints**: Zero SQL (constitution Article 3.1); all operations via Convex TypeScript functions; data scoped per user
**Scale/Scope**: Single-tenant per user; ~10 tables; ~50 Convex functions (queries + mutations)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Requirement | Status |
|------|-------------|--------|
| Article 2: Tech Stack | Convex for database (no SQL) | PASS — using Convex defineSchema/defineTable |
| Article 3.1: Zero SQL | All operations via TypeScript functions | PASS — all mutations/queries are TypeScript |
| Article 3.2: No Vendor Lock-in | N/A for database layer | PASS — Convex is the chosen DB per constitution |
| Article 3.3: Mobile Responsive | N/A for backend schema | PASS — no UI in this task |
| Article 3.4: No Custom Code Where OSS Exists | Using Convex built-in file storage, not custom | PASS |
| Article 6: Pricing/Usage Limits | Must enforce tier limits | PASS — helper functions will encode pricing table |
| Article 7.1: Testing | Playwright E2E + unit tests | PASS — test strategy defined |
| Article 7.2: TypeScript Strict | No `any` types | PASS — using Convex validators for type safety |
| Article 7.5: Security | No secrets in code; data scoped per user | PASS — Clerk auth + userId scoping |

## Project Structure

### Documentation (this feature)

```text
specs/002-convex-database-schema/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Convex function signatures)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
convex/
├── schema.ts            # EXTEND existing — add 9 new tables + extend users
├── users.ts             # EXTEND existing — add missing fields, update getOrCreate
├── documents.ts         # NEW — CRUD mutations/queries for documents
├── papers.ts            # NEW — CRUD mutations/queries for papers
├── collections.ts       # NEW — CRUD mutations/queries for collections
├── citations.ts         # NEW — CRUD mutations/queries for citations
├── plagiarismChecks.ts  # NEW — CRUD mutations/queries for plagiarism checks
├── aiDetectionChecks.ts # NEW — CRUD mutations/queries for AI detection checks
├── deepResearchReports.ts # NEW — CRUD mutations/queries for deep research reports
├── learnModeSessions.ts # NEW — CRUD mutations/queries for learn mode sessions
├── subscriptions.ts     # NEW — CRUD mutations/queries for subscriptions
├── files.ts             # NEW — file upload/download utilities
├── lib/
│   └── subscriptionLimits.ts # NEW — tier checking & usage limit enforcement
├── auth.config.ts       # EXISTING — no changes
└── _generated/          # AUTO — Convex codegen
```

**Structure Decision**: All Convex functions live in the `convex/` directory (required by Convex). One file per entity, following the established pattern from `convex/users.ts`. Shared helpers in `convex/lib/`.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
