import { describe, it, expect } from "vitest";
import { deduplicateResults } from "@/lib/search/deduplicate";
import type { PaperSearchResult } from "@/lib/search/types";

function makePaper(overrides: Partial<PaperSearchResult> = {}): PaperSearchResult {
  return {
    externalId: "test:1",
    source: "pubmed",
    sources: ["pubmed"],
    title: "A Study on Laparoscopic Appendectomy in Pediatric Patients",
    authors: ["Smith J", "Doe A"],
    journal: "Journal of Surgery",
    year: 2023,
    abstract: "Background: This study examines...",
    doi: "10.1234/test.001",
    pmid: "12345678",
    url: "https://pubmed.ncbi.nlm.nih.gov/12345678/",
    isOpenAccess: false,
    citationCount: 10,
    publicationType: "Journal Article",
    ...overrides,
  };
}

describe("deduplicateResults", () => {
  it("returns empty array for empty input", () => {
    expect(deduplicateResults([])).toEqual([]);
  });

  it("returns single result unchanged", () => {
    const paper = makePaper();
    const result = deduplicateResults([paper]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe(paper.title);
  });

  it("deduplicates by DOI (same DOI, different sources)", () => {
    const pubmed = makePaper({ source: "pubmed", sources: ["pubmed"], doi: "10.1234/test.001" });
    const s2 = makePaper({
      externalId: "s2:abc",
      source: "semantic_scholar",
      sources: ["semantic_scholar"],
      doi: "10.1234/test.001",
      citationCount: 50,
    });

    const result = deduplicateResults([pubmed, s2]);
    expect(result).toHaveLength(1);
    expect(result[0].sources).toContain("pubmed");
    expect(result[0].sources).toContain("semantic_scholar");
  });

  it("normalizes DOI (case insensitive, strips doi.org prefix)", () => {
    const a = makePaper({ doi: "10.1234/TEST.001" });
    const b = makePaper({
      externalId: "s2:abc",
      source: "semantic_scholar",
      sources: ["semantic_scholar"],
      doi: "https://doi.org/10.1234/test.001",
    });

    const result = deduplicateResults([a, b]);
    expect(result).toHaveLength(1);
  });

  it("deduplicates by PMID when DOI is missing", () => {
    const pubmed = makePaper({ doi: null, pmid: "99999" });
    const oa = makePaper({
      externalId: "oa:W123",
      source: "openalex",
      sources: ["openalex"],
      doi: null,
      pmid: "99999",
    });

    const result = deduplicateResults([pubmed, oa]);
    expect(result).toHaveLength(1);
    expect(result[0].sources).toContain("pubmed");
    expect(result[0].sources).toContain("openalex");
  });

  it("deduplicates by title similarity (>90%)", () => {
    const a = makePaper({
      doi: null,
      pmid: null,
      title: "Laparoscopic Appendectomy Outcomes in Children: A Meta-Analysis",
    });
    const b = makePaper({
      externalId: "s2:xyz",
      source: "semantic_scholar",
      sources: ["semantic_scholar"],
      doi: null,
      pmid: null,
      title: "Laparoscopic Appendectomy Outcomes in Children: A Meta-Analysis.",
    });

    const result = deduplicateResults([a, b]);
    expect(result).toHaveLength(1);
  });

  it("keeps distinct papers with different DOIs/PMIDs/titles", () => {
    const a = makePaper({ externalId: "pmid:111", doi: "10.1234/aaa", pmid: "111", title: "A Completely Different Study on Topic Alpha in Surgery" });
    const b = makePaper({
      externalId: "s2:bbb",
      doi: "10.1234/bbb",
      pmid: "222",
      title: "Another Distinct Study on Topic Beta in Medicine",
      source: "semantic_scholar",
      sources: ["semantic_scholar"],
    });

    const result = deduplicateResults([a, b]);
    expect(result).toHaveLength(2);
  });

  it("prefers PubMed metadata in merged result", () => {
    const pubmed = makePaper({
      source: "pubmed",
      sources: ["pubmed"],
      title: "Complete PubMed Title for Surgery Paper",
      journal: "PubMed Journal Name",
      citationCount: 5,
    });
    const s2 = makePaper({
      externalId: "s2:abc",
      source: "semantic_scholar",
      sources: ["semantic_scholar"],
      doi: pubmed.doi,
      title: "Complete PubMed Title for Surgery Paper",
      journal: "S2 Journal Name",
      citationCount: 50,
    });

    const result = deduplicateResults([pubmed, s2]);
    expect(result).toHaveLength(1);
    // Prefer Semantic Scholar citation count
    expect(result[0].citationCount).toBe(50);
  });

  it("handles papers with no DOI and no PMID", () => {
    const a = makePaper({ doi: null, pmid: null, title: "Unique Title Alpha" });
    const b = makePaper({
      externalId: "oa:xyz",
      source: "openalex",
      sources: ["openalex"],
      doi: null,
      pmid: null,
      title: "Unique Title Beta",
    });

    const result = deduplicateResults([a, b]);
    expect(result).toHaveLength(2);
  });

  it("handles three sources matching on same DOI", () => {
    const doi = "10.5555/multi";
    const pubmed = makePaper({ source: "pubmed", sources: ["pubmed"], doi });
    const s2 = makePaper({
      externalId: "s2:m1",
      source: "semantic_scholar",
      sources: ["semantic_scholar"],
      doi,
    });
    const oa = makePaper({
      externalId: "oa:m1",
      source: "openalex",
      sources: ["openalex"],
      doi,
    });

    const result = deduplicateResults([pubmed, s2, oa]);
    expect(result).toHaveLength(1);
    expect(result[0].sources).toContain("pubmed");
    expect(result[0].sources).toContain("semantic_scholar");
    expect(result[0].sources).toContain("openalex");
  });
});
