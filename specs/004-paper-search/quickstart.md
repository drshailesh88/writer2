# Quickstart: Multi-Source Paper Search

**Feature**: 004-paper-search
**Date**: 2026-02-07

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Convex dev server running (`npx convex dev`)
- Clerk auth configured (existing)

## Environment Variables

Add to `.env.local`:

```bash
# Paper Search APIs (all optional but recommended for higher rate limits)
NCBI_API_KEY=your_ncbi_api_key          # Get free at https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/
SEMANTIC_SCHOLAR_API_KEY=your_s2_key    # Request at https://www.semanticscholar.org/product/api#api-key-form
OPENALEX_EMAIL=your@email.com           # Any email — enables polite pool (10 req/sec)
```

## New Files to Create

### 1. Types (`lib/search/types.ts`)

Shared TypeScript interfaces used by API routes, components, and deduplication logic. See `data-model.md` for field definitions.

### 2. API Routes (in `app/api/search/`)

| File | Purpose |
|------|---------|
| `pubmed/route.ts` | PubMed E-utilities (esearch + esummary + efetch) |
| `semantic-scholar/route.ts` | Semantic Scholar Graph API |
| `openalex/route.ts` | OpenAlex works API |
| `route.ts` | Unified aggregator (calls all 3 in parallel, deduplicates) |
| `related/route.ts` | S2 recommendations API |

### 3. Lib Utilities (`lib/search/`)

| File | Purpose |
|------|---------|
| `normalize.ts` | Per-source response → PaperSearchResult mapping |
| `deduplicate.ts` | DOI/PMID/title-based dedup + metadata merge |
| `cache.ts` | In-memory Map with 1-hour TTL |

### 4. Components (`components/search/`)

| File | Purpose |
|------|---------|
| `search-bar.tsx` | Input + submit button |
| `search-filters.tsx` | Year range, study type, OA toggle, human toggle |
| `search-sort.tsx` | Sort dropdown |
| `paper-card.tsx` | Result card with metadata + actions |
| `paper-card-skeleton.tsx` | Loading skeleton |
| `search-results.tsx` | Results list container |
| `search-pagination.tsx` | Page navigation |
| `save-to-library.tsx` | Save button with collection picker |

### 5. Search Page (`app/(protected)/search/page.tsx`)

Client component that composes all search components.

### 6. E2E Tests (`tests/e2e/search.spec.ts`)

Playwright tests covering all 5 user stories.

## Development Order

1. `lib/search/types.ts` — types first
2. `lib/search/normalize.ts` + `lib/search/deduplicate.ts` + `lib/search/cache.ts` — utility functions
3. `app/api/search/pubmed/route.ts` — first API integration
4. `app/api/search/semantic-scholar/route.ts` — second API
5. `app/api/search/openalex/route.ts` — third API
6. `app/api/search/route.ts` — unified aggregator
7. `components/search/*` — UI components (use Frontend Design Skill)
8. `app/(protected)/search/page.tsx` — search page
9. `app/api/search/related/route.ts` — related papers
10. `components/search/save-to-library.tsx` — save with Convex integration
11. `tests/e2e/search.spec.ts` — E2E tests
12. Navigation link in `components/nav-shell.tsx` — add search to nav

## Testing

```bash
# Run E2E tests
npx playwright test tests/e2e/search.spec.ts

# Run dev server (for manual testing)
npm run dev
# Navigate to http://localhost:3000/search
```

## Key Convex Functions (already exist)

- `papers.save` — Save paper to library (with duplicate detection)
- `papers.getByExternalId` — Check if paper already saved
- `collections.list` — Get user's collections for save dropdown
