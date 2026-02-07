# Tasks: Multi-Source Paper Search

**Input**: Design documents from `/specs/004-paper-search/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — Constitution Article 7.1 mandates Playwright E2E tests for every feature.

**Organization**: Tasks grouped by user story (P1 → P2 → P3) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Shared types, environment configuration, utility functions

- [x] T001 Create shared TypeScript interfaces (PaperSearchResult, SearchQuery, SearchResponse, per-source response types) in `lib/search/types.ts`
- [x] T002 Add environment variables (NCBI_API_KEY, SEMANTIC_SCHOLAR_API_KEY, OPENALEX_EMAIL) to `.env.local` and document in `.env.example`
- [x] T003 [P] Create PubMed response normalizer in `lib/search/normalize.ts` — transform esummary/efetch response to PaperSearchResult (see `contracts/pubmed-api.md`)
- [x] T004 [P] Create Semantic Scholar response normalizer in `lib/search/normalize.ts` — transform S2 response to PaperSearchResult (see `contracts/semantic-scholar-api.md`)
- [x] T005 [P] Create OpenAlex response normalizer in `lib/search/normalize.ts` — transform OpenAlex response to PaperSearchResult including abstract_inverted_index reconstruction (see `contracts/openalex-api.md`)
- [x] T006 Create deduplication logic (DOI match → PMID match → title similarity >90%) with metadata merge in `lib/search/deduplicate.ts` (see `research.md` R4)
- [x] T007 Create in-memory cache with 1-hour TTL and periodic eviction in `lib/search/cache.ts` (see `research.md` R5)

**Checkpoint**: All shared utilities ready. API route implementation can begin.

---

## Phase 2: Foundational (API Route Handlers)

**Purpose**: External API integrations that MUST be complete before any UI story can work

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 [P] Implement PubMed E-utilities API route (esearch → esummary → efetch for abstracts) in `app/api/search/pubmed/route.ts` — POST handler with query, filters, pagination; 10s timeout; returns normalized results (see `contracts/pubmed-api.md`)
- [x] T009 [P] Implement Semantic Scholar API route in `app/api/search/semantic-scholar/route.ts` — POST handler with query, year filter, OA filter; 10s timeout; returns normalized results (see `contracts/semantic-scholar-api.md`)
- [x] T010 [P] Implement OpenAlex API route in `app/api/search/openalex/route.ts` — POST handler with query, filters; polite pool email header; 10s timeout; returns normalized results (see `contracts/openalex-api.md`)
- [x] T011 Implement unified search aggregator in `app/api/search/route.ts` — POST handler that calls all 3 source routes in parallel (Promise.allSettled), deduplicates results, applies cache, returns SearchResponse with per-source status (see `contracts/search-api.md`)

**Checkpoint**: `POST /api/search` returns unified, deduplicated results. Test manually with curl/Postman before proceeding to UI.

---

## Phase 3: User Story 1 — Basic Paper Search (Priority: P1) MVP

**Goal**: User can type a query, see deduplicated results from 3 sources with metadata displayed.

**Independent Test**: Enter "laparoscopic appendectomy", verify results appear from multiple sources with title, authors, journal, year, abstract preview, OA badge, citation count.

### Implementation for User Story 1

- [x] T012 [P] [US1] Create search bar component (input + submit button + loading state) in `components/search/search-bar.tsx` — shadcn Input + Button, Enter key support, disabled during loading
- [x] T013 [P] [US1] Create paper card component in `components/search/paper-card.tsx` — shadcn Card displaying title, authors (up to 3 + "et al."), journal, year, abstract preview (150 chars), OA Badge, citation count, source badges
- [x] T014 [P] [US1] Create paper card loading skeleton in `components/search/paper-card-skeleton.tsx` — shadcn Skeleton matching paper card layout
- [x] T015 [US1] Create search results container in `components/search/search-results.tsx` — renders list of PaperCards or skeletons during loading, shows "No results found" empty state with query suggestions, shows source status notices (partial failure)
- [x] T016 [US1] Create search page in `app/(protected)/search/page.tsx` — client component composing SearchBar + SearchResults, manages search state (query, results, loading, error), calls `POST /api/search` on submit
- [x] T017 [US1] Add "Search Papers" link to navigation in `components/nav-shell.tsx` — add Search icon + link to `/search` in the nav sidebar
- [x] T018 [US1] Write Playwright E2E test for basic search in `tests/e2e/search.spec.ts` — test: navigate to /search, type "laparoscopic appendectomy", click search, verify results appear with expected metadata fields, verify loading skeleton shows during search, verify graceful message if no results

**Checkpoint**: Basic search works end-to-end. User can search and see results. This is the MVP.

---

## Phase 4: User Story 2 — Filtering and Sorting (Priority: P2)

**Goal**: User can narrow search results with year range, study type, OA toggle, human-only filter, and sort by relevance/newest/citations.

**Independent Test**: Search for a term, apply year filter 2020-2025, verify all results fall within range. Toggle OA only, verify only OA results shown. Sort by citations, verify descending order.

### Implementation for User Story 2

- [x] T019 [P] [US2] Create search filters component in `components/search/search-filters.tsx` — shadcn Select for year range (from/to), Select for study type (RCT, Meta-Analysis, Review, Case Report, etc.), Switch for "Open Access Only", Checkbox for "Human Studies Only"; emits filter change events
- [x] T020 [P] [US2] Create search sort dropdown in `components/search/search-sort.tsx` — shadcn Select with options: Relevance (default), Newest First, Citation Count; emits sort change
- [x] T021 [US2] Integrate filters and sort into search page `app/(protected)/search/page.tsx` — add SearchFilters + SearchSort to page layout (filters in sidebar on desktop, collapsible on mobile), pass filter/sort state to API call, re-fetch on filter/sort change, add "Clear Filters" button
- [x] T022 [US2] Write Playwright E2E tests for filtering/sorting in `tests/e2e/search.spec.ts` — test: apply year filter and verify results filtered, toggle OA and verify badge on all results, sort by citations and verify order, clear filters and verify reset

**Checkpoint**: Search with filters and sorting works. Results update immediately on filter/sort changes.

---

## Phase 5: User Story 3 — Save Paper to Library (Priority: P2)

**Goal**: User can save any search result to their Convex-backed paper library with duplicate detection, and optionally assign to a collection.

**Independent Test**: Click "Save to Library" on a result, navigate to library, verify paper appears. Search again, verify same paper shows "Saved" state.

### Implementation for User Story 3

- [x] T023 [US3] Create save-to-library button component in `components/search/save-to-library.tsx` — Button with Bookmark icon, loading state during save, "Saved" disabled state when already in library, optional collection picker dropdown (uses Convex `collections.list` query), calls Convex `papers.save` mutation on click
- [x] T024 [US3] Integrate save button into paper card `components/search/paper-card.tsx` — add SaveToLibrary component, pass paper data, check saved state via Convex `papers.getByExternalId` query per visible result
- [x] T025 [US3] Write Playwright E2E test for save-to-library in `tests/e2e/search.spec.ts` — test: search for a paper, click "Save to Library", verify button changes to "Saved", verify paper appears in library (navigate to library page or check Convex)

**Checkpoint**: Search → Save workflow complete. Papers persist in Convex library with duplicate prevention.

---

## Phase 6: User Story 4 — Full Abstract & Related Papers (Priority: P3)

**Goal**: User can expand full abstract inline and discover related papers via "Find Related" button.

**Independent Test**: Click "View Full Abstract" on a result, verify full text appears. Click "Find Related", verify new results load.

### Implementation for User Story 4

- [x] T026 [US4] Add expandable full abstract to paper card `components/search/paper-card.tsx` — "View Full Abstract" / "Hide Abstract" toggle button, expands full abstract text below card metadata with smooth animation
- [x] T027 [US4] Implement related papers API route in `app/api/search/related/route.ts` — POST handler that takes paperId (S2 ID, DOI, or PMID), calls Semantic Scholar recommendations API, returns up to 10 normalized PaperSearchResults (see `contracts/semantic-scholar-api.md`)
- [x] T028 [US4] Add "Find Related" button to paper card `components/search/paper-card.tsx` — button that calls `/api/search/related`, displays related results in an inline expandable section below the card, related results also have Save to Library capability
- [x] T029 [US4] Write Playwright E2E test for abstract and related papers in `tests/e2e/search.spec.ts` — test: expand abstract and verify full text, click "Find Related" and verify related results appear

**Checkpoint**: Full abstract and related paper discovery work. Users can deep-dive into any result.

---

## Phase 7: User Story 5 — Pagination (Priority: P3)

**Goal**: Results paginate at 20 per page with navigation controls. Filters preserved across pages.

**Independent Test**: Search a broad term, verify only 20 results shown, navigate to page 2, verify new results load with filters preserved.

### Implementation for User Story 5

- [x] T030 [US5] Create pagination component in `components/search/search-pagination.tsx` — shadcn-styled pagination (Previous / page numbers / Next), shows current page and total pages, disabled states for first/last page
- [x] T031 [US5] Integrate pagination into search page `app/(protected)/search/page.tsx` — add SearchPagination below results, pass page/totalPages from SearchResponse, on page change: update page state and re-fetch with same query/filters/sort
- [x] T032 [US5] Write Playwright E2E test for pagination in `tests/e2e/search.spec.ts` — test: search broad term, verify 20 results max, click next page, verify new results, verify filters preserved across pages

**Checkpoint**: All 5 user stories complete. Full search feature is functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Mobile responsiveness, error handling, final validation

- [x] T033 Mobile-responsive polish for search page `app/(protected)/search/page.tsx` and all `components/search/*.tsx` — verify 375px layout (stacked filters, 44px touch targets, no horizontal scroll), test on iPhone SE viewport in Playwright
- [x] T034 Add error boundary for search page in `components/error-boundary.tsx` or inline — graceful error UI with retry button if entire search page crashes
- [x] T035 Run full Playwright E2E test suite `tests/e2e/search.spec.ts` — verify all tests pass end-to-end, fix any regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001-T007 must complete) — BLOCKS all user stories
- **Phases 3-7 (User Stories)**: All depend on Phase 2 completion
  - US1 (Phase 3): No story dependencies — can start immediately after Phase 2
  - US2 (Phase 4): Depends on US1 (needs search page to integrate filters into)
  - US3 (Phase 5): Depends on US1 (needs paper card to add save button to)
  - US4 (Phase 6): Depends on US1 (needs paper card for abstract expand + related)
  - US5 (Phase 7): Depends on US1 (needs search page for pagination integration)
  - US2, US3, US4, US5 can run in parallel after US1 is complete
- **Phase 8 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (API Routes) → US1 (Basic Search) → US2 (Filters/Sort)
                                                              → US3 (Save to Library)
                                                              → US4 (Abstract/Related)
                                                              → US5 (Pagination)
                                                              → Phase 8 (Polish)
```

### Parallel Opportunities

**Phase 1**: T003, T004, T005 (normalizers) can run in parallel — different source-specific functions in same file
**Phase 2**: T008, T009, T010 (API routes) can run in parallel — separate files, no dependencies
**Phase 3**: T012, T013, T014 (components) can run in parallel — separate files
**After US1**: US2, US3, US4, US5 can run in parallel if multiple developers available

---

## Parallel Example: Phase 2 (API Routes)

```bash
# All three API routes can be built simultaneously:
Task: "Implement PubMed API route in app/api/search/pubmed/route.ts"
Task: "Implement Semantic Scholar API route in app/api/search/semantic-scholar/route.ts"
Task: "Implement OpenAlex API route in app/api/search/openalex/route.ts"
# Then sequentially:
Task: "Implement unified aggregator in app/api/search/route.ts" (depends on all three)
```

## Parallel Example: Phase 3 (US1 Components)

```bash
# Components can be built simultaneously:
Task: "Create search bar in components/search/search-bar.tsx"
Task: "Create paper card in components/search/paper-card.tsx"
Task: "Create paper card skeleton in components/search/paper-card-skeleton.tsx"
# Then sequentially:
Task: "Create search results container in components/search/search-results.tsx" (uses paper card)
Task: "Create search page in app/(protected)/search/page.tsx" (uses all components)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: API Routes (T008-T011)
3. Complete Phase 3: US1 Basic Search (T012-T018)
4. **STOP and VALIDATE**: Search for "laparoscopic appendectomy", verify results appear
5. Commit and deploy MVP

### Incremental Delivery

1. Setup + API Routes → Foundation ready
2. US1 (Basic Search) → Test independently → **MVP deployed**
3. US2 (Filters/Sort) → Test independently → Enhanced search
4. US3 (Save to Library) → Test independently → Library integration
5. US4 (Abstract/Related) → Test independently → Deep discovery
6. US5 (Pagination) → Test independently → Full navigation
7. Polish → Mobile + error handling → Production ready

---

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 35 |
| Phase 1 (Setup) | 7 |
| Phase 2 (Foundational) | 4 |
| US1 — Basic Search (P1) | 7 |
| US2 — Filters/Sort (P2) | 4 |
| US3 — Save to Library (P2) | 3 |
| US4 — Abstract/Related (P3) | 4 |
| US5 — Pagination (P3) | 3 |
| Polish | 3 |
| Parallelizable tasks | 12 |
| E2E test tasks | 5 |
| MVP scope | T001-T018 (18 tasks) |

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps to user stories from spec.md
- Constitution Article 9.5: Use Frontend Design Skill (Opus) before implementing any UI component (T012-T016, T019-T020, T023, T026, T028, T030)
- Commit after each completed task or logical group
- Each checkpoint is a valid stopping point for validation
