import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// ─── Step 1: Generate Outline (no suspend) ───
const generateOutlineStep = createStep({
  id: "generate-outline",
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    outline: z.any(),
  }),
  execute: async ({ inputData }) => {
    const { topic } = inputData;
    const { mastra } = await import("../index");
    const agent = mastra.getAgent("outlineAgent");

    const result = await agent.generate(
      `Generate a detailed IMRAD outline for the following medical research topic: "${topic}". Return ONLY valid JSON.`
    );

    let outline;
    try {
      const text = result.text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      outline = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      outline = {
        sections: [
          { title: "Introduction", subsections: ["Background", "Research gap", "Objective"] },
          { title: "Methods", subsections: ["Study design", "Data collection", "Analysis"] },
          { title: "Results", subsections: ["Primary findings", "Secondary findings"] },
          { title: "Discussion", subsections: ["Interpretation", "Limitations", "Future directions"] },
          { title: "Conclusion", subsections: ["Summary of findings"] },
        ],
      };
    }

    return { outline };
  },
});

// ─── Step 2: Find Papers (no suspend) ───
const findPapersStep = createStep({
  id: "find-papers",
  inputSchema: z.object({
    outline: z.any(),
  }),
  outputSchema: z.object({
    papersBySection: z.any(),
  }),
  execute: async ({ inputData }) => {
    const { outline } = inputData;
    const { mastra } = await import("../index");
    const agent = mastra.getAgent("paperFinderAgent");

    const papersBySection: Record<string, unknown[]> = {};

    for (const section of outline.sections) {
      const result = await agent.generate(
        `Generate search queries for the "${section.title}" section of a medical research paper. Subsections: ${section.subsections.join(", ")}. Return ONLY a JSON array of 3-5 search query strings.`
      );

      let queries: string[];
      try {
        const text = result.text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        queries = JSON.parse(jsonMatch[1]!.trim());
      } catch {
        queries = [section.title];
      }

      const papers: unknown[] = [];
      for (const query of queries.slice(0, 3)) {
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
            papers.push(...(data.results || []).slice(0, 5));
          }
        } catch {
          // Continue if individual query fails
        }
      }

      papersBySection[section.title] = papers;
    }

    return { papersBySection };
  },
});

// ─── Step 3: Write all sections (no suspend) ───
const writeSectionsStep = createStep({
  id: "write-sections",
  inputSchema: z.object({
    outline: z.any(),
    papersBySection: z.any(),
  }),
  outputSchema: z.object({
    sectionDrafts: z.any(),
  }),
  execute: async ({ inputData }) => {
    const { outline, papersBySection } = inputData;
    const { mastra } = await import("../index");
    const agent = mastra.getAgent("writerAgent");

    const sectionDrafts: Array<{ sectionTitle: string; content: string }> = [];

    for (const section of outline.sections) {
      const papers = papersBySection[section.title] || [];

      const papersContext = papers
        .map((p: { title: string; authors: string[]; year: number | null }, i: number) =>
          `[${i + 1}] ${p.title} by ${(p.authors || []).join(", ")} (${p.year ?? "n.d."})`
        )
        .join("\n");

      const subsectionsContext = section.subsections?.join(", ") || "";

      const result = await agent.generate(
        `Write the "${section.title}" section of the paper.\n\nSubsections to cover: ${subsectionsContext}\n\nAvailable source papers:\n${papersContext || "No papers available — write based on general knowledge and mark with [citation needed]."}\n\nWrite in formal academic medical English. Use numbered citations [1], [2], etc.`
      );

      sectionDrafts.push({
        sectionTitle: section.title,
        content: result.text,
      });
    }

    return { sectionDrafts };
  },
});

// ─── Step 4: Combine into final draft ───
const combineDraftStep = createStep({
  id: "combine-draft",
  inputSchema: z.object({
    sectionDrafts: z.any(),
  }),
  outputSchema: z.object({
    completeDraft: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { sectionDrafts } = inputData;

    const completeDraft = sectionDrafts
      .map((s: { sectionTitle: string; content: string }) =>
        `## ${s.sectionTitle}\n\n${s.content}`
      )
      .join("\n\n---\n\n");

    return { completeDraft };
  },
});

// ─── Hands-Off Workflow (no suspend points) ───
export const draftHandsOffWorkflow = createWorkflow({
  id: "draft-handsoff-workflow",
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    completeDraft: z.string(),
  }),
})
  .then(generateOutlineStep)
  .then(findPapersStep)
  .then(writeSectionsStep)
  .then(combineDraftStep)
  .commit();
