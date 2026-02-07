import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import { vancouverStyle, apaStyle, amaStyle, chicagoStyle } from "./csl-styles";

// ─── Register CSL styles with Citation.js ───
const cslConfig = plugins.config.get("@csl");
cslConfig.templates.add("vancouver", vancouverStyle);
cslConfig.templates.add("apa", apaStyle);
cslConfig.templates.add("ama", amaStyle);
cslConfig.templates.add("chicago", chicagoStyle);

// ─── Types ───
export type CitationStyle = "vancouver" | "apa" | "ama" | "chicago";

export interface PaperData {
  _id: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  doi?: string;
  url?: string;
  metadata?: {
    volume?: string;
    issue?: string;
    pages?: string;
    pmid?: string;
    [key: string]: unknown;
  };
}

interface CSLAuthor {
  family: string;
  given?: string;
}

interface CSLItem {
  id: string;
  type: string;
  title: string;
  author: CSLAuthor[];
  "container-title"?: string;
  DOI?: string;
  URL?: string;
  issued?: { "date-parts": number[][] };
  volume?: string;
  issue?: string;
  page?: string;
  PMID?: string;
  "citation-number"?: number;
}

// ─── Core Functions ───

/**
 * Parse an author name string into CSL-JSON author object.
 * Handles formats like "John Smith", "Smith, John", "J Smith", "Smith J"
 */
function parseAuthorName(name: string): CSLAuthor {
  const trimmed = name.trim();

  // Handle "Last, First" format
  if (trimmed.includes(",")) {
    const [family, given] = trimmed.split(",").map((s) => s.trim());
    return given ? { family, given } : { family };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { family: parts[0] };
  }

  // Assume "Given Family" format (most common in PubMed/S2 data)
  const family = parts[parts.length - 1];
  const given = parts.slice(0, -1).join(" ");
  return { family, given };
}

/**
 * Convert paper metadata from Convex papers table to CSL-JSON format.
 */
export function convertPaperToCSL(paper: PaperData, index?: number): CSLItem {
  const authors = (paper.authors || []).map(parseAuthorName);

  const cslItem: CSLItem = {
    id: paper._id,
    type: "article-journal",
    title: paper.title,
    author: authors,
  };

  if (paper.journal) cslItem["container-title"] = paper.journal;
  if (paper.doi) cslItem.DOI = paper.doi;
  if (paper.url) cslItem.URL = paper.url;
  if (paper.year) cslItem.issued = { "date-parts": [[paper.year]] };

  // Extract additional fields from metadata if available
  const meta = paper.metadata;
  if (meta) {
    if (meta.volume) cslItem.volume = meta.volume;
    if (meta.issue) cslItem.issue = meta.issue;
    if (meta.pages) cslItem.page = meta.pages;
    if (meta.pmid) cslItem.PMID = meta.pmid;
  }

  if (index !== undefined) {
    cslItem["citation-number"] = index + 1;
  }

  return cslItem;
}

/**
 * Generate formatted bibliography entries as plain text.
 * Returns an array of formatted reference strings.
 */
export function generateBibliography(
  papers: PaperData[],
  style: CitationStyle
): string[] {
  if (papers.length === 0) return [];

  const cslData = papers.map((paper, idx) => convertPaperToCSL(paper, idx));
  const cite = new Cite(cslData);

  const output: string = cite.format("bibliography", {
    format: "text",
    template: style,
    lang: "en-US",
  });

  return output
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
}

/**
 * Generate formatted bibliography as HTML string.
 */
export function generateBibliographyHTML(
  papers: PaperData[],
  style: CitationStyle
): string {
  if (papers.length === 0) return "";

  const cslData = papers.map((paper, idx) => convertPaperToCSL(paper, idx));
  const cite = new Cite(cslData);

  return cite.format("bibliography", {
    format: "html",
    template: style,
    lang: "en-US",
  });
}

/**
 * Format an in-text citation display string.
 * Vancouver/AMA: [1], [2,3], [4-7]
 * APA/Chicago: (Author, Year), (Author1 & Author2, Year), (Author1 et al., Year)
 */
export function formatInTextCitation(
  authors: string[],
  year: number | undefined,
  style: CitationStyle,
  citationNumber: number
): string {
  if (style === "vancouver" || style === "ama") {
    return `[${citationNumber}]`;
  }

  // APA and Chicago use author-year
  const yearStr = year?.toString() ?? "n.d.";

  if (authors.length === 0) {
    return `(Unknown, ${yearStr})`;
  }

  const getLastName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.includes(",")) return trimmed.split(",")[0].trim();
    const parts = trimmed.split(/\s+/);
    return parts[parts.length - 1];
  };

  if (authors.length === 1) {
    return `(${getLastName(authors[0])}, ${yearStr})`;
  }

  if (authors.length === 2) {
    return `(${getLastName(authors[0])} & ${getLastName(authors[1])}, ${yearStr})`;
  }

  return `(${getLastName(authors[0])} et al., ${yearStr})`;
}

/**
 * Format a group of consecutive citation numbers for Vancouver/AMA style.
 * e.g., [1,2,3,5] → "[1-3,5]"
 */
export function formatCitationGroup(
  numbers: number[],
  style: CitationStyle
): string {
  if (style !== "vancouver" && style !== "ama") {
    return numbers.map((n) => `[${n}]`).join("");
  }

  if (numbers.length === 0) return "";
  if (numbers.length === 1) return `[${numbers[0]}]`;

  const sorted = [...numbers].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      rangeEnd = sorted[i];
    } else {
      ranges.push(
        rangeStart === rangeEnd
          ? `${rangeStart}`
          : rangeEnd === rangeStart + 1
            ? `${rangeStart},${rangeEnd}`
            : `${rangeStart}-${rangeEnd}`
      );
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }
  ranges.push(
    rangeStart === rangeEnd
      ? `${rangeStart}`
      : rangeEnd === rangeStart + 1
        ? `${rangeStart},${rangeEnd}`
        : `${rangeStart}-${rangeEnd}`
  );

  return `[${ranges.join(",")}]`;
}

/**
 * Export bibliography as a downloadable plain text string.
 */
export function exportBibliographyText(
  papers: PaperData[],
  style: CitationStyle,
  documentTitle?: string
): string {
  const entries = generateBibliography(papers, style);
  const header = documentTitle ? `${documentTitle}\n` : "";
  const divider = "References\n" + "=".repeat(10) + "\n\n";

  const formatted = entries
    .map((entry, i) => {
      if (style === "vancouver" || style === "ama") {
        return `${i + 1}. ${entry}`;
      }
      return entry;
    })
    .join("\n\n");

  return header + divider + formatted + "\n";
}
