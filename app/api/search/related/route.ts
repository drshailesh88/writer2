import { NextRequest, NextResponse } from "next/server";
import { normalizeS2Paper } from "@/lib/search/normalize";
import type { S2Paper } from "@/lib/search/types";

const S2_BASE = "https://api.semanticscholar.org";
const TIMEOUT_MS = 10_000;
const FIELDS =
  "paperId,title,authors,year,abstract,citationCount,isOpenAccess,externalIds,journal,url";

export async function POST(req: NextRequest) {
  try {
    const { paperId } = await req.json();

    if (!paperId) {
      return NextResponse.json(
        { error: "Paper ID is required" },
        { status: 400 }
      );
    }

    const headers: HeadersInit = {};
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const url = `${S2_BASE}/recommendations/v1/papers/forpaper/${encodeURIComponent(paperId)}?fields=${FIELDS}&limit=10`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeout);

      if (res.status === 404) {
        return NextResponse.json(
          { error: "Paper not found" },
          { status: 404 }
        );
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: { recommendedPapers: S2Paper[] } = await res.json();

      const results = (data.recommendedPapers || []).map(normalizeS2Paper);

      return NextResponse.json({ results });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json(
      { error: "Related papers temporarily unavailable" },
      { status: 500 }
    );
  }
}
