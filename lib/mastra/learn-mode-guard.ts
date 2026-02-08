// Learn Mode enforcement guard
// Validates and sanitizes coach responses to ensure Socratic rules are followed
// while still allowing helpful short writing assistance (examples, templates, tips)

/**
 * Checks whether the response contains markers that indicate helpful
 * teaching content (examples, templates, tips) rather than drafted text.
 * These patterns are explicitly allowed even in longer responses.
 */
function containsTeachingPatterns(response: string): boolean {
  const patterns = [
    /\bfor example\b/i,
    /\bexample\b.*:/i,
    /\bsuch as\b/i,
    /\btemplate\b/i,
    /\b___\b/, // fill-in-the-blank template marker
    /\b\[your\b/i, // "[your findings here]"
    /\b\[insert\b/i, // "[insert data here]"
    /\btip:/i,
    /\bwriting tip\b/i,
    /\bhelpful pattern\b/i,
    /\bhere(?:'s| is) (?:a|an|one)\b/i, // "Here's an example..."
    /\bconsider (?:starting|beginning|opening) with\b/i,
  ];
  return patterns.some((p) => p.test(response));
}

/**
 * Validates a coach response to ensure it doesn't write complete text for the student.
 * Returns the sanitized response, or a fallback if the response violates rules.
 *
 * The guard is intentionally "soft" — it allows short helpful outputs (2-3 sentences),
 * example sentences from published papers, template paragraphs with blanks, and
 * section-specific writing tips. It blocks full section generation and long
 * paragraphs of pure drafted text with no coaching or questioning.
 */
export function validateCoachResponse(response: string): {
  text: string;
  wasViolation: boolean;
} {
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const questionCount = (response.match(/\?/g) || []).length;
  const wordCount = response.split(/\s+/).length;
  const hasTeachingPatterns = containsTeachingPatterns(response);

  // Rule 1: Many declarative sentences (>8) with no questions AND no teaching
  // patterns = almost certainly drafted text. Raised from 5→8 to allow
  // short helpful outputs with examples.
  if (sentences.length > 8 && questionCount === 0 && !hasTeachingPatterns) {
    return {
      text: "Let me rephrase — I'm here to guide you, not write for you. What specific part are you working on? I can help you think through it.",
      wasViolation: true,
    };
  }

  // Rule 2: Very long response (>250 words) with no questions AND no teaching
  // patterns = likely violation. Raised from 150→250 to allow detailed tips,
  // structural templates, and brief examples from published papers.
  if (wordCount > 250 && questionCount === 0 && !hasTeachingPatterns) {
    return {
      text: "I notice I was about to give too much away! Let me ask you a question instead — what are the key points you want to make in this section?",
      wasViolation: true,
    };
  }

  // Rule 3: Very long response (>350 words) even with questions — ratio check
  // Must have at least 1 question per 100 words to be coaching, not lecturing.
  // Raised from 200/80 to 350/100 to allow longer responses that mix teaching
  // content with coaching questions.
  if (wordCount > 350 && questionCount < Math.floor(wordCount / 100)) {
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
