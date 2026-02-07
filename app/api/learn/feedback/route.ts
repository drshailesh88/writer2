import { NextRequest, NextResponse } from "next/server";
import { feedbackAgent } from "@/lib/mastra/agents";
import { validateFeedbackResponse } from "@/lib/mastra/learn-mode-guard";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/mastra/types";

export async function POST(req: NextRequest) {
  try {
    const { category, draftText, topic } = await req.json();

    if (!category || !draftText) {
      return NextResponse.json(
        { error: "Missing required fields: category, draftText" },
        { status: 400 }
      );
    }

    const categoryInfo = FEEDBACK_CATEGORIES.find(
      (c) => c.id === category
    );
    if (!categoryInfo) {
      return NextResponse.json(
        { error: `Invalid feedback category: ${category}` },
        { status: 400 }
      );
    }

    const agent = feedbackAgent;

    const prompt = `Analyze the following student draft in the category: ${categoryInfo.label} (${categoryInfo.description}).

Topic: "${topic || "research paper"}"

Student's draft text:
"""
${draftText}
"""

Provide exactly ONE specific, actionable suggestion for improvement in the "${categoryInfo.label}" category. If helpful, include a brief example from published medical literature.

Return ONLY valid JSON in this format:
{
  "category": "${category}",
  "suggestion": "your specific suggestion here",
  "example": "optional example from published literature or null"
}`;

    const result = await agent.generate(prompt);

    let feedback: {
      category: FeedbackCategory;
      suggestion: string;
      example?: string;
    };
    try {
      const text = result.text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [
        null,
        text,
      ];
      feedback = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      // Fallback if JSON parsing fails
      feedback = {
        category: category as FeedbackCategory,
        suggestion: result.text,
      };
    }

    // Enforce single-suggestion constraint
    const validated = validateFeedbackResponse(feedback);

    return NextResponse.json({
      feedback: {
        category: validated.category || category,
        suggestion: validated.suggestion,
        example: validated.example || null,
        addressed: false,
      },
    });
  } catch (error) {
    console.error("Learn mode feedback error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate feedback",
      },
      { status: 500 }
    );
  }
}
