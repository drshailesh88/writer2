# Research: Multi-Source Paper Search

**Feature**: 004-paper-search
**Date**: 2026-02-07

## R1: PubMed E-utilities API Integration

**Decision**: Use NCBI E-utilities (esearch + esummary) for PubMed queries.

**Rationale**:
- E-utilities is the official NCBI API for programmatic access to PubMed
- `esearch` returns PMIDs matching a query; `esummary` returns metadata for those PMIDs
- Free with API key (registered email) — 10 requests/second with key vs 3/second without
- Returns structured XML/JSON with title, authors, journal, year, DOI, publication type
- Supports field-specific queries (e.g., `[pdat]` for date, `[pt]` for publication type, `[sh]` for MeSH subheadings)

**Alternatives considered**:
- PubMed Central API: Only covers open access subset, not full PubMed
- Europe PMC: Good but less comprehensive for US medical literature

**Key endpoints**:
- `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` — search
- `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` — metadata

**Params for search**: `db=pubmed`, `term=<query>`, `retmax=20`, `retstart=<offset>`, `sort=relevance`, `retmode=json`, `api_key=<key>`

**Params for filters**: Year range via `mindate/maxdate` + `datetype=pdat`; study type via appending `[pt]` to query (e.g., `AND randomized controlled trial[pt]`); human studies via `AND humans[mh]`

**Rate limits**: 10/sec with API key, 3/sec without. API key is free — register at NCBI.

---

## R2: Semantic Scholar API Integration

**Decision**: Use Semantic Scholar Academic Graph API for citation-rich results and recommendations.

**Rationale**:
- 200M+ papers with AI-generated TLDRs and SPECTER2 embeddings
- Best source for citation counts and related paper recommendations
- Free tier: 1 request/second without key; 10/second with partner API key
- Returns: paperId, title, authors, year, abstract, citationCount, isOpenAccess, externalIds (DOI, PMID, etc.)

**Alternatives considered**:
- Google Scholar API: No official API exists; scraping violates ToS
- Crossref: Good for DOI resolution but not for full-text search

**Key endpoints**:
- `https://api.semanticscholar.org/graph/v1/paper/search` — search
- `https://api.semanticscholar.org/recommendations/v1/papers/forpaper/{paper_id}` — related papers

**Search params**: `query=<query>`, `offset=<n>`, `limit=20`, `fields=paperId,title,authors,year,abstract,citationCount,isOpenAccess,externalIds,journal,url`

**Filter support**: `year=2020-2025` param for date range; `openAccessPdf` field in response for OA detection; no built-in study type filter (must filter client-side)

**Rate limits**: 1/sec unauthenticated, 10/sec with API key (request at https://www.semanticscholar.org/product/api#api-key-form)

---

## R3: OpenAlex API Integration

**Decision**: Use OpenAlex API with polite pool (email in header) for broadest coverage.

**Rationale**:
- 240M+ works, fully open, no API key required
- Polite pool (add `mailto:email@domain.com` to requests) gives 10 requests/second vs 1/sec
- Returns: id, title, authorships, publication_year, doi, open_access, cited_by_count, abstract_inverted_index
- Abstract is stored as inverted index — must reconstruct into readable text

**Alternatives considered**:
- Microsoft Academic: Discontinued in 2021; OpenAlex is its successor
- Dimensions: Requires paid API access for production use

**Key endpoints**:
- `https://api.openalex.org/works` — search

**Search params**: `search=<query>`, `page=<n>`, `per_page=20`, `sort=relevance_score:desc`, `mailto=<email>`

**Filter support**: `filter=publication_year:2020-2025` for date range; `filter=is_oa:true` for open access; `filter=type:article` for article type. Filters are composable with comma separation.

**Abstract reconstruction**: The `abstract_inverted_index` field maps words to positions. Must invert: create array of [position, word] pairs, sort by position, join words with spaces.

**Rate limits**: 1/sec without email, 10/sec with polite pool (email in User-Agent or mailto param).

---

## R4: Deduplication Strategy

**Decision**: Three-tier deduplication — DOI match (primary), PubMed ID match (secondary), title similarity >90% (fallback).

**Rationale**:
- DOI is the gold standard identifier but ~15% of PubMed papers lack DOIs (especially older papers)
- PubMed IDs (PMIDs) are returned by both PubMed and Semantic Scholar (via externalIds)
- Title similarity handles cases where DOI/PMID are missing but the same paper appears from different sources
- Levenshtein distance is too slow for bulk comparisons; using normalized lowercase comparison with fuzzy matching is simpler and sufficient

**Implementation approach**:
1. Group results by DOI (exact match, case-insensitive, strip URL prefix)
2. Within ungrouped results, match by PMID where available
3. Remaining unmatched results: normalize title (lowercase, strip punctuation, collapse whitespace), flag >90% character overlap as duplicates
4. When merging duplicates: prefer PubMed metadata for medical fields (journal, MeSH terms), Semantic Scholar for citationCount, OpenAlex for open access URL

**Alternatives considered**:
- Levenshtein distance on titles: O(n*m) per pair, too expensive for 60+ results
- DOI-only matching: Would miss ~15% duplicates from papers without DOIs
- No deduplication: Unacceptable UX — users would see the same paper 2-3 times

---

## R5: Caching Strategy

**Decision**: In-memory Map cache with 1-hour TTL, keyed by normalized query + filters + sort + page.

**Rationale**:
- Search results don't change frequently (academic papers are published, not updated)
- 1-hour TTL balances freshness with API rate limit conservation
- In-memory is sufficient for <100 concurrent users; no need for Redis at this scale
- Cache key = `${query.toLowerCase().trim()}|${JSON.stringify(sortedFilters)}|${sort}|${page}`

**Alternatives considered**:
- Redis/Upstash: Over-engineered for <100 users; adds infrastructure dependency
- Next.js fetch cache / unstable_cache: Next.js 16 supports `unstable_cache` but API is still evolving; simple Map is more predictable
- No caching: Would hit rate limits quickly with repeated searches

**Eviction**: Periodic cleanup every 10 minutes; delete entries older than 1 hour.

---

## R6: Search Page Architecture

**Decision**: Client-side search page at `app/(protected)/search/page.tsx` calling Next.js API routes, with client-side state management via React hooks.

**Rationale**:
- Search is interactive (type, filter, sort, paginate) — needs client-side state
- API routes handle external calls server-side (keeps API keys secure, enables caching)
- No need for global state management (Redux/Zustand) — search state is page-local
- Convex `useQuery`/`useMutation` used only for save-to-library and checking saved state

**Data flow**:
1. User types query → client state
2. User clicks search → `fetch('/api/search', { query, filters, sort, page })`
3. API route calls PubMed + S2 + OpenAlex in parallel → deduplicates → returns unified results
4. Client renders results
5. User clicks "Save" → Convex `papers.save` mutation
6. User clicks "Find Related" → `fetch('/api/search/related', { paperId })`

**Alternatives considered**:
- Convex actions for search: Could work but loses Next.js API route caching; Convex actions are billed per execution
- Server Components: Search results could be server-rendered but pagination/filtering requires client interactivity; hybrid would add complexity without benefit
- SWR/React Query: Additional dependency; plain `fetch` + `useState` is sufficient for this scope

---

## R7: New Environment Variables Required

**Decision**: Add three new environment variables for API access.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NCBI_API_KEY` | Recommended | PubMed E-utilities — increases rate limit from 3/sec to 10/sec |
| `SEMANTIC_SCHOLAR_API_KEY` | Recommended | Semantic Scholar — increases rate limit from 1/sec to 10/sec |
| `OPENALEX_EMAIL` | Recommended | OpenAlex polite pool — increases rate limit from 1/sec to 10/sec |

All three APIs work without keys but at reduced rate limits. Keys are free to obtain.
