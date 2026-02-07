import { NextRequest, NextResponse } from "next/server";
import { normalizePubMedArticle } from "@/lib/search/normalize";
import type {
  PubMedESearchResult,
  PubMedESummaryResult,
  PubMedArticle,
  SourceSearchResult,
} from "@/lib/search/types";

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const TIMEOUT_MS = 10_000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await searchPubMed(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, results: [], total: 0, error: "PubMed unavailable" },
      { status: 200 }
    );
  }
}

async function searchPubMed(params: {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  studyType?: string;
  humanOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<SourceSearchResult> {
  const {
    query,
    yearFrom,
    yearTo,
    studyType,
    humanOnly,
    page = 1,
    pageSize = 20,
  } = params;

  // Build PubMed query with filters
  let term = query;
  if (studyType) term += ` AND ${studyType}[pt]`;
  if (humanOnly) term += " AND humans[mh]";

  const apiKey = process.env.NCBI_API_KEY || "";

  // Step 1: esearch — get PMIDs
  const searchParams = new URLSearchParams({
    db: "pubmed",
    term,
    retmax: String(pageSize),
    retstart: String((page - 1) * pageSize),
    sort: "relevance",
    retmode: "json",
  });
  if (apiKey) searchParams.set("api_key", apiKey);
  if (yearFrom) {
    searchParams.set("mindate", String(yearFrom));
    searchParams.set("datetype", "pdat");
  }
  if (yearTo) {
    searchParams.set("maxdate", String(yearTo));
    if (!yearFrom) searchParams.set("datetype", "pdat");
  }

  const searchRes = await fetchWithTimeout(
    `${EUTILS_BASE}/esearch.fcgi?${searchParams}`,
    TIMEOUT_MS
  );
  const searchData: PubMedESearchResult = await searchRes.json();

  const pmids = searchData.esearchresult?.idlist || [];
  const totalCount = parseInt(searchData.esearchresult?.count || "0", 10);

  if (pmids.length === 0) {
    return { success: true, results: [], total: 0 };
  }

  // Step 2: esummary — get metadata
  const summaryParams = new URLSearchParams({
    db: "pubmed",
    id: pmids.join(","),
    retmode: "json",
  });
  if (apiKey) summaryParams.set("api_key", apiKey);

  // Step 3: efetch — get abstracts (XML)
  const abstractParams = new URLSearchParams({
    db: "pubmed",
    id: pmids.join(","),
    rettype: "abstract",
    retmode: "xml",
  });
  if (apiKey) abstractParams.set("api_key", apiKey);

  const [summaryRes, abstractRes] = await Promise.all([
    fetchWithTimeout(
      `${EUTILS_BASE}/esummary.fcgi?${summaryParams}`,
      TIMEOUT_MS
    ),
    fetchWithTimeout(
      `${EUTILS_BASE}/efetch.fcgi?${abstractParams}`,
      TIMEOUT_MS
    ).catch(() => null),
  ]);

  const summaryData: PubMedESummaryResult = await summaryRes.json();
  const abstractMap = abstractRes
    ? await parseAbstractsXml(await abstractRes.text())
    : new Map<string, string>();

  // Normalize results
  const results = pmids
    .map((uid) => {
      const article = summaryData.result?.[uid] as PubMedArticle | undefined;
      if (!article || !article.title) return null;
      return normalizePubMedArticle(article, abstractMap.get(uid));
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return { success: true, results, total: totalCount };
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse PubMed efetch XML to extract abstracts per PMID.
 * Uses simple regex parsing to avoid XML parser dependencies.
 */
async function parseAbstractsXml(
  xml: string
): Promise<Map<string, string>> {
  const abstracts = new Map<string, string>();

  // Match each PubmedArticle block
  const articleRegex =
    /<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g;
  let match: RegExpExecArray | null;

  while ((match = articleRegex.exec(xml)) !== null) {
    const block = match[0];

    // Extract PMID
    const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmidMatch) continue;
    const pmid = pmidMatch[1];

    // Extract abstract text (may have multiple AbstractText elements)
    const abstractTexts: string[] = [];
    const abstractRegex =
      /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
    let abMatch: RegExpExecArray | null;

    while ((abMatch = abstractRegex.exec(block)) !== null) {
      // Strip any inner XML tags
      const text = abMatch[1].replace(/<[^>]+>/g, "").trim();
      if (text) abstractTexts.push(text);
    }

    if (abstractTexts.length > 0) {
      abstracts.set(pmid, abstractTexts.join(" "));
    }
  }

  return abstracts;
}
