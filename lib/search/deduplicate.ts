import type { PaperSearchResult } from "./types";

/**
 * Deduplicate paper results from multiple sources.
 * Strategy: DOI match (primary) → PMID match (secondary) → title similarity >90% (fallback).
 * Merge metadata: prefer PubMed for medical fields, Semantic Scholar for citation counts.
 */
export function deduplicateResults(
  results: PaperSearchResult[]
): PaperSearchResult[] {
  const merged: PaperSearchResult[] = [];
  const doiMap = new Map<string, number>(); // DOI → index in merged
  const pmidMap = new Map<string, number>(); // PMID → index in merged

  for (const result of results) {
    const normalizedDoi = result.doi ? normalizeDoi(result.doi) : null;
    const normalizedPmid = result.pmid || null;

    // Tier 1: Match by DOI
    if (normalizedDoi && doiMap.has(normalizedDoi)) {
      const idx = doiMap.get(normalizedDoi)!;
      merged[idx] = mergeResults(merged[idx], result);
      if (normalizedPmid && !pmidMap.has(normalizedPmid)) {
        pmidMap.set(normalizedPmid, idx);
      }
      continue;
    }

    // Tier 2: Match by PMID
    if (normalizedPmid && pmidMap.has(normalizedPmid)) {
      const idx = pmidMap.get(normalizedPmid)!;
      merged[idx] = mergeResults(merged[idx], result);
      if (normalizedDoi && !doiMap.has(normalizedDoi)) {
        doiMap.set(normalizedDoi, idx);
      }
      continue;
    }

    // Tier 3: Title similarity
    const titleMatch = findTitleMatch(result, merged);
    if (titleMatch !== -1) {
      merged[titleMatch] = mergeResults(merged[titleMatch], result);
      if (normalizedDoi && !doiMap.has(normalizedDoi)) {
        doiMap.set(normalizedDoi, titleMatch);
      }
      if (normalizedPmid && !pmidMap.has(normalizedPmid)) {
        pmidMap.set(normalizedPmid, titleMatch);
      }
      continue;
    }

    // No match — add as new result
    const idx = merged.length;
    merged.push({ ...result });
    if (normalizedDoi) doiMap.set(normalizedDoi, idx);
    if (normalizedPmid) pmidMap.set(normalizedPmid, idx);
  }

  return merged;
}

function normalizeDoi(doi: string): string {
  return doi
    .toLowerCase()
    .replace(/^https?:\/\/doi\.org\//i, "")
    .trim();
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findTitleMatch(
  result: PaperSearchResult,
  merged: PaperSearchResult[]
): number {
  const normTitle = normalizeTitle(result.title);
  if (normTitle.length < 10) return -1; // Too short for reliable matching

  for (let i = 0; i < merged.length; i++) {
    const existingTitle = normalizeTitle(merged[i].title);
    if (titleSimilarity(normTitle, existingTitle) > 0.9) {
      return i;
    }
  }
  return -1;
}

/**
 * Simple character-overlap similarity.
 * Faster than Levenshtein, sufficient for academic paper title matching.
 */
function titleSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;
  if (longer.length === 0) return 1;

  // Check if shorter is a substring (common with trailing periods)
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }

  // Bigram similarity (Dice coefficient)
  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);
  let intersection = 0;

  for (const bigram of bigramsA) {
    if (bigramsB.has(bigram)) {
      intersection++;
    }
  }

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

/**
 * Merge two results representing the same paper.
 * Priority: PubMed for medical metadata, Semantic Scholar for citations.
 */
function mergeResults(
  existing: PaperSearchResult,
  incoming: PaperSearchResult
): PaperSearchResult {
  const sources = [...new Set([...existing.sources, ...incoming.sources])];

  return {
    // Keep the primary identifier from whichever was first
    externalId: existing.externalId,
    source: existing.source,
    sources,
    // Prefer PubMed title (usually more complete for medical papers)
    title: preferSource(existing, incoming, "pubmed", "title"),
    // Prefer PubMed authors
    authors:
      hasSource(existing, "pubmed")
        ? existing.authors
        : incoming.authors.length > existing.authors.length
          ? incoming.authors
          : existing.authors,
    // Prefer PubMed journal name
    journal: preferSourceNullable(existing, incoming, "pubmed", "journal"),
    // Take the non-null year
    year: existing.year ?? incoming.year,
    // Prefer longer abstract
    abstract:
      (existing.abstract?.length ?? 0) >= (incoming.abstract?.length ?? 0)
        ? existing.abstract
        : incoming.abstract,
    // Take any DOI available
    doi: existing.doi ?? incoming.doi,
    // Take any PMID available
    pmid: existing.pmid ?? incoming.pmid,
    // Prefer open access URL
    url: existing.url ?? incoming.url,
    // Either source says OA → mark as OA
    isOpenAccess: existing.isOpenAccess || incoming.isOpenAccess,
    // Prefer Semantic Scholar citation count (most accurate)
    citationCount: hasSource(incoming, "semantic_scholar")
      ? incoming.citationCount
      : Math.max(existing.citationCount, incoming.citationCount),
    // Prefer PubMed publication type
    publicationType: preferSourceNullable(
      existing,
      incoming,
      "pubmed",
      "publicationType"
    ),
  };
}

function hasSource(result: PaperSearchResult, source: string): boolean {
  return result.source === source || result.sources.includes(source);
}

function preferSource(
  existing: PaperSearchResult,
  incoming: PaperSearchResult,
  preferred: string,
  field: keyof PaperSearchResult
): string {
  if (hasSource(incoming, preferred) && incoming[field]) {
    return incoming[field] as string;
  }
  return (existing[field] as string) || (incoming[field] as string) || "";
}

function preferSourceNullable(
  existing: PaperSearchResult,
  incoming: PaperSearchResult,
  preferred: string,
  field: keyof PaperSearchResult
): string | null {
  if (hasSource(incoming, preferred) && incoming[field]) {
    return incoming[field] as string;
  }
  return (existing[field] as string | null) ?? (incoming[field] as string | null);
}
