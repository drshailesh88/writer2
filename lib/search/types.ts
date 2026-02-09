// ─── Paper Search Result (transient — not persisted) ───

export interface PaperSearchResult {
  externalId: string;
  source: "pubmed" | "semantic_scholar" | "openalex";
  sources: string[];
  title: string;
  authors: string[];
  journal: string | null;
  year: number | null;
  abstract: string | null;
  doi: string | null;
  pmid: string | null;
  url: string | null;
  isOpenAccess: boolean;
  citationCount: number;
  publicationType: string | null;
}

// ─── Search Query (client state) ───

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  studyType?: string;
  openAccessOnly?: boolean;
  humanOnly?: boolean;
}

export type SortOption = "relevance" | "newest" | "citations";

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  sort?: SortOption;
  page?: number;
}

// ─── Search Response ───

export interface SourceStatus {
  success: boolean;
  count: number;
  error?: string;
}

export interface SearchResponse {
  results: PaperSearchResult[];
  totalResults: number;
  page: number;
  totalPages: number;
  sources: {
    pubmed: SourceStatus;
    semanticScholar: SourceStatus;
    openAlex: SourceStatus;
  };
  cached: boolean;
}

// ─── Related Papers Response ───

export interface RelatedPapersResponse {
  results: PaperSearchResult[];
}

// ─── Per-Source Raw Response Types ───

// PubMed E-utilities
export interface PubMedESearchResult {
  esearchresult: {
    count: string;
    retmax: string;
    retstart: string;
    idlist: string[];
  };
}

export interface PubMedAuthor {
  name: string;
  authtype: string;
}

export interface PubMedArticle {
  uid: string;
  pubdate: string;
  epubdate: string;
  source: string;
  authors: PubMedAuthor[];
  title: string;
  fulljournalname: string;
  elocationid: string;
  pubtype: string[];
  sortfirstauthor: string;
}

export interface PubMedESummaryResult {
  result: {
    uids: string[];
    [uid: string]: PubMedArticle | string[];
  };
}

export interface PubMedAbstractResult {
  PubmedArticleSet?: Array<{
    MedlineCitation?: {
      Article?: {
        Abstract?: {
          AbstractText?: string | Array<{ _: string; $: { Label: string } }>;
        };
      };
    };
  }>;
}

// Semantic Scholar
export interface S2Author {
  authorId: string;
  name: string;
}

export interface S2Paper {
  paperId: string;
  title: string;
  authors: S2Author[];
  year: number | null;
  abstract: string | null;
  citationCount: number;
  isOpenAccess: boolean;
  externalIds: {
    DOI?: string;
    PubMed?: string;
    ArXiv?: string;
  } | null;
  journal: { name: string } | null;
  url: string | null;
  publicationTypes: string[] | null;
}

export interface S2SearchResponse {
  total: number;
  offset: number;
  data: S2Paper[];
}

// OpenAlex
export interface OpenAlexAuthorship {
  author: {
    id: string;
    display_name: string;
  };
}

export interface OpenAlexWork {
  id: string;
  title: string;
  authorships: OpenAlexAuthorship[];
  publication_year: number | null;
  abstract_inverted_index: Record<string, number[]> | null;
  cited_by_count: number;
  doi: string | null;
  open_access: {
    is_oa: boolean;
    oa_url: string | null;
  };
  primary_location: {
    source: { display_name: string } | null;
    landing_page_url: string | null;
  } | null;
  type: string;
  ids: {
    pmid?: string;
    doi?: string;
  };
}

export interface OpenAlexSearchResponse {
  meta: {
    count: number;
    per_page: number;
    page: number;
  };
  results: OpenAlexWork[];
}

// ─── Internal Source Result (before deduplication) ───

export interface SourceSearchResult {
  success: boolean;
  results: PaperSearchResult[];
  total: number;
  error?: string;
}
