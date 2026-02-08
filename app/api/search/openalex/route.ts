import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { normalizeOpenAlexWork } from "@/lib/search/normalize";
import type { OpenAlexSearchResponse, SourceSearchResult } from "@/lib/search/types";

const OA_BASE = "https://api.openalex.org";
const TIMEOUT_MS = 10_000;

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, "search");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const result = await searchOpenAlex(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        success: false,
        results: [],
        total: 0,
        error: "OpenAlex unavailable",
      },
      { status: 200 }
    );
  }
}

async function searchOpenAlex(params: {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  openAccessOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<SourceSearchResult> {
  const {
    query,
    yearFrom,
    yearTo,
    openAccessOnly,
    page = 1,
    pageSize = 20,
  } = params;

  const searchParams = new URLSearchParams({
    search: query,
    page: String(page),
    per_page: String(pageSize),
    sort: "relevance_score:desc",
  });

  // Polite pool — higher rate limits
  const email = process.env.OPENALEX_EMAIL;
  if (email) {
    searchParams.set("mailto", email);
  }

  // Build filters
  const filters: string[] = [];
  if (yearFrom && yearTo) {
    filters.push(`publication_year:${yearFrom}-${yearTo}`);
  } else if (yearFrom) {
    filters.push(`publication_year:${yearFrom}-`);
  } else if (yearTo) {
    filters.push(`publication_year:-${yearTo}`);
  }
  if (openAccessOnly) {
    filters.push("is_oa:true");
  }

  if (filters.length > 0) {
    searchParams.set("filter", filters.join(","));
  }

  const url = `${OA_BASE}/works?${searchParams}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: OpenAlexSearchResponse = await res.json();

    const results = (data.results || []).map(normalizeOpenAlexWork);

    return {
      success: true,
      results,
      total: data.meta?.count || 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}
