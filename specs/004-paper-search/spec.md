# Feature Specification: Multi-Source Paper Search

**Feature Branch**: `004-paper-search`
**Created**: 2026-02-07
**Status**: Draft
**Input**: User description: "Multi-Source Paper Search"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Paper Search (Priority: P1)

A medical postgraduate student needs to find papers on "laparoscopic appendectomy outcomes" for their thesis. They navigate to the search page, type their query into a single search bar, and click search. The system queries PubMed, Semantic Scholar, and OpenAlex simultaneously and returns a unified, deduplicated list of papers. Each result shows the title, authors, journal name, publication year, a short abstract preview, an open access badge (if applicable), and the citation count.

**Why this priority**: Search is the core action. Without it, no other paper-related feature functions. This is the MVP that delivers immediate value to researchers.

**Independent Test**: Can be fully tested by entering a search term, submitting, and verifying results appear from multiple sources with correct metadata displayed.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the search page, **When** they type "laparoscopic appendectomy" and click search, **Then** results appear from at least two of the three sources within 5 seconds.
2. **Given** search results are displayed, **When** a paper exists in both PubMed and Semantic Scholar, **Then** only one entry appears (deduplicated by DOI or title similarity).
3. **Given** a search is in progress, **When** results are loading, **Then** the user sees a loading skeleton indicating results are being fetched.
4. **Given** a search query, **When** one API source fails (e.g., PubMed is down), **Then** results from the other two sources still display with a subtle notice that one source was unavailable.

---

### User Story 2 - Filtering and Sorting Results (Priority: P2)

After searching, the student wants to narrow results to recent, high-quality evidence. They apply filters: year range 2020-2025, study type "Randomized Controlled Trial", and toggle "Open Access Only". They sort by citation count to find the most influential papers first. The results update immediately to reflect these filters.

**Why this priority**: Filtering transforms a generic search into a targeted literature review tool. Medical researchers routinely filter by study type and recency, so this is essential for the target audience.

**Independent Test**: Can be tested by performing a search, applying each filter individually, and verifying that results change accordingly.

**Acceptance Scenarios**:

1. **Given** search results are displayed, **When** the user sets year range to 2020-2025, **Then** all displayed results have publication years within that range.
2. **Given** search results are displayed, **When** the user toggles "Open Access Only", **Then** only results with the open access badge are shown.
3. **Given** search results are displayed, **When** the user selects "Sort by Citation Count", **Then** results reorder with highest citation count first.
4. **Given** filters are applied, **When** the user clears all filters, **Then** the original unfiltered results return.

---

### User Story 3 - Save Paper to Library (Priority: P2)

The student finds a relevant paper and clicks "Save to Library" on the result card. The paper is saved to their personal library. If the paper is already in their library, the button shows "Saved" and is disabled. The student can optionally choose a collection (folder) to save the paper into.

**Why this priority**: Saving papers bridges search and the downstream writing workflow (Learn Mode and Draft Mode both require an approved paper library). Without save functionality, search results are ephemeral and disconnected from the core product.

**Independent Test**: Can be tested by saving a paper, navigating to the library, and confirming the paper appears there with correct metadata.

**Acceptance Scenarios**:

1. **Given** a search result, **When** the user clicks "Save to Library", **Then** the paper is persisted in their library with all metadata (title, authors, journal, year, abstract, DOI, source, open access status).
2. **Given** a paper is already in the user's library (matched by external ID), **When** search results display, **Then** the "Save to Library" button shows "Saved" and is not clickable.
3. **Given** the user has collections, **When** they save a paper, **Then** they can optionally assign it to a collection via a dropdown.
4. **Given** the user is not logged in, **When** they attempt to save a paper, **Then** they are prompted to sign in.

---

### User Story 4 - View Full Abstract and Find Related Papers (Priority: P3)

The student wants to read the complete abstract of a result before saving it. They click "View Full Abstract" and the abstract expands inline. They also click "Find Related" to discover papers similar to one they find promising. A new set of related papers appears, which they can also save.

**Why this priority**: Full abstracts and related paper discovery enhance the research experience but are additions to the core search-save loop.

**Independent Test**: Can be tested by expanding an abstract and verifying full text appears; clicking "Find Related" and verifying a new set of results loads.

**Acceptance Scenarios**:

1. **Given** a search result with a truncated abstract, **When** the user clicks "View Full Abstract", **Then** the full abstract text expands inline below the result card.
2. **Given** a search result, **When** the user clicks "Find Related", **Then** a new set of related papers loads (sourced via recommendation API).
3. **Given** related papers are displayed, **When** the user clicks "Save to Library" on a related paper, **Then** it saves just like a regular search result.

---

### User Story 5 - Paginated Results (Priority: P3)

The student searches for a broad topic and gets many results. Results are displayed 20 per page. They can navigate between pages to browse more results.

**Why this priority**: Pagination is a standard UX expectation for search but is not critical for initial validation.

**Independent Test**: Can be tested by performing a broad search and navigating to page 2, verifying new results load.

**Acceptance Scenarios**:

1. **Given** a search returns more than 20 results, **When** results display, **Then** only 20 results are shown with a pagination control.
2. **Given** the user is on page 1, **When** they click "Next" or page 2, **Then** the next 20 results load.
3. **Given** the user is on page 2 with filters applied, **When** they navigate, **Then** filters are preserved across pages.

---

### Edge Cases

- What happens when the search query is empty? The search button is disabled; a validation message appears.
- What happens when all three APIs return zero results? A "No results found" message displays with suggestions to broaden the query.
- What happens when the user's internet connection drops mid-search? A clear error message with a retry option.
- What happens when a paper has no DOI (common for older papers)? Deduplication falls back to title similarity matching.
- What happens when the same paper appears from all three sources with slightly different metadata (author names, journal abbreviations)? The system merges metadata with a source preference hierarchy.
- What happens when a user saves a paper and then the same paper appears in a later search? The "Save" button reflects the already-saved state.
- What happens when rate limits are hit on one of the APIs? The system returns results from available sources and informs the user.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to search for academic papers using a free-text search query.
- **FR-002**: System MUST query PubMed (E-utilities), Semantic Scholar, and OpenAlex APIs simultaneously for every search.
- **FR-003**: System MUST deduplicate results across sources using DOI as primary key and title similarity (>90% match) as fallback.
- **FR-004**: System MUST merge metadata from multiple sources for the same paper, preferring PubMed for medical metadata and Semantic Scholar for citation counts.
- **FR-005**: System MUST display each result with: title, authors (up to 3 + "et al."), journal name, publication year, abstract preview (first 150 characters), open access badge, and citation count.
- **FR-006**: System MUST provide filters: year range (from/to), study type (dropdown), open access only (toggle), human studies only (checkbox).
- **FR-007**: System MUST provide sorting options: Relevance (default), Newest first, Citation count (highest first).
- **FR-008**: System MUST allow authenticated users to save any search result to their personal paper library.
- **FR-009**: System MUST detect when a paper is already in the user's library and show a "Saved" state on the result card.
- **FR-010**: System MUST allow users to expand the full abstract inline for any result.
- **FR-011**: System MUST provide a "Find Related" action that discovers papers similar to a selected result.
- **FR-012**: System MUST paginate results at 20 per page with navigation controls.
- **FR-013**: System MUST handle API failures gracefully — if one source fails, results from the other sources still display.
- **FR-014**: System MUST show loading states during search and while individual API sources are resolving.
- **FR-015**: System MUST be fully responsive and usable on mobile devices (minimum 44px touch targets, stacked layout on small screens).
- **FR-016**: System MUST cache identical search queries for 1 hour to reduce redundant API calls.

### Key Entities

- **Search Query**: The user's free-text input, along with applied filters and sort preference.
- **Paper Result**: A standardized representation of an academic paper aggregated from one or more sources, containing: external ID, source(s), title, authors, journal, year, abstract, DOI, URL, open access status, citation count.
- **Saved Paper**: A paper result that has been persisted to the user's library, associated with their account and optionally a collection.
- **Collection**: A user-created folder for organizing saved papers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can enter a search query and see results from at least two sources within 5 seconds under normal conditions.
- **SC-002**: Duplicate papers from different sources are merged, with less than 5% visible duplication in any result set.
- **SC-003**: Users can save a paper to their library in a single click (no more than 1 action after finding the paper).
- **SC-004**: All filter and sort changes reflect in the displayed results within 1 second.
- **SC-005**: The search interface is fully usable on screens as small as 375px wide (iPhone SE) without horizontal scrolling.
- **SC-006**: When one API source fails, users still see results from the remaining sources without perceiving an error (graceful degradation).
- **SC-007**: 90% of medical postgraduate users can complete a search-and-save workflow (search, find, save) within 2 minutes on first use without assistance.

## Assumptions

- PubMed E-utilities, Semantic Scholar, and OpenAlex APIs remain free and publicly accessible.
- API rate limits are sufficient for the expected user base at launch (estimated <100 concurrent users).
- Users have stable internet connectivity during search operations.
- The existing database schema accommodates all metadata fields returned by the three APIs.
- Authentication is already integrated, so user identity is available for save operations.
- PubMed's E-utilities API requires an API key for higher rate limits (registered with NCBI).
- Semantic Scholar provides an API key for higher throughput on request.
- OpenAlex requires no API key but benefits from a polite email header for higher rate limits.
