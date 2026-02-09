import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { mastra } from "@/lib/mastra";
import { cacheRun, removeCachedRun } from "@/lib/workflow-cache";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";
import { captureApiError } from "@/lib/sentry-helpers";
import { trackServerEvent } from "@/lib/analytics";
import { TOKEN_COSTS } from "@/convex/usageTokens";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const { userId: clerkUserId, getToken } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit: 10/min per user
    const rateLimitResponse = enforceRateLimit(req, "draftMode", clerkUserId);
    if (rateLimitResponse) return rateLimitResponse;

    const { topic, mode, documentId } = await req.json();

    if (!topic || !mode || !documentId) {
      return NextResponse.json(
        { error: "Missing required fields: topic, mode, documentId" },
        { status: 400 }
      );
    }

    if (typeof topic === "string" && topic.length > 500) {
      return NextResponse.json(
        { error: "Topic must be under 500 characters" },
        { status: 400 }
      );
    }

    // Set auth for Convex calls
    const convexToken = await getToken({ template: "convex" });
    if (convexToken) convex.setAuth(convexToken);

    // Check subscription tier — free users cannot use Draft Mode
    const convexUser = await convex.query(api.users.getCurrent, {});
    if (!convexUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (convexUser.subscriptionTier === "free" || convexUser.subscriptionTier === "none") {
      return NextResponse.json(
        { error: "Draft Mode requires a Basic or Pro subscription. Please upgrade.", upgradeRequired: true },
        { status: 403 }
      );
    }

    // Deduct tokens before starting workflow
    try {
      await convex.mutation(api.usageTokens.deductTokens, {
        cost: TOKEN_COSTS.DRAFT_SECTION,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Insufficient tokens";
      return NextResponse.json(
        { error: message, upgradeRequired: true },
        { status: 402 }
      );
    }

    const workflowKey =
      mode === "draft_handsoff"
        ? "draftHandsOffWorkflow"
        : "draftGuidedWorkflow";

    const workflow = mastra.getWorkflow(workflowKey as "draftGuidedWorkflow" | "draftHandsOffWorkflow");
    const run = await workflow.createRun();

    // Cache the run object in memory (needed for Mastra resume)
    cacheRun(documentId, run);

    // Persist workflow run to Convex (auth set — uses identity for ownership)
    const workflowRunId = await convex.mutation(api.workflowRuns.create, {
      documentId: documentId as Id<"documents">,
      workflowType: mode as "draft_guided" | "draft_handsoff",
      currentStep: "start",
    });

    // Track workflow start (no PHI — only metadata, never topic content)
    trackServerEvent(clerkUserId, "draft_started", { mode, topicLength: topic.length });

    // Start the workflow
    const result = await run.start({
      inputData: { topic },
    });

    const response = buildResponse(result);

    // Update workflow status based on result
    const token = await getToken({ template: "convex" });
    if (token) convex.setAuth(token);

    if (result.status === "success") {
      removeCachedRun(documentId);
      await convex.mutation(api.workflowRuns.update, {
        workflowRunId,
        status: "completed",
      });
    } else if (result.status === "suspended") {
      await convex.mutation(api.workflowRuns.update, {
        workflowRunId,
        status: "suspended",
        currentStep: result.suspended?.[0]?.[0] ?? result.suspended?.[0] ?? "unknown",
      });
    } else if (result.status === "failed") {
      await convex.mutation(api.workflowRuns.update, {
        workflowRunId,
        status: "failed",
        error: result.error?.message ?? "Workflow failed",
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    captureApiError(error, "/api/draft/start");
    console.error("Draft workflow start error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start workflow" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildResponse(result: any) {
  if (result.status === "suspended") {
    // `suspended` is an array of arrays of step IDs
    const suspendedStepId = result.suspended?.[0]?.[0] ?? result.suspended?.[0];

    return {
      status: "suspended",
      suspendedStep: suspendedStepId,
      suspendPayload: result.suspendPayload,
    };
  }

  if (result.status === "success") {
    return {
      status: "completed",
      completeDraft: result.result?.completeDraft ?? null,
    };
  }

  if (result.status === "failed") {
    return {
      status: "error",
      error: result.error?.message ?? "Workflow failed",
    };
  }

  return { status: result.status };
}
