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
  const questionCount = (response.match(/\?/g) || []).length;
  const wordCount = response.split(/\s+/).length;

  // Rule 1: Many declarative sentences with no questions = drafted text
  const looksLikeDraftedText =
    sentences.length > 5 && questionCount === 0;

  if (looksLikeDraftedText) {
    return {
      text: "Let me rephrase — I'm here to guide you, not write for you. What specific part are you working on? I can help you think through it.",
      wasViolation: true,
    };
  }

  // Rule 2: Very long response (>150 words) with no questions = likely violation
  if (wordCount > 150 && questionCount === 0) {
    return {
      text: "I notice I was about to give too much away! Let me ask you a question instead — what are the key points you want to make in this section?",
      wasViolation: true,
    };
  }

  // Rule 3: Long response (>200 words) even with questions — ratio check
  // Must have at least 1 question per 80 words to be coaching, not lecturing
  if (wordCount > 200 && questionCount < Math.floor(wordCount / 80)) {
    return {
      text: "I was getting a bit lecture-y there! Let me focus on guiding you with questions. What aspect of this section do you want to work on first?",
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
