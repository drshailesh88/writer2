# Data Model: Multi-Source Paper Search

**Feature**: 004-paper-search
**Date**: 2026-02-07

## Entities

### PaperSearchResult (transient — not persisted)

Standardized representation of a paper returned from any of the three search APIs. This is a client-side type only; it does not map to a database table.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| externalId | string | Yes | Unique ID from source (PMID, S2 paperId, OpenAlex work ID) |
| source | "pubmed" \| "semantic_scholar" \| "openalex" | Yes | Which API returned this result |
| sources | string[] | Yes | All sources that returned this paper (after dedup merge) |
| title | string | Yes | Paper title |
| authors | string[] | Yes | Author names (full names) |
| journal | string \| null | No | Journal or publication venue name |
| year | number \| null | No | Publication year |
| abstract | string \| null | No | Full abstract text |
| doi | string \| null | No | Digital Object Identifier |
| pmid | string \| null | No | PubMed ID (if from PubMed or cross-referenced) |
| url | string \| null | No | Link to paper (publisher or open access PDF) |
| isOpenAccess | boolean | Yes | Whether paper is freely accessible |
| citationCount | number | Yes | Number of citations (0 if unknown) |
| publicationType | string \| null | No | e.g., "Journal Article", "Randomized Controlled Trial" |

### SearchQuery (transient — client state)

Represents the user's current search parameters.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | Yes | Free-text search term |
| yearFrom | number \| null | No | Minimum publication year filter |
| yearTo | number \| null | No | Maximum publication year filter |
| studyType | string \| null | No | Publication type filter (e.g., "RCT", "Meta-Analysis") |
| openAccessOnly | boolean | No | Show only open access papers |
| humanOnly | boolean | No | Show only human studies |
| sort | "relevance" \| "newest" \| "citations" | No | Sort order (default: relevance) |
| page | number | No | Current page number (default: 1) |

### Paper (persisted — existing Convex table)

Already exists in `convex/schema.ts`. No schema changes needed.

| Field | Type | Notes |
|-------|------|-------|
| userId | Id\<"users"\> | Owner (from Clerk auth) |
| collectionId | Id\<"collections"\> \| undefined | Optional folder |
| externalId | string | Matches PaperSearchResult.externalId |
| source | "pubmed" \| "semantic_scholar" \| "openalex" \| "uploaded" | Primary source |
| title | string | |
| authors | string[] | |
| journal | string \| undefined | |
| year | number \| undefined | |
| abstract | string \| undefined | |
| doi | string \| undefined | |
| url | string \| undefined | |
| pdfFileId | Id\<"_storage"\> \| undefined | |
| isOpenAccess | boolean | |
| metadata | any \| undefined | Additional source-specific data |
| createdAt | number | Timestamp |

**Indexes**: `by_user_id`, `by_external_id`, `by_collection_id` — all exist.

### Collection (persisted — existing Convex table)

Already exists. No changes needed.

| Field | Type | Notes |
|-------|------|-------|
| userId | Id\<"users"\> | Owner |
| name | string | Collection name |
| description | string \| undefined | |
| createdAt | number | |

## Relationships

```
User (1) ──→ (many) Paper
User (1) ──→ (many) Collection
Collection (1) ──→ (many) Paper (optional — papers can be uncollected)

PaperSearchResult ──→ Paper (via "Save to Library" action)
  - Maps: externalId, source, title, authors, journal, year, abstract, doi, url, isOpenAccess
  - Duplicate check: getByExternalId(externalId) per user
```

## State Transitions

**Search Result → Saved Paper**:
1. User clicks "Save to Library" on a PaperSearchResult
2. Client calls Convex `papers.save` mutation
3. Mutation checks `getByExternalId` — if exists, returns existing paper ID (no duplicate)
4. If new, inserts into `papers` table with userId from Clerk
5. Client updates result card to show "Saved" state

**No other state transitions** — search results are stateless/transient.

## Schema Changes Required

**None.** The existing Convex schema fully supports this feature. The `papers` table already has the `source` union type covering all three APIs, and the `externalId` + `by_external_id` index enables duplicate detection.
