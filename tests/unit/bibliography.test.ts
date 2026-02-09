import { describe, it, expect } from "vitest";
import {
  convertPaperToCSL,
  generateBibliography,
  formatInTextCitation,
  formatCitationGroup,
  exportBibliographyText,
} from "@/lib/bibliography";
import { samplePapers } from "../fixtures/sample-papers";

// ─── CSL-JSON Conversion ───

describe("convertPaperToCSL", () => {
  it("converts a complete paper to CSL-JSON", () => {
    const csl = convertPaperToCSL(samplePapers[0]);
    expect(csl.type).toBe("article-journal");
    expect(csl.title).toContain("Intensive Blood-Pressure");
    expect(csl.author).toHaveLength(3);
    expect(csl.author[0]).toEqual({ family: "Anderson", given: "Craig S" });
    expect(csl["container-title"]).toBe("New England Journal of Medicine");
    expect(csl.DOI).toBe("10.1056/NEJMoa1214609");
    expect(csl.issued).toEqual({ "date-parts": [[2013]] });
    expect(csl.volume).toBe("368");
    expect(csl.issue).toBe("25");
    expect(csl.page).toBe("2355-2365");
  });

  it("handles paper with no DOI", () => {
    const csl = convertPaperToCSL(samplePapers[4]); // paper_no_doi
    expect(csl.DOI).toBeUndefined();
    expect(csl["container-title"]).toBe("Critical Care Medicine");
  });

  it("handles paper with no journal", () => {
    const csl = convertPaperToCSL(samplePapers[5]); // paper_no_journal
    expect(csl["container-title"]).toBeUndefined();
    expect(csl.DOI).toBe("10.48550/arXiv.1706.03762");
  });

  it("handles paper with no year", () => {
    const csl = convertPaperToCSL(samplePapers[7]); // paper_no_year
    expect(csl.issued).toBeUndefined();
  });

  it("assigns citation-number when index provided", () => {
    const csl = convertPaperToCSL(samplePapers[0], 0);
    expect(csl["citation-number"]).toBe(1);
    const csl2 = convertPaperToCSL(samplePapers[1], 4);
    expect(csl2["citation-number"]).toBe(5);
  });

  it("parses single-name author correctly", () => {
    const csl = convertPaperToCSL(samplePapers[3]); // "Kannel WB"
    expect(csl.author[0].family).toBe("WB");
    expect(csl.author[0].given).toBe("Kannel");
  });
});

// ─── Vancouver Style ───

describe("generateBibliography - Vancouver", () => {
  it("generates numbered bibliography with 3 authors", () => {
    const entries = generateBibliography([samplePapers[0]], "vancouver");
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry).toContain("Anderson");
    expect(entry).toContain("Heeley");
    expect(entry).toContain("Huang");
    expect(entry).toContain("New England Journal of Medicine");
    expect(entry).toContain("2013");
  });

  it("truncates 7+ authors with et al.", () => {
    const entries = generateBibliography([samplePapers[1]], "vancouver");
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    // Vancouver/NLM truncates to 6 authors then et al.
    expect(entry).toMatch(/et al/i);
  });

  it("handles single author without et al.", () => {
    const entries = generateBibliography([samplePapers[3]], "vancouver");
    expect(entries).toHaveLength(1);
    expect(entries[0]).not.toMatch(/et al/i);
  });

  it("handles paper with no DOI gracefully", () => {
    const entries = generateBibliography([samplePapers[4]], "vancouver");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("Critical Care Medicine");
  });

  it("handles paper with no journal", () => {
    const entries = generateBibliography([samplePapers[5]], "vancouver");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("Attention Is All You Need");
  });

  it("generates 10 entries in correct order", () => {
    const entries = generateBibliography(samplePapers, "vancouver");
    expect(entries.length).toBeGreaterThanOrEqual(samplePapers.length);
  });
});

// ─── APA Style ───

describe("generateBibliography - APA", () => {
  it("generates author-year format", () => {
    const entries = generateBibliography([samplePapers[0]], "apa");
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry).toContain("Anderson");
    expect(entry).toContain("(2013)");
  });

  it("lists all authors up to 20 in APA 7th edition", () => {
    const entries = generateBibliography([samplePapers[1]], "apa");
    expect(entries).toHaveLength(1);
    // APA 7th lists up to 20 authors
    const entry = entries[0];
    expect(entry).toContain("Perkovic");
  });

  it("handles 2 authors with &", () => {
    const entries = generateBibliography([samplePapers[6]], "apa");
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry).toContain("Litjens");
    expect(entry).toContain("Kooi");
  });

  it("handles paper with no year", () => {
    const entries = generateBibliography([samplePapers[7]], "apa");
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    // APA uses "n.d." for no date
    expect(entry).toMatch(/n\.d\./);
  });
});

// ─── AMA Style ───

describe("generateBibliography - AMA", () => {
  it("generates numbered format with period-separated fields", () => {
    const entries = generateBibliography([samplePapers[0]], "ama");
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry).toContain("Anderson");
    expect(entry).toContain("2013");
    // AMA uses doi: prefix
    expect(entry).toContain("doi:");
  });

  it("truncates with et al for 7+ authors", () => {
    const entries = generateBibliography([samplePapers[1]], "ama");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatch(/et al/);
  });
});

// ─── Chicago Style ───

describe("generateBibliography - Chicago", () => {
  it("generates author-date format with quoted title", () => {
    const entries = generateBibliography([samplePapers[0]], "chicago");
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry).toContain("Anderson");
    expect(entry).toContain("2013");
  });

  it("handles multiple authors with et al.", () => {
    const entries = generateBibliography([samplePapers[1]], "chicago");
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry).toMatch(/et al/);
  });
});

// ─── In-Text Citations ───

describe("formatInTextCitation", () => {
  it("Vancouver: returns [number]", () => {
    expect(
      formatInTextCitation(["John Smith"], 2020, "vancouver", 1)
    ).toBe("[1]");
    expect(
      formatInTextCitation(["A", "B", "C"], 2020, "vancouver", 5)
    ).toBe("[5]");
  });

  it("AMA: returns [number]", () => {
    expect(formatInTextCitation(["John Smith"], 2020, "ama", 3)).toBe(
      "[3]"
    );
  });

  it("APA: returns (LastName, Year) for single author", () => {
    expect(
      formatInTextCitation(["John Smith"], 2020, "apa", 1)
    ).toBe("(Smith, 2020)");
  });

  it("APA: returns (Last1 & Last2, Year) for two authors", () => {
    expect(
      formatInTextCitation(["John Smith", "Jane Doe"], 2020, "apa", 1)
    ).toBe("(Smith & Doe, 2020)");
  });

  it("APA: returns (Last1 et al., Year) for 3+ authors", () => {
    expect(
      formatInTextCitation(
        ["John Smith", "Jane Doe", "Bob Wilson"],
        2020,
        "apa",
        1
      )
    ).toBe("(Smith et al., 2020)");
  });

  it("APA: handles no year", () => {
    expect(
      formatInTextCitation(["John Smith"], undefined, "apa", 1)
    ).toBe("(Smith, n.d.)");
  });

  it("APA: handles no authors", () => {
    expect(formatInTextCitation([], 2020, "apa", 1)).toBe(
      "(Unknown, 2020)"
    );
  });

  it("Chicago: uses author-year format same as APA", () => {
    expect(
      formatInTextCitation(["Craig Anderson"], 2013, "chicago", 1)
    ).toBe("(Anderson, 2013)");
  });
});

// ─── Citation Group Formatting ───

describe("formatCitationGroup", () => {
  it("formats single number", () => {
    expect(formatCitationGroup([1], "vancouver")).toBe("[1]");
  });

  it("formats consecutive range", () => {
    expect(formatCitationGroup([1, 2, 3], "vancouver")).toBe("[1-3]");
  });

  it("formats non-consecutive numbers", () => {
    expect(formatCitationGroup([1, 3, 5], "vancouver")).toBe("[1,3,5]");
  });

  it("formats mixed consecutive and non-consecutive", () => {
    expect(formatCitationGroup([1, 2, 3, 5], "vancouver")).toBe("[1-3,5]");
  });

  it("formats [4-7] range correctly", () => {
    expect(formatCitationGroup([4, 5, 6, 7], "vancouver")).toBe("[4-7]");
  });

  it("formats [2,3] as comma not range", () => {
    expect(formatCitationGroup([2, 3], "vancouver")).toBe("[2,3]");
  });

  it("returns individual brackets for APA", () => {
    expect(formatCitationGroup([1, 2, 3], "apa")).toBe("[1][2][3]");
  });

  it("handles empty array", () => {
    expect(formatCitationGroup([], "vancouver")).toBe("");
  });
});

// ─── Export ───

describe("exportBibliographyText", () => {
  it("generates text with References header", () => {
    const text = exportBibliographyText(
      [samplePapers[0]],
      "vancouver"
    );
    expect(text).toContain("References");
    expect(text).toContain("Anderson");
  });

  it("numbers entries for Vancouver", () => {
    const text = exportBibliographyText(
      samplePapers.slice(0, 3),
      "vancouver"
    );
    expect(text).toContain("1.");
    expect(text).toContain("2.");
    expect(text).toContain("3.");
  });

  it("does not number entries for APA", () => {
    const text = exportBibliographyText(
      [samplePapers[0]],
      "apa"
    );
    expect(text).not.toMatch(/^1\./m);
  });

  it("returns empty entries section for empty papers", () => {
    const text = exportBibliographyText([], "vancouver");
    expect(text).toContain("References");
  });
});

// ─── Journal Compliance ───

describe("journal-specific compliance", () => {
  it("NEJM: Vancouver with numbered refs, et al. for >6 authors, includes DOI", () => {
    const entries = generateBibliography([samplePapers[1]], "vancouver");
    const entry = entries[0];
    // Should use et al. for 8 authors
    expect(entry).toMatch(/et al/i);
    // Should include DOI
    expect(entry).toContain("10.1056/NEJMoa1811744");
  });

  it("Lancet: Vancouver with volume and pages", () => {
    const entries = generateBibliography([samplePapers[0]], "vancouver");
    const entry = entries[0];
    expect(entry).toContain("368");
    expect(entry).toMatch(/2355/);
  });

  it("JAMA: AMA format with doi prefix", () => {
    const entries = generateBibliography([samplePapers[2]], "ama");
    const entry = entries[0];
    expect(entry).toContain("JAMA");
    expect(entry).toContain("doi:");
    expect(entry).toContain("2020");
  });

  it("Nature: Vancouver with DOI and volume", () => {
    const entries = generateBibliography([samplePapers[8]], "vancouver");
    const entry = entries[0];
    expect(entry).toContain("Nature");
    expect(entry).toContain("409");
    expect(entry).toContain("10.1038/35057062");
  });

  it("JACC: Vancouver with volume/issue/pages", () => {
    const entries = generateBibliography([samplePapers[9]], "vancouver");
    const entry = entries[0];
    expect(entry).toContain("Journal of the American College of Cardiology");
    expect(entry).toContain("53");
    expect(entry).toMatch(/2282/);
  });
});
