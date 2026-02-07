import { Agent } from "@mastra/core/agent";
import { LLM_MODEL, SYSTEM_PROMPTS } from "./config";

// OutlineAgent: Takes research topic, generates IMRAD outline
export const outlineAgent = new Agent({
  id: "outline-agent",
  name: "Outline Agent",
  instructions: SYSTEM_PROMPTS.outline,
  model: LLM_MODEL,
});

// PaperFinderAgent: Generates search queries for finding relevant papers
export const paperFinderAgent = new Agent({
  id: "paper-finder-agent",
  name: "Paper Finder Agent",
  instructions: SYSTEM_PROMPTS.paperFinder,
  model: LLM_MODEL,
});

// WriterAgent: Writes paper sections with citations from approved papers
export const writerAgent = new Agent({
  id: "writer-agent",
  name: "Writer Agent",
  instructions: SYSTEM_PROMPTS.writer,
  model: LLM_MODEL,
});

// ─── Learn Mode Agents ───

// SocraticCoachAgent: Guides students through writing using Socratic questioning
// NEVER writes complete sentences or paragraphs for the student
export const socraticCoachAgent = new Agent({
  id: "socratic-coach-agent",
  name: "Socratic Coach Agent",
  instructions: SYSTEM_PROMPTS.socraticCoach,
  model: LLM_MODEL,
});

// FeedbackAgent: Provides structured feedback one category at a time
// Returns JSON with category, suggestion, and optional example
export const feedbackAgent = new Agent({
  id: "feedback-agent",
  name: "Feedback Agent",
  instructions: SYSTEM_PROMPTS.feedbackCoach,
  model: LLM_MODEL,
});
