import { NextRequest, NextResponse } from "next/server";
import { captureApiError } from "@/lib/sentry-helpers";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { deduplicateResults } from "@/lib/search/deduplicate";
import {
  buildCacheKey,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/search/cache";
import type {
  PaperSearchResult,
  SearchResponse,
  SourceSearchResult,
  SourceStatus,
  SortOption,
} from "@/lib/search/types";

const PAGE_SIZE = 20;

export async function POST(req: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(req, "search");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const {
      query,
      filters = {},
      sort = "relevance",
      page = 1,
    } = body as {
      query: string;
      filters?: Record<string, unknown>;
      sort?: SortOption;
      page?: number;
    };

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = buildCacheKey(query, filters, sort, page);
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const baseUrl = req.nextUrl.origin;

    const sourceParams = {
      query: query.trim(),
      yearFrom: filters.yearFrom as number | undefined,
      yearTo: filters.yearTo as number | undefined,
      studyType: filters.studyType as string | undefined,
      humanOnly: filters.humanOnly as boolean | undefined,
      openAccessOnly: filters.openAccessOnly as boolean | undefined,
      page,
      pageSize: PAGE_SIZE,
    };

    // Call all 3 sources in parallel — use allSettled for graceful degradation
    const [pubmedResult, s2Result, oaResult] = await Promise.allSettled([
      callSource(`${baseUrl}/api/search/pubmed`, sourceParams),
      callSource(`${baseUrl}/api/search/semantic-scholar`, sourceParams),
      callSource(`${baseUrl}/api/search/openalex`, sourceParams),
    ]);

    const pubmed = extractResult(pubmedResult);
    const s2 = extractResult(s2Result);
    const oa = extractResult(oaResult);

    // Merge all results
    const allResults = [
      ...pubmed.results,
      ...s2.results,
      ...oa.results,
    ];

    // Deduplicate
    const deduplicated = deduplicateResults(allResults);

    // Sort
    const sorted = sortResults(deduplicated, sort);

    // Calculate totals (approximate — dedup reduces count)
    const totalFromSources = pubmed.total + s2.total + oa.total;
    // Estimate dedup reduction ratio from this page
    const dedupRatio =
      allResults.length > 0 ? deduplicated.length / allResults.length : 1;
    const estimatedTotal = Math.round(totalFromSources * dedupRatio);

    const response: SearchResponse = {
      results: sorted,
      totalResults: estimatedTotal,
      page,
      totalPages: Math.ceil(estimatedTotal / PAGE_SIZE),
      sources: {
        pubmed: toSourceStatus(pubmed),
        semanticScholar: toSourceStatus(s2),
        openAlex: toSourceStatus(oa),
      },
      cached: false,
    };

    // Cache the response (fire-and-forget — don't block response)
    setCachedResponse(cacheKey, response).catch(() => {});

    return NextResponse.json(response);
  } catch (error) {
    captureApiError(error, "/api/search");
    console.error("Search aggregation error:", error);
    return NextResponse.json(
      { error: "Search temporarily unavailable" },
      { status: 500 }
    );
  }
}

async function callSource(
  url: string,
  params: Record<string, unknown>
): Promise<SourceSearchResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Source returned HTTP ${res.status}`);
  }
  return await res.json();
}

function extractResult(
  settled: PromiseSettledResult<SourceSearchResult>
): SourceSearchResult {
  if (settled.status === "fulfilled") {
    return settled.value;
  }
  return {
    success: false,
    results: [],
    total: 0,
    error: settled.reason?.message || "Source unavailable",
  };
}

function toSourceStatus(result: SourceSearchResult): SourceStatus {
  return {
    success: result.success,
    count: result.results.length,
    error: result.error,
  };
}

function sortResults(
  results: PaperSearchResult[],
  sort: SortOption
): PaperSearchResult[] {
  switch (sort) {
    case "newest":
      return [...results].sort(
        (a, b) => (b.year ?? 0) - (a.year ?? 0)
      );
    case "citations":
      return [...results].sort(
        (a, b) => b.citationCount - a.citationCount
      );
    case "relevance":
    default:
      // Keep original order (APIs return in relevance order)
      return results;
  }
}
