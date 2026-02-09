import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { socraticCoachAgent } from "@/lib/mastra/agents";
import { validateCoachResponse } from "@/lib/mastra/learn-mode-guard";
import { formatExamplesForPrompt, getSentenceStarters } from "@/lib/examples/loader";
import type { ConversationMessage, LearnModeStage } from "@/lib/mastra/types";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { trackServerEvent } from "@/lib/analytics";
import { TOKEN_COSTS } from "@/convex/usageTokens";
import { captureApiError } from "@/lib/sentry-helpers";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const { getToken, userId: clerkUserId } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token || !clerkUserId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit: 10/min per user
    const rateLimitResponse = await enforceRateLimit(req, "learnMode", clerkUserId);
    if (rateLimitResponse) return rateLimitResponse;

    const { message, stage, conversationHistory, topic, documentId } = await req.json();

    if (!message || !stage) {
      return NextResponse.json(
        { error: "Missing required fields: message, stage" },
        { status: 400 }
      );
    }

    // Validate active session exists (prevents usage bypass)
    if (documentId) {
      convex.setAuth(token);
      const session = await convex.query(api.learnModeSessions.getByDocument, {
        documentId,
      });
      if (!session) {
        return NextResponse.json(
          { error: "No active Learn Mode session found" },
          { status: 403 }
        );
      }
    }

    // Deduct tokens before processing message
    convex.setAuth(token);
    try {
      await convex.mutation(api.usageTokens.deductTokens, {
        cost: TOKEN_COSTS.LEARN_MESSAGE,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Insufficient tokens";
      return NextResponse.json(
        { error: message, upgradeRequired: true },
        { status: 402 }
      );
    }

    // Track learn mode message
    trackServerEvent(clerkUserId, "learn_message_sent", { stage, topic: topic?.slice(0, 100) });

    const agent = socraticCoachAgent;

    // Build context from conversation history
    const historyContext = (conversationHistory as ConversationMessage[])
      ?.slice(-10) // Last 10 messages for context window
      .map(
        (m) =>
          `${m.role === "coach" ? "Coach" : "Student"}: ${m.content}`
      )
      .join("\n");

    const stageInstruction = getStageInstruction(stage as LearnModeStage);

    // Include relevant examples based on stage
    const examplesContext = getExamplesContext(stage as LearnModeStage);

    const prompt = `${stageInstruction}

Topic: "${topic || "research paper"}"
Current stage: ${stage}

${examplesContext}

Recent conversation:
${historyContext || "(No previous messages)"}

Student's latest message: "${message}"

Respond as the Socratic writing coach. Remember: NEVER write complete sentences for the student. Ask questions, provide sentence starters (3-6 words only), or point to examples from the database above.`;

    const result = await agent.generate(prompt);

    // Enforce Socratic rules — validate response before sending
    const validated = validateCoachResponse(result.text);

    return NextResponse.json({
      coachMessage: validated.text,
      stage,
    });
  } catch (error) {
    captureApiError(error, "/api/learn/message");
    console.error("Learn mode message error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get coach response",
      },
      { status: 500 }
    );
  }
}

function getStageInstruction(stage: LearnModeStage): string {
  switch (stage) {
    case "understand":
      return "You are in stage 1 (Understand Topic). Help the student clarify their research question, hypothesis, and scope. Ask probing questions about what they want to investigate and why.";
    case "literature":
      return "You are in stage 2 (Literature Review). Guide the student on finding relevant papers. Ask about their search strategy, keyword choices, and why specific papers are relevant. Help identify gaps.";
    case "outline":
      return "You are in stage 3 (Create Outline). Help the student structure their paper using IMRAD format. Ask questions about what belongs in each section. Do NOT write the outline for them.";
    case "drafting":
      return "You are in stage 4 (Write Draft). The student is writing their paper. Provide sentence starters (3-6 words only) when asked. Ask guiding questions about content gaps. Point to examples from published papers.";
    case "feedback":
      return "You are in stage 5 (Feedback). The FeedbackAgent handles structured feedback. For general questions, guide the student on revision strategies without rewriting their text.";
  }
}

function getExamplesContext(stage: LearnModeStage): string {
  switch (stage) {
    case "drafting": {
      const starters = getSentenceStarters()
        .map((s) => `- ${s.section}: "${s.text}"`)
        .join("\n");
      const methodExamples = formatExamplesForPrompt("methodology", 2);
      return `Available sentence starters (offer these when student asks for help):\n${starters}\n\nMethodology examples from published papers:\n${methodExamples}`;
    }
    case "outline":
      return `Methodology structure examples from published papers:\n${formatExamplesForPrompt("methodology", 3)}`;
    case "feedback":
      return `Discussion structure examples from published papers:\n${formatExamplesForPrompt("discussion", 3)}`;
    default:
      return "";
  }
}
