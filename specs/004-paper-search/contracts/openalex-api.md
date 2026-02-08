# API Contract: OpenAlex Integration

**Internal Endpoint**: `POST /api/search/openalex`
**External API**: OpenAlex API
**Purpose**: Search OpenAlex and return normalized paper results.

## Request

```typescript
interface OpenAlexSearchRequest {
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
GET https://api.openalex.org/works
  ?search={query}
  &page={page}
  &per_page={pageSize}
  &sort=relevance_score:desc
  &mailto={OPENALEX_EMAIL}
  &filter=publication_year:{yearFrom}-{yearTo},is_oa:{openAccessOnly},type:article
```

**Filter construction** (comma-separated, only include set filters):
- Year range: `publication_year:{yearFrom}-{yearTo}`
- Open access: `is_oa:true`
- Type: `type:article` (default, to exclude datasets/preprints unless specifically wanted)

## Response Normalization

OpenAlex fields → PaperSearchResult:

| OpenAlex Field | Maps To |
|----------------|---------|
| id (extract openalex ID) | externalId (prefixed: `oa:{id}`) |
| — | source: "openalex" |
| title | title |
| authorships[].author.display_name | authors |
| primary_location.source.display_name | journal |
| publication_year | year |
| abstract_inverted_index | abstract (reconstructed — see below) |
| cited_by_count | citationCount |
| open_access.is_oa | isOpenAccess |
| doi (strip "https://doi.org/" prefix) | doi |
| ids.pmid (if present) | pmid |
| open_access.oa_url \|\| primary_location.landing_page_url | url |
| type | publicationType |

## Abstract Reconstruction

OpenAlex stores abstracts as inverted indexes:

```json
{
  "abstract_inverted_index": {
    "This": [0],
    "study": [1, 15],
    "examines": [2],
    ...
  }
}
```

**Algorithm**:
1. Create array of `[position, word]` tuples from all entries
2. Sort by position ascending
3. Join words with spaces
4. Return as string

```typescript
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }
  words.sort((a, b) => a[0] - b[0]);
  return words.map(([_, word]) => word).join(" ");
}
```

## Post-Processing

- Human-only filtering: not directly supported by OpenAlex. Skip for OpenAlex results.
- Study type filtering: use `type` field (values: `article`, `review`, `book-chapter`, etc.) — map to closest match

## Error Handling

- Timeout: 10 seconds
- On failure: Return `{ success: false, results: [], error: "OpenAlex unavailable" }`
