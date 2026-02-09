import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// ─── Step 1: Generate search queries from topic ───
const generateQueriesStep = createStep({
  id: "generate-queries",
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    queries: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const { topic } = inputData;
    const { mastra } = await import("../index");
    const agent = mastra.getAgent("paperFinderAgent");

    const result = await agent.generate(
      `Generate 5 targeted search queries to comprehensively research the topic: "${topic}".
Include queries that cover:
1. Overview/review articles
2. Recent developments (last 3 years)
3. Methodology and study designs used
4. Key controversies or debates
5. Related systematic reviews or meta-analyses

Return ONLY a JSON array of 5 search query strings.`
    );

    let queries: string[];
    try {
      const text = result.text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [
        null,
        text,
      ];
      queries = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      queries = [
        topic,
        `${topic} review`,
        `${topic} recent advances`,
        `${topic} systematic review`,
        `${topic} clinical outcomes`,
      ];
    }

    return { topic, queries: queries.slice(0, 5) };
  },
});

// ─── Step 2: Search for papers across databases ───
const searchPapersStep = createStep({
  id: "search-papers",
  inputSchema: z.object({
    topic: z.string(),
    queries: z.array(z.string()),
  }),
  outputSchema: z.object({
    topic: z.string(),
    papers: z.any(),
  }),
  execute: async ({ inputData }) => {
    const { topic, queries } = inputData;
    const allPapers: Array<{
      title: string;
      authors: string[];
      year: number | null;
      journal: string | null;
      abstract: string | null;
      doi: string | null;
      url: string | null;
      source: string;
    }> = [];
    const seenTitles = new Set<string>();

    for (const query of queries) {
      try {
        const searchResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/search`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, page: 1 }),
          }
        );
        if (searchResponse.ok) {
          const data = await searchResponse.json();
          for (const paper of (data.results || []).slice(0, 8)) {
            const normalizedTitle = (paper.title || "").toLowerCase().trim();
            if (!seenTitles.has(normalizedTitle)) {
              seenTitles.add(normalizedTitle);
              allPapers.push({
                title: paper.title,
                authors: paper.authors || [],
                year: paper.year,
                journal: paper.journal || null,
                abstract: paper.abstract || null,
                doi: paper.doi || null,
                url: paper.url || null,
                source: paper.source || "unknown",
              });
            }
          }
        }
      } catch {
        // Continue if individual query fails
      }
    }

    // Sort by relevance: prefer papers with abstracts and recent papers
    const sorted = allPapers.sort((a, b) => {
      const scoreA = (a.abstract ? 2 : 0) + (a.year && a.year > 2020 ? 1 : 0);
      const scoreB = (b.abstract ? 2 : 0) + (b.year && b.year > 2020 ? 1 : 0);
      return scoreB - scoreA;
    });

    return { topic, papers: sorted.slice(0, 15) };
  },
});

// ─── Step 3: Synthesize research report ───
const synthesizeReportStep = createStep({
  id: "synthesize-report",
  inputSchema: z.object({
    topic: z.string(),
    papers: z.any(),
  }),
  outputSchema: z.object({
    report: z.string(),
    citedPapers: z.any(),
  }),
  execute: async ({ inputData }) => {
    const { topic, papers } = inputData;
    const { mastra } = await import("../index");
    const agent = mastra.getAgent("deepResearchAgent");

    // Build papers context for the agent
    const papersContext = papers
      .map(
        (
          p: {
            title: string;
            authors: string[];
            year: number | null;
            journal: string | null;
            abstract: string | null;
          },
          i: number
        ) => {
          const authors = (p.authors || []).slice(0, 3).join(", ");
          const abstract = p.abstract
            ? `\nAbstract: ${p.abstract.substring(0, 300)}...`
            : "";
          return `[${i + 1}] ${p.title}\nAuthors: ${authors || "Unknown"}\nYear: ${p.year ?? "n.d."}\nJournal: ${p.journal || "Unknown"}${abstract}`;
        }
      )
      .join("\n\n");

    const result = await agent.generate(
      `Write a comprehensive research report on the topic: "${topic}"

You have access to the following ${papers.length} academic papers. Use them to create a structured research report.

AVAILABLE PAPERS:
${papersContext}

Write the report following this exact structure:
## Executive Summary
[2-3 paragraphs synthesizing the overall findings]

## Key Findings
### [Theme 1 Title]
[Findings with citations]

### [Theme 2 Title]
[Findings with citations]

### [Theme 3 Title]
[Findings with citations]

## Literature Gaps
[Identified gaps, contradictions, and areas needing more research]

## Cited Sources
[Numbered list matching the citation numbers used above]

Remember: Use [1], [2], etc. for citations. Every claim must reference a provided paper.`
    );

    return {
      report: result.text,
      citedPapers: papers,
    };
  },
});

// ─── Deep Research Workflow ───
export const deepResearchWorkflow = createWorkflow({
  id: "deep-research-workflow",
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    report: z.string(),
    citedPapers: z.any(),
  }),
})
  .then(generateQueriesStep)
  .then(searchPapersStep)
  .then(synthesizeReportStep)
  .commit();
