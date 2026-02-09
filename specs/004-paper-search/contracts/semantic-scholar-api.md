# API Contract: Semantic Scholar Integration

**Internal Endpoint**: `POST /api/search/semantic-scholar`
**External API**: Semantic Scholar Academic Graph API v1
**Purpose**: Search Semantic Scholar and return normalized paper results.

## Request

```typescript
interface S2SearchRequest {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  openAccessOnly?: boolean;
  page?: number;        // Default: 1
  pageSize?: number;    // Default: 20
}
```

## External API Call

```
GET https://api.semanticscholar.org/graph/v1/paper/search
  ?query={query}
  &offset={(page-1) * pageSize}
  &limit={pageSize}
  &fields=paperId,title,authors,year,abstract,citationCount,isOpenAccess,externalIds,journal,url,publicationTypes
  &year={yearFrom}-{yearTo}  (only if both provided)
```

**Headers**:
```
x-api-key: {SEMANTIC_SCHOLAR_API_KEY}  (if available)
```

## Response Normalization

S2 fields → PaperSearchResult:

| S2 Field | Maps To |
|----------|---------|
| paperId | externalId (prefixed: `s2:{paperId}`) |
| — | source: "semantic_scholar" |
| title | title |
| authors[].name | authors |
| journal.name | journal |
| year | year |
| abstract | abstract |
| citationCount | citationCount |
| isOpenAccess | isOpenAccess |
| externalIds.DOI | doi |
| externalIds.PubMed | pmid |
| url | url |
| publicationTypes[0] | publicationType |

## Post-Processing

- If `openAccessOnly` filter is set, filter results where `isOpenAccess !== true`
- Study type filtering: match `publicationTypes` array against requested study type (case-insensitive partial match)
- Human-only filtering: not supported by S2 API — skip this filter for S2 results

## Related Papers Endpoint

```
GET https://api.semanticscholar.org/recommendations/v1/papers/forpaper/{paperId}
  ?fields=paperId,title,authors,year,abstract,citationCount,isOpenAccess,externalIds,journal,url
  &limit=10
```

Used by `/api/search/related` endpoint.

## Error Handling

- Timeout: 10 seconds
- Rate limit (429): Return `{ success: false, results: [], error: "Semantic Scholar rate limited" }`
- On failure: Return `{ success: false, results: [], error: "Semantic Scholar unavailable" }`
