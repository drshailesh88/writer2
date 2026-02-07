// Learn Mode enforcement guard
// Validates and sanitizes coach responses to ensure Socratic rules are followed

/**
 * Validates a coach response to ensure it doesn't write complete text for the student.
 * Returns the sanitized response, or a fallback if the response violates rules.
 */
export function validateCoachResponse(response: string): {
  text: string;
  wasViolation: boolean;
} {
  // Check for paragraph-length responses (>5 sentences that look like drafted text)
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const looksLikeDraftedText =
    sentences.length > 5 &&
    !response.includes("?") &&
    !response.includes("...");

  if (looksLikeDraftedText) {
    return {
      text: "Let me rephrase — I'm here to guide you, not write for you. What specific part are you working on? I can help you think through it.",
      wasViolation: true,
    };
  }

  // Check if response appears to be completing student's sentence
  // (long text with no questions, no sentence starters pattern)
  const hasQuestions = (response.match(/\?/g) || []).length > 0;
  const hasSentenceStarters = response.includes("...");
  const wordCount = response.split(/\s+/).length;

  // If response is very long (>150 words) with no questions, likely a violation
  if (wordCount > 150 && !hasQuestions && !hasSentenceStarters) {
    return {
      text: "I notice I was about to give too much away! Let me ask you a question instead — what are the key points you want to make in this section?",
      wasViolation: true,
    };
  }

  return { text: response, wasViolation: false };
}

/**
 * Validates feedback response to ensure it returns exactly one suggestion.
 */
export function validateFeedbackResponse(feedback: {
  category: string;
  suggestion: string;
  example?: string | null;
}): {
  category: string;
  suggestion: string;
  example?: string | null;
} {
  // Truncate suggestion if it contains multiple numbered items
  const suggestion = feedback.suggestion;
  const numberedItems = suggestion.match(/^\d+\./gm);

  if (numberedItems && numberedItems.length > 1) {
    // Keep only the first suggestion
    const firstItem = suggestion.split(/\n\d+\./)[0];
    return {
      ...feedback,
      suggestion: firstItem.trim(),
    };
  }

  return feedback;
}
