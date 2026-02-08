# API Contract: PubMed E-utilities Integration

**Internal Endpoint**: `POST /api/search/pubmed`
**External API**: NCBI E-utilities (esearch + esummary)
**Purpose**: Search PubMed and return normalized paper results.

## Request

```typescript
interface PubMedSearchRequest {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  studyType?: string;
  humanOnly?: boolean;
  page?: number;        // Default: 1
  pageSize?: number;    // Default: 20
}
```

## External API Calls

### Step 1: esearch (get PMIDs)

```
GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi
  ?db=pubmed
  &term={query}{studyTypeFilter}{humanFilter}
  &retmax={pageSize}
  &retstart={(page-1) * pageSize}
  &sort=relevance
  &retmode=json
  &api_key={NCBI_API_KEY}
  &mindate={yearFrom}
  &maxdate={yearTo}
  &datetype=pdat
```

**Query construction**:
- Base: `{query}`
- Study type: append ` AND {studyType}[pt]`
- Human only: append ` AND humans[mh]`

### Step 2: esummary (get metadata)

```
GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi
  ?db=pubmed
  &id={comma-separated PMIDs from step 1}
  &retmode=json
  &api_key={NCBI_API_KEY}
```

## Response Normalization

PubMed esummary fields → PaperSearchResult:

| PubMed Field | Maps To |
|--------------|---------|
| uid | externalId (prefixed: `pmid:{uid}`) |
| — | source: "pubmed" |
| title | title |
| authors[].name | authors |
| fulljournalname | journal |
| pubdate (extract year) | year |
| — | abstract (not in esummary — fetch separately if needed, or omit) |
| elocationid (DOI) | doi |
| uid | pmid |
| — | url: `https://pubmed.ncbi.nlm.nih.gov/{uid}/` |
| — | isOpenAccess: false (PubMed doesn't indicate this in esummary) |
| — | citationCount: 0 (not available from PubMed) |
| pubtype | publicationType |

**Note**: PubMed esummary does NOT return abstracts. To get abstracts, use efetch with `rettype=abstract`. This adds a third API call per search. Decision: fetch abstracts for the 20 results shown (single efetch call with all PMIDs).

## Error Handling

- Timeout: 10 seconds per call
- On failure: Return `{ success: false, results: [], error: "PubMed unavailable" }`
- Do NOT throw — let unified endpoint continue with other sources
