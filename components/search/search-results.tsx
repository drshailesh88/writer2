"use client";

import { PaperCard } from "./paper-card";
import { PaperCardSkeleton } from "./paper-card-skeleton";
import { AlertCircle, SearchX } from "lucide-react";
import type { PaperSearchResult, SearchResponse } from "@/lib/search/types";

interface SearchResultsProps {
  results: PaperSearchResult[] | null;
  response: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  query: string;
  renderActions?: (paper: PaperSearchResult) => React.ReactNode;
}

export function SearchResults({
  results,
  response,
  isLoading,
  error,
  query,
  renderActions,
}: SearchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PaperCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // No search yet
  if (!results) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Search across 200M+ academic papers
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            PubMed &middot; Semantic Scholar &middot; OpenAlex
          </p>
        </div>
      </div>
    );
  }

  // No results
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium">
            No results found for &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try broader terms, check spelling, or remove some filters
          </p>
        </div>
      </div>
    );
  }

  // Source status notices
  const failedSources = response
    ? Object.entries(response.sources)
        .filter(([, s]) => !s.success)
        .map(([name]) => name)
    : [];

  return (
    <div className="space-y-4">
      {/* Source notice */}
      {failedSources.length > 0 && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertCircle className="mr-1 inline h-3 w-3" />
          Some sources unavailable: {failedSources.join(", ")}. Showing
          results from available sources.
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {response?.totalResults.toLocaleString() ?? results.length} results
        {response?.cached && " (cached)"}
      </p>

      {/* Results list */}
      {results.map((paper) => (
        <PaperCard
          key={paper.externalId}
          paper={paper}
          actions={renderActions?.(paper)}
        />
      ))}
    </div>
  );
}
