import { describe, it, expect } from "vitest";
import {
  normalizePubMedArticle,
  normalizeS2Paper,
  normalizeOpenAlexWork,
  reconstructAbstract,
} from "@/lib/search/normalize";
import type { PubMedArticle, S2Paper, OpenAlexWork } from "@/lib/search/types";

describe("normalizePubMedArticle", () => {
  const baseArticle: PubMedArticle = {
    uid: "12345678",
    pubdate: "2023 Jan",
    epubdate: "",
    source: "PubMed",
    authors: [
      { name: "Smith J", authtype: "Author" },
      { name: "Doe A", authtype: "Author" },
    ],
    title: "A Study on Surgery",
    fulljournalname: "Journal of Surgery",
    elocationid: "doi: 10.1234/test.001",
    pubtype: ["Journal Article"],
    sortfirstauthor: "Smith J",
  };

  it("normalizes a complete PubMed article", () => {
    const result = normalizePubMedArticle(baseArticle, "Abstract text here.");
    expect(result.externalId).toBe("pmid:12345678");
    expect(result.source).toBe("pubmed");
    expect(result.sources).toEqual(["pubmed"]);
    expect(result.title).toBe("A Study on Surgery");
    expect(result.authors).toEqual(["Smith J", "Doe A"]);
    expect(result.journal).toBe("Journal of Surgery");
    expect(result.year).toBe(2023);
    expect(result.abstract).toBe("Abstract text here.");
    expect(result.doi).toBe("10.1234/test.001");
    expect(result.pmid).toBe("12345678");
    expect(result.isOpenAccess).toBe(false);
    expect(result.citationCount).toBe(0);
    expect(result.publicationType).toBe("Journal Article");
  });

  it("handles missing authors", () => {
    const article = { ...baseArticle, authors: [] };
    const result = normalizePubMedArticle(article);
    expect(result.authors).toEqual([]);
  });

  it("handles missing year/pubdate", () => {
    const article = { ...baseArticle, pubdate: "" };
    const result = normalizePubMedArticle(article);
    expect(result.year).toBeNull();
  });

  it("handles missing DOI in elocationid", () => {
    const article = { ...baseArticle, elocationid: "" };
    const result = normalizePubMedArticle(article);
    expect(result.doi).toBeNull();
  });

  it("handles no abstract provided", () => {
    const result = normalizePubMedArticle(baseArticle);
    expect(result.abstract).toBeNull();
  });

  it("extracts DOI from elocationid with doi: prefix", () => {
    const article = { ...baseArticle, elocationid: "doi: 10.9999/abc.123" };
    const result = normalizePubMedArticle(article);
    expect(result.doi).toBe("10.9999/abc.123");
  });
});

describe("normalizeS2Paper", () => {
  const basePaper: S2Paper = {
    paperId: "abc123",
    title: "Deep Learning in Medicine",
    authors: [
      { authorId: "1", name: "Alice" },
      { authorId: "2", name: "Bob" },
    ],
    year: 2024,
    abstract: "We present a deep learning approach...",
    citationCount: 150,
    isOpenAccess: true,
    externalIds: { DOI: "10.5555/dl.med", PubMed: "87654321" },
    journal: { name: "Nature Medicine" },
    url: "https://semanticscholar.org/paper/abc123",
    publicationTypes: ["JournalArticle"],
  };

  it("normalizes a complete S2 paper", () => {
    const result = normalizeS2Paper(basePaper);
    expect(result.externalId).toBe("s2:abc123");
    expect(result.source).toBe("semantic_scholar");
    expect(result.authors).toEqual(["Alice", "Bob"]);
    expect(result.doi).toBe("10.5555/dl.med");
    expect(result.pmid).toBe("87654321");
    expect(result.citationCount).toBe(150);
    expect(result.isOpenAccess).toBe(true);
    expect(result.journal).toBe("Nature Medicine");
  });

  it("handles null externalIds", () => {
    const paper = { ...basePaper, externalIds: null };
    const result = normalizeS2Paper(paper);
    expect(result.doi).toBeNull();
    expect(result.pmid).toBeNull();
  });

  it("handles null journal", () => {
    const paper = { ...basePaper, journal: null };
    const result = normalizeS2Paper(paper);
    expect(result.journal).toBeNull();
  });

  it("handles empty authors", () => {
    const paper = { ...basePaper, authors: [] };
    const result = normalizeS2Paper(paper);
    expect(result.authors).toEqual([]);
  });

  it("handles null publicationTypes", () => {
    const paper = { ...basePaper, publicationTypes: null };
    const result = normalizeS2Paper(paper);
    expect(result.publicationType).toBeNull();
  });
});

describe("normalizeOpenAlexWork", () => {
  const baseWork: OpenAlexWork = {
    id: "https://openalex.org/W12345",
    title: "Global Health Trends",
    authorships: [
      { author: { id: "A1", display_name: "Charlie" } },
      { author: { id: "A2", display_name: "Dana" } },
    ],
    publication_year: 2022,
    abstract_inverted_index: { Global: [0], health: [1], is: [2], important: [3] },
    cited_by_count: 42,
    doi: "https://doi.org/10.7777/global.health",
    open_access: { is_oa: true, oa_url: "https://example.com/oa" },
    primary_location: {
      source: { display_name: "The Lancet" },
      landing_page_url: "https://example.com/landing",
    },
    type: "article",
    ids: { pmid: "https://pubmed.ncbi.nlm.nih.gov/55555555/" },
  };

  it("normalizes a complete OpenAlex work", () => {
    const result = normalizeOpenAlexWork(baseWork);
    expect(result.externalId).toBe("oa:W12345");
    expect(result.source).toBe("openalex");
    expect(result.authors).toEqual(["Charlie", "Dana"]);
    expect(result.doi).toBe("10.7777/global.health");
    expect(result.pmid).toBe("55555555");
    expect(result.journal).toBe("The Lancet");
    expect(result.year).toBe(2022);
    expect(result.isOpenAccess).toBe(true);
    expect(result.url).toBe("https://example.com/oa");
    expect(result.citationCount).toBe(42);
  });

  it("handles null abstract_inverted_index", () => {
    const work = { ...baseWork, abstract_inverted_index: null };
    const result = normalizeOpenAlexWork(work);
    expect(result.abstract).toBeNull();
  });

  it("handles null primary_location", () => {
    const work = { ...baseWork, primary_location: null };
    const result = normalizeOpenAlexWork(work);
    expect(result.journal).toBeNull();
  });

  it("handles DOI without doi.org prefix", () => {
    const work = { ...baseWork, doi: null };
    const result = normalizeOpenAlexWork(work);
    expect(result.doi).toBeNull();
  });

  it("handles missing PMID in ids", () => {
    const work = { ...baseWork, ids: {} };
    const result = normalizeOpenAlexWork(work);
    expect(result.pmid).toBeNull();
  });

  it("prefers OA URL over landing page URL", () => {
    const result = normalizeOpenAlexWork(baseWork);
    expect(result.url).toBe("https://example.com/oa");
  });

  it("falls back to landing page URL when no OA URL", () => {
    const work = {
      ...baseWork,
      open_access: { is_oa: false, oa_url: null },
    };
    const result = normalizeOpenAlexWork(work);
    expect(result.url).toBe("https://example.com/landing");
  });
});

describe("reconstructAbstract", () => {
  it("reconstructs abstract from inverted index", () => {
    const index = { Hello: [0], world: [1], of: [2], science: [3] };
    expect(reconstructAbstract(index)).toBe("Hello world of science");
  });

  it("handles words at non-consecutive positions", () => {
    const index = { the: [0, 3], cat: [1], sat: [2], mat: [4] };
    expect(reconstructAbstract(index)).toBe("the cat sat the mat");
  });

  it("handles empty inverted index", () => {
    expect(reconstructAbstract({})).toBe("");
  });
});
