# Implementation Plan: Multi-Source Paper Search

**Branch**: `004-paper-search` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-paper-search/spec.md`

## Summary

Implement a unified paper search interface that queries PubMed E-utilities, Semantic Scholar, and OpenAlex APIs simultaneously via Next.js API routes, deduplicates results by DOI/title similarity, and presents them in a filterable, sortable UI built with shadcn/ui. Users can save papers to their Convex-backed library with duplicate detection. The search layer is stateless (Next.js API routes for external calls); persistence happens only on save (Convex mutations via existing `papers.save`).

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.1.6 (App Router)
**Primary Dependencies**: Next.js API routes (search aggregation), Convex (persistence), Clerk (auth), shadcn/ui + Tailwind CSS (UI), lucide-react (icons)
**Storage**: Convex (papers, collections tables — already exist)
**Testing**: Playwright E2E (`@playwright/test` ^1.58.2)
**Target Platform**: Web (desktop + mobile responsive, minimum 375px)
**Project Type**: Web application (Next.js App Router + Convex backend)
**Performance Goals**: Search results displayed within 5 seconds; filter/sort updates within 1 second
**Constraints**: Graceful degradation when any API source fails; 1-hour cache for identical queries; mobile-first responsive design
**Scale/Scope**: <100 concurrent users at launch; 3 external API sources; 1 search page + components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status |
|---------|------|--------|
| 2 - Tech Stack | Next.js 14+ App Router, Convex, Clerk, shadcn/ui, Tailwind CSS | PASS — all used as specified |
| 3.1 - ZERO SQL | No SQL, no ORMs, no PostgreSQL | PASS — Convex TypeScript functions only |
| 3.3 - Mobile Responsive | 44px touch targets, Tailwind breakpoints | PASS — planned from day one |
| 3.4 - No Custom Code | Use existing open-source where available | PASS — using PubMed/S2/OpenAlex APIs directly, shadcn/ui components |
| 7.1 - Testing | Playwright E2E tests before marking done | PASS — E2E tests planned for all user stories |
| 7.2 - Types | TypeScript strict mode, no `any` types | PASS — strict interfaces for all API responses |
| 7.3 - Components | All UI from shadcn/ui | PASS — Card, Button, Input, Select, Badge, Skeleton from shadcn |
| 7.4 - Error Handling | Graceful degradation for external API failures | PASS — per-source error isolation in FR-013 |
| 7.5 - Security | No secrets in code, all API keys in env vars | PASS — NCBI_API_KEY, S2_API_KEY in .env |
| 9.5 - Frontend Design | Frontend Design Skill (Opus) mandatory for all UI | PASS — will use for search page design |

**Result**: All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-paper-search/
├── plan.md              # This file
├── research.md          # Phase 0: API research & decisions
├── data-model.md        # Phase 1: Data model documentation
├── quickstart.md        # Phase 1: Developer quickstart
├── contracts/           # Phase 1: API contracts
│   ├── search-api.md    # Unified search endpoint contract
│   ├── pubmed-api.md    # PubMed integration contract
│   ├── semantic-scholar-api.md  # S2 integration contract
│   └── openalex-api.md  # OpenAlex integration contract
└── tasks.md             # Phase 2: Task breakdown (via /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── (protected)/
│   └── search/
│       └── page.tsx              # Search page (main UI)
├── api/
│   └── search/
│       ├── route.ts              # Unified search endpoint (aggregator)
│       ├── pubmed/
│       │   └── route.ts          # PubMed E-utilities proxy
│       ├── semantic-scholar/
│       │   └── route.ts          # Semantic Scholar proxy
│       ├── openalex/
│       │   └── route.ts          # OpenAlex proxy
│       └── related/
│           └── route.ts          # Related papers (S2 recommendations)

components/
├── search/
│   ├── search-bar.tsx            # Search input + submit button
│   ├── search-filters.tsx        # Filter sidebar (year, type, OA, human)
│   ├── search-sort.tsx           # Sort dropdown
│   ├── paper-card.tsx            # Individual result card
│   ├── paper-card-skeleton.tsx   # Loading skeleton
│   ├── search-results.tsx        # Results list container
│   ├── search-pagination.tsx     # Pagination controls
│   └── save-to-library.tsx       # Save button with collection picker

lib/
├── search/
│   ├── types.ts                  # Shared search types & interfaces
│   ├── deduplicate.ts            # Deduplication logic (DOI + title similarity)
│   ├── normalize.ts              # API response normalization (per source)
│   └── cache.ts                  # In-memory search cache (1-hour TTL)

convex/
└── papers.ts                     # Already exists — save mutation used as-is

tests/
└── e2e/
    └── search.spec.ts            # Playwright E2E tests for search
```

**Structure Decision**: Next.js App Router with `app/api/` routes for external API aggregation (stateless, cacheable). Convex handles persistence only (save to library). This separates concerns: search is ephemeral HTTP; library is persistent Convex.

## Complexity Tracking

No constitution violations. Table not needed.
