# Tasks: Convex Database Schema

**Input**: Design documents from `/specs/002-convex-database-schema/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not included (not explicitly requested in spec). Quickstart.md has manual verification steps.

**Organization**: Tasks grouped by user story. Schema (foundational) must complete before any story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US6)
- File paths relative to repo root

---

## Phase 1: Setup

**Purpose**: No setup needed — Convex project already initialized in Task 1.

(No tasks — skip to Phase 2)

---

## Phase 2: Foundational (Schema + Users Extension)

**Purpose**: Complete schema definition and extend users table. BLOCKS all user story work.

- [ ] T001 Extend convex/schema.ts — add all 9 new tables (documents, papers, collections, citations, plagiarismChecks, aiDetectionChecks, deepResearchReports, learnModeSessions, subscriptions) with all fields and indexes per data-model.md
- [ ] T002 Extend convex/schema.ts users table — add missing fields (institution, specialization, razorpayCustomerId, plagiarismChecksUsed, aiDetectionChecksUsed, deepResearchUsed) per data-model.md
- [ ] T003 Update convex/users.ts getOrCreate mutation — initialize new fields (usage counters to 0, optional fields to undefined)
- [ ] T004 [P] Create convex/users.ts updateProfile mutation — update institution and specialization per contracts/convex-functions.md
- [ ] T005 [P] Create convex/lib/subscriptionLimits.ts — SUBSCRIPTION_LIMITS constant and checkUsageLimit pure function per contracts/convex-functions.md
- [ ] T006 Deploy schema to Convex and verify all tables appear in dashboard (`npx convex dev`)

**Checkpoint**: Schema deployed, users table extended, subscription limits helper ready. All user stories can now proceed.

---

## Phase 3: User Story 1 — Document Management (Priority: P1)

**Goal**: Users can create, read, update, list, and archive documents.

**Independent Test**: Create a document, list it, update it, archive it — all operations succeed with correct data.

### Implementation

- [ ] T007 [US1] Create convex/documents.ts — implement `documents.create` mutation with auth, userId lookup, defaults (wordCount=0, status=in_progress, timestamps)
- [ ] T008 [US1] Create convex/documents.ts — implement `documents.get` query with ownership check (userId must match caller)
- [ ] T009 [US1] Create convex/documents.ts — implement `documents.list` query with optional status filter, scoped to user, ordered by updatedAt desc
- [ ] T010 [US1] Create convex/documents.ts — implement `documents.update` mutation with ownership check, partial updates, updatedAt refresh
- [ ] T011 [US1] Create convex/documents.ts — implement `documents.archive` mutation (sets status to "archived", ownership check)

**Checkpoint**: Document CRUD fully functional. Commit and verify via Convex dashboard.

---

## Phase 4: User Story 2 — Paper Library & Collections (Priority: P2)

**Goal**: Users can save papers, create collections, organize papers into collections, upload PDFs.

**Independent Test**: Save a paper, create a collection, assign paper to collection, upload a PDF, verify all persisted.

### Implementation

- [ ] T012 [P] [US2] Create convex/collections.ts — implement `collections.create`, `collections.list`, `collections.update`, `collections.remove` per contracts
- [ ] T013 [P] [US2] Create convex/files.ts — implement `files.generateUploadUrl` and `files.getUrl` using Convex storage API
- [ ] T014 [US2] Create convex/papers.ts — implement `papers.save` mutation (dedup check via externalId index, auth, timestamps)
- [ ] T015 [US2] Create convex/papers.ts — implement `papers.get`, `papers.list` (with optional collectionId filter), `papers.getByExternalId` queries
- [ ] T016 [US2] Create convex/papers.ts — implement `papers.update` (collectionId reassignment, pdfFileId linking) and `papers.remove` mutations

**Checkpoint**: Paper library and collections working. PDF upload verified. Commit.

---

## Phase 5: User Story 3 — Citations in Documents (Priority: P3)

**Goal**: Users can insert, list, update, and remove citations within documents.

**Independent Test**: Insert a citation linking a document and paper, list citations by document, verify ordering by position.

### Implementation

- [ ] T017 [US3] Create convex/citations.ts — implement `citations.insert` mutation with auth and document/paper ownership validation
- [ ] T018 [US3] Create convex/citations.ts — implement `citations.listByDocument` query (ordered by position), `citations.update`, `citations.remove`

**Checkpoint**: Citations CRUD working. Commit.

---

## Phase 6: User Story 4 — Plagiarism & AI Detection Checks (Priority: P4)

**Goal**: Users can submit plagiarism and AI detection checks, with results stored and usage tracked.

**Independent Test**: Submit a plagiarism check, update with results, verify usage counter incremented and limit enforced.

### Implementation

- [ ] T019 [P] [US4] Create convex/plagiarismChecks.ts — implement `plagiarismChecks.create` (with limit check via subscriptionLimits.ts, increment user counter, optional auth for funnel)
- [ ] T020 [P] [US4] Create convex/aiDetectionChecks.ts — implement `aiDetectionChecks.create` (with limit check, increment user counter, auth required)
- [ ] T021 [US4] Create convex/plagiarismChecks.ts — implement `plagiarismChecks.updateResult`, `plagiarismChecks.get`, `plagiarismChecks.listByUser`
- [ ] T022 [US4] Create convex/aiDetectionChecks.ts — implement `aiDetectionChecks.updateResult`, `aiDetectionChecks.get`, `aiDetectionChecks.listByUser`

**Checkpoint**: Both check types working with usage limit enforcement. Commit.

---

## Phase 7: User Story 5 — Deep Research & Learn Mode Sessions (Priority: P5)

**Goal**: Users can create deep research reports and Learn Mode coaching sessions.

**Independent Test**: Create a research report, update through lifecycle; create a Learn Mode session, progress through stages.

### Implementation

- [ ] T023 [P] [US5] Create convex/deepResearchReports.ts — implement `deepResearchReports.create` (with limit check), `deepResearchReports.updateResult`, `deepResearchReports.get`, `deepResearchReports.listByUser`
- [ ] T024 [P] [US5] Create convex/learnModeSessions.ts — implement `learnModeSessions.create`, `learnModeSessions.get`, `learnModeSessions.getByDocument`, `learnModeSessions.update`

**Checkpoint**: Research reports and learn mode sessions working. Commit.

---

## Phase 8: User Story 6 — Subscription & Usage Tracking (Priority: P6)

**Goal**: Users can have subscriptions created/updated, with tier-based access enforcement.

**Independent Test**: Create a subscription, verify getByUser returns it, update status, verify limit enforcement uses correct tier.

### Implementation

- [ ] T025 [US6] Create convex/subscriptions.ts — implement `subscriptions.create`, `subscriptions.getByUser`, `subscriptions.updateStatus` per contracts
- [ ] T026 [US6] Create convex/users.ts — implement `users.resetMonthlyUsage` internalMutation for scheduled usage counter reset

**Checkpoint**: Subscriptions and usage reset working. Commit.

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: Final validation and cleanup.

- [ ] T027 Verify all 10 tables in Convex dashboard with correct indexes
- [ ] T028 Run full quickstart.md verification (all 8 steps)
- [ ] T029 Verify TypeScript strict mode — no `any` type errors in convex/ (except intentional v.any() for JSON fields)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phases 3-8 (User Stories)**: All depend on Phase 2 (T001-T006) completion
- **Phase 9 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (Documents)**: Phase 2 only — no cross-story deps
- **US2 (Papers & Collections)**: Phase 2 only — no cross-story deps
- **US3 (Citations)**: Phase 2 + depends on US1 (documents) and US2 (papers) existing
- **US4 (Checks)**: Phase 2 + T005 (subscription limits) — optionally references documents
- **US5 (Research & Sessions)**: Phase 2 + depends on US1 (documents) for sessions
- **US6 (Subscriptions)**: Phase 2 only

### Recommended Order (sequential)

Phase 2 → US1 → US2 → US3 → US4 → US5 → US6 → Polish

### Parallel Opportunities

- T004 + T005 (user profile + subscription limits) — different files
- T012 + T013 (collections + files) — different files
- T019 + T020 (plagiarism + AI detection) — different files
- T023 + T024 (research reports + learn mode) — different files

---

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 29 |
| Phase 2 (Foundational) | 6 |
| US1 (Documents) | 5 |
| US2 (Papers & Collections) | 5 |
| US3 (Citations) | 2 |
| US4 (Checks) | 4 |
| US5 (Research & Sessions) | 2 |
| US6 (Subscriptions) | 2 |
| Polish | 3 |
| Parallel opportunities | 4 pairs |
| MVP scope | Phase 2 + US1 (11 tasks) |
