import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { submitPlagiarismScan } from "@/lib/copyleaks";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { captureApiError } from "@/lib/sentry-helpers";
import { trackServerEvent } from "@/lib/analytics";
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

    const wordCount = text.trim().split(/\s+/).length;

    // Check authentication
    const { getToken, userId: clerkUserId } = await auth();

    // Rate limit: 5/min, keyed by userId or IP for anonymous
    const rateLimitResponse = enforceRateLimit(req, "plagiarism", clerkUserId);
    if (rateLimitResponse) return rateLimitResponse;

    if (!clerkUserId) {
      // Anonymous flow — enforce 1000 word limit
      if (wordCount > 1000) {
        return NextResponse.json(
          {
            error:
              "Free plagiarism checks are limited to 1,000 words. Sign up for more.",
            wordCount,
            limit: 1000,
          },
          { status: 400 }
        );
      }
    }

    // Set Convex auth token if authenticated
    if (clerkUserId) {
      const token = await getToken({ template: "convex" });
      if (token) {
        convex.setAuth(token);
      }
    } else {
      convex.clearAuth();
    }

    // Deduct tokens for authenticated users (anonymous free funnel is exempt)
    if (clerkUserId) {
      try {
        await convex.mutation(api.usageTokens.deductTokens, {
          cost: TOKEN_COSTS.PLAGIARISM,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Insufficient tokens";
        return NextResponse.json(
          { error: message, upgradeRequired: true },
          { status: 402 }
        );
      }
    }

    // Create check record in Convex (handles usage limit enforcement)
    let checkId: string;
    try {
      checkId = await convex.mutation(api.plagiarismChecks.create, {
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

    // Submit to Copyleaks
    const scanId = `plag_${checkId}_${Date.now()}`;
    const webhookBaseUrl =
      process.env.COPYLEAKS_WEBHOOK_BASE_URL || "http://localhost:3000";
    const webhookUrl = `${webhookBaseUrl}/api/copyleaks/webhook`;

    try {
      await submitPlagiarismScan(text, scanId, webhookUrl);

      // Store scanId mapping for webhook processing
      await convex.action(api.plagiarismChecks.setScanId, {
        checkId: checkId as never,
        copyleaksScanId: scanId,
      });
    } catch (copyleaksError) {
      // Copyleaks submission failed — reverse usage counter
      if (clerkUserId) {
        try {
          await convex.mutation(api.users.decrementPlagiarismUsage, {});
        } catch {
          // Best effort — don't fail the whole request
        }
      }

      console.error("Copyleaks submission error:", copyleaksError);
      return NextResponse.json(
        {
          error:
            "Service temporarily unavailable. Please try again in a few minutes.",
          checkId,
        },
        { status: 503 }
      );
    }

    // Track plagiarism check
    trackServerEvent(clerkUserId ?? "anonymous", "plagiarism_check_started", {
      wordCount,
      authenticated: !!clerkUserId,
    });

    return NextResponse.json(
      { checkId, status: "pending", estimatedSeconds: 30 },
      { status: 202 }
    );
  } catch (error) {
    captureApiError(error, "/api/plagiarism/check");
    console.error("Plagiarism check error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
