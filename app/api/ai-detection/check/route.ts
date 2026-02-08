import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { submitAiDetection } from "@/lib/copyleaks";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { captureApiError } from "@/lib/sentry-helpers";
import { TOKEN_COSTS } from "@/convex/usageTokens";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { text, documentId } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // AI detection requires authentication
    const { getToken, userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Authentication required for AI detection" },
        { status: 401 }
      );
    }

    // Rate limit: 5/min per user
    const rateLimitResponse = enforceRateLimit(req, "aiDetection", clerkUserId);
    if (rateLimitResponse) return rateLimitResponse;

    const token = await getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
    }

    const wordCount = text.trim().split(/\s+/).length;

    // Deduct tokens before processing
    try {
      await convex.mutation(api.usageTokens.deductTokens, {
        cost: TOKEN_COSTS.AI_DETECTION,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Insufficient tokens";
      return NextResponse.json(
        { error: message, upgradeRequired: true },
        { status: 402 }
      );
    }

    // Create check record in Convex (handles usage limit enforcement)
    let checkId: string;
    try {
      checkId = await convex.mutation(api.aiDetectionChecks.create, {
        inputText: text,
        wordCount,
        documentId: documentId || undefined,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Usage limit reached";
      if (message.includes("limit") || message.includes("Usage")) {
        return NextResponse.json(
          { error: message, limitExceeded: true },
          { status: 403 }
        );
      }
      throw error;
    }

    // Submit to Copyleaks AI Detection (synchronous — returns results directly)
    const scanId = `ai_${checkId}_${Date.now()}`;

    try {
      const result = await submitAiDetection(text, scanId);

      // Store results in Convex
      await convex.action(api.aiDetectionChecks.updateResult, {
        checkId: checkId as never,
        overallAiScore: result.summary.aiContent,
        sentenceResults: result.sections,
        copyleaksScanId: scanId,
        status: "completed",
      });

      return NextResponse.json({
        checkId,
        status: "completed",
        result: {
          overallAiScore: result.summary.aiContent,
          humanScore: result.summary.humanContent,
          sentences: result.sections,
        },
      });
    } catch (copyleaksError) {
      // Copyleaks submission failed — reverse usage counter
      try {
        await convex.mutation(api.users.decrementAiDetectionUsage, {});
      } catch {
        // Best effort
      }

      // Mark check as failed
      try {
        await convex.action(api.aiDetectionChecks.updateResult, {
          checkId: checkId as never,
          overallAiScore: 0,
          sentenceResults: [],
          copyleaksScanId: scanId,
          status: "failed",
        });
      } catch {
        // Best effort
      }

      console.error("Copyleaks AI detection error:", copyleaksError);
      return NextResponse.json(
        {
          error:
            "Service temporarily unavailable. Please try again in a few minutes.",
          checkId,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    captureApiError(error, "/api/ai-detection/check");
    console.error("AI detection check error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
