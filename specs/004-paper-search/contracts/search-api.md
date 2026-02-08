# API Contract: Unified Search Endpoint

**Endpoint**: `POST /api/search`
**Purpose**: Aggregates results from PubMed, Semantic Scholar, and OpenAlex; deduplicates; returns unified results.

## Request

```typescript
interface SearchRequest {
  query: string;           // Free-text search term (required, min 2 chars)
  yearFrom?: number;       // Min publication year (e.g., 2020)
  yearTo?: number;         // Max publication year (e.g., 2025)
  studyType?: string;      // e.g., "randomized controlled trial", "meta-analysis", "review"
  openAccessOnly?: boolean; // Default: false
  humanOnly?: boolean;     // Default: false
  sort?: "relevance" | "newest" | "citations"; // Default: "relevance"
  page?: number;           // Default: 1 (1-indexed)
}
```

**Content-Type**: `application/json`

## Response

```typescript
interface SearchResponse {
  results: PaperSearchResult[];  // Max 20 per page
  totalResults: number;          // Approximate total across all sources
  page: number;                  // Current page
  totalPages: number;            // Estimated total pages
  sources: {
    pubmed: { success: boolean; count: number; error?: string };
    semanticScholar: { success: boolean; count: number; error?: string };
    openAlex: { success: boolean; count: number; error?: string };
  };
  cached: boolean;               // Whether this response was served from cache
}

interface PaperSearchResult {
  externalId: string;
  source: "pubmed" | "semantic_scholar" | "openalex";
  sources: string[];           // All sources that had this paper
  title: string;
  authors: string[];
  journal: string | null;
  year: number | null;
  abstract: string | null;
  doi: string | null;
  pmid: string | null;
  url: string | null;
  isOpenAccess: boolean;
  citationCount: number;
  publicationType: string | null;
}
```

## Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing or empty `query` | `{ error: "Search query is required" }` |
| 400 | `query` < 2 characters | `{ error: "Search query must be at least 2 characters" }` |
| 500 | All three APIs failed | `{ error: "Search temporarily unavailable", sources: {...} }` |

**Partial failure** (1-2 APIs fail): Returns 200 with results from working APIs. Failed sources noted in `sources` object with `success: false` and `error` message.

## Caching

- Cache key: `${query.toLowerCase().trim()}|${JSON.stringify(filters)}|${sort}|${page}`
- TTL: 1 hour
- Cache is per-server instance (in-memory Map)

---

# API Contract: Related Papers

**Endpoint**: `POST /api/search/related`
**Purpose**: Find papers related to a given paper using Semantic Scholar recommendations.

## Request

```typescript
interface RelatedPapersRequest {
  paperId: string;   // Semantic Scholar paper ID, DOI, or PMID
}
```

## Response

```typescript
interface RelatedPapersResponse {
  results: PaperSearchResult[];  // Up to 10 related papers
}
```

## Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `paperId` | `{ error: "Paper ID is required" }` |
| 404 | Paper not found in S2 | `{ error: "Paper not found" }` |
| 500 | S2 API failure | `{ error: "Related papers temporarily unavailable" }` |
