import { describe, it, expect } from "vitest";
import {
  validateCoachResponse,
  validateFeedbackResponse,
} from "@/lib/mastra/learn-mode-guard";

// Helper: generate a response with N sentences (declarative, no questions)
function declarativeSentences(n: number): string {
  return Array.from(
    { length: n },
    (_, i) => `This is declarative sentence number ${i + 1} about the topic.`
  ).join(" ");
}

// Helper: generate words
function wordsOf(count: number): string {
  return Array.from({ length: count }, (_, i) => `word${i}`).join(" ");
}

describe("validateCoachResponse", () => {
  // ─── Rule 1: >5 declarative sentences, 0 questions ───

  it("flags >5 declarative sentences with no questions (Rule 1)", () => {
    const response = declarativeSentences(6);
    const result = validateCoachResponse(response);
    expect(result.wasViolation).toBe(true);
    expect(result.text).toContain("guide you");
  });

  it("allows 5 declarative sentences (boundary, not >5)", () => {
    const response = declarativeSentences(5);
    const result = validateCoachResponse(response);
    // 5 sentences should NOT trigger Rule 1 (needs >5)
    // But may trigger Rule 2 if word count >150
    // Each sentence is ~9 words, so 5 * 9 = 45 words — under 150
    expect(result.wasViolation).toBe(false);
  });

  it("allows many sentences if they contain questions", () => {
    const response =
      "This is sentence one. This is sentence two. This is sentence three. " +
      "This is sentence four. This is sentence five. This is sentence six. " +
      "What do you think about that?";
    const result = validateCoachResponse(response);
    expect(result.wasViolation).toBe(false);
  });

  // ─── Rule 2: >150 words, 0 questions ───

  it("flags >150 words with no questions (Rule 2)", () => {
    const response = wordsOf(160);
    const result = validateCoachResponse(response);
    expect(result.wasViolation).toBe(true);
    expect(result.text).toContain("ask you a question");
  });

  it("allows 150 words with no questions (boundary)", () => {
    const response = wordsOf(150);
    const result = validateCoachResponse(response);
    // Exactly 150 should NOT trigger (needs >150)
    expect(result.wasViolation).toBe(false);
  });

  it("allows >150 words if at least 1 question is present", () => {
    const response = wordsOf(160) + " What do you think?";
    const result = validateCoachResponse(response);
    // 162 words with 1 question — under 200 or passes ratio check
    expect(result.wasViolation).toBe(false);
  });

  // ─── Rule 3: >200 words, insufficient question ratio ───

  it("flags >200 words with insufficient questions (Rule 3)", () => {
    // 210 words → needs at least floor(210/80) = 2 questions
    const response = wordsOf(208) + " Really? Sure.";
    // 210 words, 1 question
    const result = validateCoachResponse(response);
    expect(result.wasViolation).toBe(true);
    expect(result.text).toContain("lecture-y");
  });

  it("allows >200 words with sufficient questions", () => {
    // 210 words → needs floor(210/80) = 2 questions
    const response = wordsOf(205) + " What do you think? How about this approach? Does that make sense?";
    const result = validateCoachResponse(response);
    expect(result.wasViolation).toBe(false);
  });

  // ─── Acceptable responses ───

  it("passes through short responses", () => {
    const response = "What specific aspect of the introduction are you struggling with?";
    const result = validateCoachResponse(response);
    expect(result.wasViolation).toBe(false);
    expect(result.text).toBe(response);
  });

  it("passes through question-only responses", () => {
    const response = "What is your hypothesis? Why did you choose this method? What results do you expect?";
    const result = validateCoachResponse(response);
    expect(result.wasViolation).toBe(false);
    expect(result.text).toBe(response);
  });

  it("passes through coaching-style short response with sentence starter", () => {
    const response = 'Try starting with: "The purpose of this study was to..." What comes next?';
    const result = validateCoachResponse(response);
    expect(result.wasViolation).toBe(false);
    expect(result.text).toBe(response);
  });

  it("passes through empty string", () => {
    const result = validateCoachResponse("");
    expect(result.wasViolation).toBe(false);
    expect(result.text).toBe("");
  });

  it("passes through single sentence", () => {
    const result = validateCoachResponse("Great start!");
    expect(result.wasViolation).toBe(false);
    expect(result.text).toBe("Great start!");
  });
});

describe("validateFeedbackResponse", () => {
  it("passes through single suggestion unchanged", () => {
    const feedback = {
      category: "clarity",
      suggestion: "Consider adding more context to this sentence.",
      example: "For example: The results indicate...",
    };
    const result = validateFeedbackResponse(feedback);
    expect(result).toEqual(feedback);
  });

  it("truncates multiple numbered items to first only", () => {
    const feedback = {
      category: "structure",
      suggestion:
        "1. Move the hypothesis to the introduction.\n2. Add a transition sentence.\n3. Remove redundant text.",
      example: null,
    };
    const result = validateFeedbackResponse(feedback);
    expect(result.suggestion).toBe(
      "1. Move the hypothesis to the introduction."
    );
    expect(result.category).toBe("structure");
  });

  it("keeps suggestion without numbered items", () => {
    const feedback = {
      category: "grammar",
      suggestion: "The verb tense should be consistent throughout.",
    };
    const result = validateFeedbackResponse(feedback);
    expect(result.suggestion).toBe(
      "The verb tense should be consistent throughout."
    );
  });

  it("handles empty suggestion", () => {
    const feedback = {
      category: "style",
      suggestion: "",
    };
    const result = validateFeedbackResponse(feedback);
    expect(result.suggestion).toBe("");
  });

  it("preserves example field", () => {
    const feedback = {
      category: "citation",
      suggestion: "Add a citation after this claim.",
      example: "Smith et al. (2020) demonstrated...",
    };
    const result = validateFeedbackResponse(feedback);
    expect(result.example).toBe("Smith et al. (2020) demonstrated...");
  });
});
