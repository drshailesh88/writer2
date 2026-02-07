# Tasks: Deep Research

**Input**: Design documents from `/specs/012-deep-research/`
**Prerequisites**: Existing Convex mutations (deepResearchReports.ts), existing search APIs, Mastra framework

## Phase 1: Setup

- [x] T001 Create deep research Mastra agent in `lib/mastra/agents.ts` — add a `deepResearchAgent` that takes a topic, generates search queries, calls paper search APIs, evaluates results, and synthesizes a structured report with executive summary, key findings, literature gaps, and cited sources. Use existing GLM-4.7 config.
- [x] T002 Create deep research Mastra workflow in `lib/mastra/workflows.ts` — add `deepResearchWorkflow` that: (1) generates 3-5 search queries from topic, (2) searches papers via internal fetch to `/api/search`, (3) filters top 10-15 most relevant papers, (4) synthesizes a structured markdown report with citations, (5) returns report text + cited papers array.
- [x] T003 Register deep research agent and workflow in `lib/mastra/index.ts`.

**Checkpoint**: Agent and workflow ready

---

## Phase 2: API Route

- [x] T004 Create API route `app/api/deep-research/start/route.ts` — POST handler that: (1) authenticates via Clerk, (2) calls Convex `deepResearchReports.create` mutation to get reportId and check limits, (3) fires off the Mastra workflow asynchronously, (4) calls Convex `deepResearchReports.updateResult` with status "in_progress", (5) on completion calls updateResult with report + citedPapers + status "completed", (6) on error calls updateResult with status "failed". Returns `{ reportId }` immediately.

**Checkpoint**: Backend ready

---

## Phase 3: React Hook

- [x] T005 Create `lib/hooks/use-deep-research.ts` — custom hook with: `startResearch(topic)` function that calls `/api/deep-research/start`, `reportId` state, `report` from `useQuery(api.deepResearchReports.get)` for real-time status polling, `isLoading` derived from report status, `error` state, `reset()` function.

**Checkpoint**: Frontend hook ready

---

## Phase 4: User Story 1 + 2 — Deep Research Page (P1)

- [x] T006 [US1] [US2] Create deep research page at `app/(protected)/deep-research/page.tsx` using ui-designer agent. Page includes: (1) Topic input form with 5-500 char validation, (2) "Start Research" button with loading state, (3) Usage counter showing X/Y reports used, (4) Upgrade modal for free/none users, (5) Report display area with markdown rendering when report is completed, (6) Cited papers list with title, authors, year, journal, (7) Copy report button, (8) Error state handling. Mobile responsive.

**Checkpoint**: Deep Research page functional

---

## Phase 5: User Story 3 — Reports History (P2)

- [x] T007 [US3] Add reports history section to the deep research page — below the input form, show a list of previous reports using `useQuery(api.deepResearchReports.listByUser)`. Each item shows topic, date, status badge. Clicking loads the report in the display area. Use ui-designer agent.

**Checkpoint**: History functional

---

## Phase 6: Navigation + Integration

- [x] T008 Add "Deep Research" link to navigation in `components/nav-shell.tsx` — add link to `/deep-research` in both desktop and mobile nav sections. Use FlaskConical icon from lucide-react (already imported on dashboard). Place after "My Library" link.

**Checkpoint**: Navigation updated

---

## Phase 7: Playwright E2E Tests

- [x] T009 Create Playwright E2E tests in `tests/e2e/deep-research.spec.ts` — test suites: (1) Unauthenticated redirect to sign-in, (2) Authenticated: page loads with topic input, Start Research button visible, usage counter shown, reports history section visible, (3) Subscription gating: free user sees upgrade modal, (4) Mobile: responsive layout, 44px touch targets.

---

## Phase 8: Polish

- [x] T010 Run `npm run build` to verify zero TypeScript errors
- [x] T011 Run `npx playwright test tests/e2e/deep-research.spec.ts` and fix failures
- [x] T012 Run full Playwright test suite to verify no regressions

---

## Dependencies

- Phase 1 → Phase 2 → Phase 3 → Phase 4/5 (sequential)
- Phase 6 can run in parallel with Phase 4/5
- Phase 7 depends on Phase 4-6
- Phase 8 depends on Phase 7
