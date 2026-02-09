import type {
  PaperSearchResult,
  PubMedArticle,
  S2Paper,
  OpenAlexWork,
} from "./types";

// ─── PubMed Normalizer ───

export function normalizePubMedArticle(
  article: PubMedArticle,
  abstract?: string
): PaperSearchResult {
  const year = extractYear(article.pubdate);
  const doi = extractDoi(article.elocationid);

  return {
    externalId: `pmid:${article.uid}`,
    source: "pubmed",
    sources: ["pubmed"],
    title: article.title || "",
    authors: (article.authors || []).map((a) => a.name),
    journal: article.fulljournalname || null,
    year,
    abstract: abstract || null,
    doi,
    pmid: article.uid,
    url: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
    isOpenAccess: false,
    citationCount: 0,
    publicationType: article.pubtype?.[0] || null,
  };
}

function extractYear(pubdate: string): number | null {
  if (!pubdate) return null;
  const match = pubdate.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

function extractDoi(elocationid: string): string | null {
  if (!elocationid) return null;
  const match = elocationid.match(/(?:doi:\s*)?(10\.\S+)/i);
  return match ? match[1] : null;
}

// ─── Semantic Scholar Normalizer ───

export function normalizeS2Paper(paper: S2Paper): PaperSearchResult {
  return {
    externalId: `s2:${paper.paperId}`,
    source: "semantic_scholar",
    sources: ["semantic_scholar"],
    title: paper.title || "",
    authors: (paper.authors || []).map((a) => a.name),
    journal: paper.journal?.name || null,
    year: paper.year,
    abstract: paper.abstract || null,
    doi: paper.externalIds?.DOI || null,
    pmid: paper.externalIds?.PubMed || null,
    url: paper.url || null,
    isOpenAccess: paper.isOpenAccess ?? false,
    citationCount: paper.citationCount ?? 0,
    publicationType: paper.publicationTypes?.[0] || null,
  };
}

// ─── OpenAlex Normalizer ───

export function normalizeOpenAlexWork(work: OpenAlexWork): PaperSearchResult {
  const doi = work.doi
    ? work.doi.replace("https://doi.org/", "")
    : null;

  const pmid = work.ids?.pmid
    ? work.ids.pmid.replace("https://pubmed.ncbi.nlm.nih.gov/", "").replace("/", "")
    : null;

  const oaId = work.id
    ? work.id.replace("https://openalex.org/", "")
    : work.id;

  return {
    externalId: `oa:${oaId}`,
    source: "openalex",
    sources: ["openalex"],
    title: work.title || "",
    authors: (work.authorships || []).map((a) => a.author.display_name),
    journal: work.primary_location?.source?.display_name || null,
    year: work.publication_year,
    abstract: work.abstract_inverted_index
      ? reconstructAbstract(work.abstract_inverted_index)
      : null,
    doi,
    pmid,
    url:
      work.open_access?.oa_url ||
      work.primary_location?.landing_page_url ||
      null,
    isOpenAccess: work.open_access?.is_oa ?? false,
    citationCount: work.cited_by_count ?? 0,
    publicationType: work.type || null,
  };
}

export function reconstructAbstract(
  invertedIndex: Record<string, number[]>
): string {
  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }
  words.sort((a, b) => a[0] - b[0]);
  return words.map(([, word]) => word).join(" ");
}
