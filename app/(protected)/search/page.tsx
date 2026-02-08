"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";
import { SearchFiltersPanel } from "@/components/search/search-filters";
import { SearchSort } from "@/components/search/search-sort";
import { SearchPagination } from "@/components/search/search-pagination";
import { SaveToLibrary } from "@/components/search/save-to-library";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, Compass } from "lucide-react";
import type {
  PaperSearchResult,
  SearchFilters,
  SearchResponse,
  SortOption,
} from "@/lib/search/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaperSearchResult[] | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sort, setSort] = useState<SortOption>("relevance");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [relatedResults, setRelatedResults] = useState<
    Record<string, PaperSearchResult[]>
  >({});
  const [loadingRelated, setLoadingRelated] = useState<string | null>(null);

  const performSearch = useCallback(
    async (
      searchQuery: string,
      searchFilters: SearchFilters,
      searchSort: SortOption,
      searchPage: number
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            filters: searchFilters,
            sort: searchSort,
            page: searchPage,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Search failed");
        }

        const data: SearchResponse = await res.json();
        setResults(data.results);
        setResponse(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Search temporarily unavailable"
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
    performSearch(newQuery, filters, sort, 1);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query) {
      setPage(1);
      performSearch(query, newFilters, sort, 1);
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    if (query) {
      setPage(1);
      performSearch(query, filters, newSort, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (query) {
      performSearch(query, filters, sort, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFindRelated = async (paperId: string) => {
    if (relatedResults[paperId] || loadingRelated === paperId) return;

    setLoadingRelated(paperId);
    try {
      const res = await fetch("/api/search/related", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setRelatedResults((prev) => ({
        ...prev,
        [paperId]: data.results || [],
      }));
    } finally {
      setLoadingRelated(null);
    }
  };

  const renderActions = (paper: PaperSearchResult) => {
    // Extract S2 paper ID for related papers
    const s2Id = paper.externalId.startsWith("s2:")
      ? paper.externalId.slice(3)
      : paper.doi || paper.pmid;

    return (
      <>
        <SaveToLibrary paper={paper} />
        {s2Id && (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] gap-1.5 text-xs sm:min-h-0"
            onClick={() => handleFindRelated(s2Id)}
            disabled={loadingRelated === s2Id}
          >
            <Compass className="h-3.5 w-3.5" />
            Find Related
          </Button>
        )}
      </>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search Papers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search across PubMed, Semantic Scholar, and OpenAlex simultaneously
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
          initialQuery={query}
        />
      </div>

      {/* Controls row */}
      {results && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] gap-1.5 sm:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? (
              <X className="h-4 w-4" />
            ) : (
              <SlidersHorizontal className="h-4 w-4" />
            )}
            Filters
          </Button>
          <SearchSort sort={sort} onSortChange={handleSortChange} />
        </div>
      )}

      {/* Main content: Filters sidebar + Results */}
      <div className="flex gap-6">
        {/* Filters sidebar — desktop always visible, mobile toggleable */}
        {results && (
          <aside
            className={`${
              showFilters ? "block" : "hidden"
            } w-full shrink-0 sm:block sm:w-56 lg:w-64 ${
              showFilters ? "absolute inset-x-4 z-10 rounded-lg border bg-background p-4 shadow-lg sm:static sm:p-0 sm:shadow-none sm:border-0" : ""
            }`}
          >
            <SearchFiltersPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </aside>
        )}

        {/* Results */}
        <div className="min-w-0 flex-1">
          <SearchResults
            results={results}
            response={response}
            isLoading={isLoading}
            error={error}
            query={query}
            renderActions={renderActions}
          />

          {/* Related papers sections */}
          {Object.entries(relatedResults).map(([paperId, related]) =>
            related.length > 0 ? (
              <div
                key={paperId}
                className="mt-4 rounded-lg border bg-muted/30 p-4"
              >
                <h4 className="mb-3 text-sm font-semibold">
                  Related Papers
                </h4>
                <div className="space-y-3">
                  {related.map((rp) => (
                    <div key={rp.externalId} className="text-sm">
                      <SearchResults
                        results={[rp]}
                        response={null}
                        isLoading={false}
                        error={null}
                        query=""
                        renderActions={renderActions}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}

          {/* Pagination */}
          {response && response.totalPages > 1 && (
            <div className="mt-6">
              <SearchPagination
                page={page}
                totalPages={response.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
