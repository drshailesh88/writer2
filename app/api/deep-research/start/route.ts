import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { mastra } from "@/lib/mastra";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { trackServerEvent } from "@/lib/analytics";
import { TOKEN_COSTS } from "@/convex/usageTokens";
import { requireConvexActionSecret } from "@/lib/convex-action-secret";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim().length < 5) {
      return NextResponse.json(
        { error: "Topic must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Authenticate
    const { getToken, userId: clerkUserId } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token || !clerkUserId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Rate limit: 3/min per user
    const rateLimitResponse = await enforceRateLimit(req, "deepResearch", clerkUserId);
    if (rateLimitResponse) return rateLimitResponse;

    convex.setAuth(token);
    let actionSecret: string;
    try {
      actionSecret = requireConvexActionSecret();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Deduct tokens before starting research
    try {
      await convex.mutation(api.usageTokens.deductTokens, {
        cost: TOKEN_COSTS.DEEP_RESEARCH,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Insufficient tokens";
      return NextResponse.json(
        { error: message, upgradeRequired: true },
        { status: 402 }
      );
    }

    // Create report in Convex (also checks subscription limits)
    let reportId: string;
    try {
      reportId = await convex.mutation(api.deepResearchReports.create, {
        topic: topic.trim(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create report";
      if (message.includes("limit") || message.includes("not available")) {
        return NextResponse.json(
          { error: message },
          { status: 403 }
        );
      }
      throw error;
    }

    // Track deep research start (no PHI — only metadata, never topic content)
    trackServerEvent(clerkUserId, "deep_research_started", { topicLength: topic.trim().length });

    // Fire workflow asynchronously — don't await
    runWorkflowAsync(reportId, topic.trim(), actionSecret);

    return NextResponse.json({ reportId });
  } catch (error) {
    console.error("Deep research start error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start research",
      },
      { status: 500 }
    );
  }
}

async function runWorkflowAsync(
  reportId: string,
  topic: string,
  actionSecret: string
) {
  // Use a client WITHOUT auth for status updates.
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  try {
    // Mark as in progress
    await client.action(api.deepResearchReports.updateResult, {
      reportId: reportId as never,
      status: "in_progress",
      actionSecret,
    });

    // Run the workflow
    const workflow = mastra.getWorkflow("deepResearchWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({ inputData: { topic } });

    if (result.status === "success") {
      await client.action(api.deepResearchReports.updateResult, {
        reportId: reportId as never,
        report: result.result?.report ?? "Report generation completed but no content was produced.",
        citedPapers: result.result?.citedPapers ?? [],
        status: "completed",
        actionSecret,
      });
    } else {
      await client.action(api.deepResearchReports.updateResult, {
        reportId: reportId as never,
        status: "failed",
        actionSecret,
      });
    }
  } catch (error) {
    console.error("Deep research workflow error:", error);
    try {
      await client.action(api.deepResearchReports.updateResult, {
        reportId: reportId as never,
        status: "failed",
        actionSecret,
      });
    } catch {
      // Best effort — report already exists
    }
  }
}
