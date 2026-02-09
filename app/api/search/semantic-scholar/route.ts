import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { captureApiError } from "@/lib/sentry-helpers";
import { normalizeS2Paper } from "@/lib/search/normalize";
import type { S2SearchResponse, SourceSearchResult } from "@/lib/search/types";

const S2_BASE = "https://api.semanticscholar.org/graph/v1";
const TIMEOUT_MS = 10_000;
const FIELDS =
  "paperId,title,authors,year,abstract,citationCount,isOpenAccess,externalIds,journal,url,publicationTypes";

export async function POST(req: NextRequest) {
  const rateLimitResponse = await enforceRateLimit(req, "search");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const result = await searchSemanticScholar(body);
    return NextResponse.json(result);
  } catch (error) {
    captureApiError(error, "/api/search/semantic-scholar");
    console.error("Semantic Scholar search error:", error);
    return NextResponse.json(
      {
        success: false,
        results: [],
        total: 0,
        error: "Semantic Scholar unavailable",
      },
      { status: 200 }
    );
  }
}

async function searchSemanticScholar(params: {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  openAccessOnly?: boolean;
  studyType?: string;
  page?: number;
  pageSize?: number;
}): Promise<SourceSearchResult> {
  const {
    query,
    yearFrom,
    yearTo,
    openAccessOnly,
    studyType,
    page = 1,
    pageSize = 20,
  } = params;

  const searchParams = new URLSearchParams({
    query,
    offset: String((page - 1) * pageSize),
    limit: String(pageSize),
    fields: FIELDS,
  });

  // Year range filter
  if (yearFrom && yearTo) {
    searchParams.set("year", `${yearFrom}-${yearTo}`);
  } else if (yearFrom) {
    searchParams.set("year", `${yearFrom}-`);
  } else if (yearTo) {
    searchParams.set("year", `-${yearTo}`);
  }

  const url = `${S2_BASE}/paper/search?${searchParams}`;

  const headers: HeadersInit = {};
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timeout);

    if (!res.ok) {
      const status = res.status;
      if (status === 429) {
        return {
          success: false,
          results: [],
          total: 0,
          error: "Semantic Scholar rate limited",
        };
      }
      throw new Error(`HTTP ${status}`);
    }

    const data: S2SearchResponse = await res.json();

    let results = (data.data || []).map(normalizeS2Paper);

    // Client-side filters not supported by S2 API
    if (openAccessOnly) {
      results = results.filter((r) => r.isOpenAccess);
    }
    if (studyType) {
      const studyTypeLower = studyType.toLowerCase();
      results = results.filter(
        (r) =>
          r.publicationType &&
          r.publicationType.toLowerCase().includes(studyTypeLower)
      );
    }

    return {
      success: true,
      results,
      total: data.total || 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}
