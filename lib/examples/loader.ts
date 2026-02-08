// Loader for published paper examples database
// Used by SocraticCoachAgent and FeedbackAgent to reference real examples

import examples from "@/data/examples.json";

export type ExampleCategory = "methodology" | "discussion" | "sentence_starter";

export interface PaperExample {
  id: number;
  category: ExampleCategory;
  section: string;
  text: string;
  source: string;
  paperTitle: string;
}

/**
 * Get all examples filtered by category
 */
export function getExamplesByCategory(
  category: ExampleCategory
): PaperExample[] {
  return (examples as PaperExample[]).filter((e) => e.category === category);
}

/**
 * Get examples filtered by section name
 */
export function getExamplesBySection(section: string): PaperExample[] {
  return (examples as PaperExample[]).filter((e) =>
    e.section.toLowerCase().includes(section.toLowerCase())
  );
}

/**
 * Get a random example for a given category
 */
export function getRandomExample(
  category: ExampleCategory
): PaperExample | null {
  const filtered = getExamplesByCategory(category);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Get sentence starters for a given section type
 */
export function getSentenceStarters(section?: string): PaperExample[] {
  const starters = getExamplesByCategory("sentence_starter");
  if (!section) return starters;
  return starters.filter((s) =>
    s.section.toLowerCase().includes(section.toLowerCase())
  );
}

/**
 * Format examples as context string for agent prompts
 */
export function formatExamplesForPrompt(
  category: ExampleCategory,
  limit = 3
): string {
  const items = getExamplesByCategory(category).slice(0, limit);
  return items
    .map(
      (e) =>
        `[${e.source}] "${e.text}" — from "${e.paperTitle}" (Section: ${e.section})`
    )
    .join("\n\n");
}
