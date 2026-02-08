import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { SearchResponse } from "./types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const PAGE_SIZE = 20;

export function buildCacheKey(
  query: string,
  filters: Record<string, unknown>,
  sort: string,
  page: number
): string {
  const normalizedQuery = query.toLowerCase().trim();
  const sortedFilters = JSON.stringify(filters, Object.keys(filters).sort());
  return `${normalizedQuery}|${sortedFilters}|${sort}|${page}`;
}

export async function getCachedResponse(
  key: string
): Promise<SearchResponse | null> {
  try {
    const entry = await convex.action(api.searchCache.getCachedSearch, {
      queryHash: key,
    });
    if (!entry) return null;

    // Extract page from cache key (format: "query|filters|sort|page")
    const parts = key.split("|");
    const page = parseInt(parts[parts.length - 1], 10) || 1;

    const sources = entry.sourceStatus as SearchResponse["sources"] | undefined;
    return {
      results: entry.results as SearchResponse["results"],
      totalResults: entry.totalResults,
      page,
      totalPages: Math.ceil(entry.totalResults / PAGE_SIZE),
      sources: sources ?? {
        pubmed: { success: false, count: 0 },
        semanticScholar: { success: false, count: 0 },
        openAlex: { success: false, count: 0 },
      },
      cached: true,
    };
  } catch (error) {
    console.error("Search cache read error:", error);
    return null; // Treat as cache miss
  }
}

export async function setCachedResponse(
  key: string,
  data: SearchResponse
): Promise<void> {
  try {
    await convex.action(api.searchCache.setCachedSearch, {
      queryHash: key,
      results: data.results,
      totalResults: data.totalResults,
      sourceStatus: data.sources,
    });
  } catch (error) {
    console.error("Search cache write error:", error);
    // Non-fatal — search still works without caching
  }
}
