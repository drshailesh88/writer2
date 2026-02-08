import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { mastra } from "@/lib/mastra";
import { cacheRun } from "@/lib/workflow-cache";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { topic, documentId } = await req.json();

    if (!topic || !documentId) {
      return NextResponse.json(
        { error: "Missing required fields: topic, documentId" },
        { status: 400 }
      );
    }

    if (typeof topic === "string" && topic.length > 500) {
      return NextResponse.json(
        { error: "Topic must be under 500 characters" },
        { status: 400 }
      );
    }

    // Authenticate via Clerk
    const { userId: clerkUserId, getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token || !clerkUserId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Rate limit: 10/min per user
    const rateLimitResponse = enforceRateLimit(req, "learnMode", clerkUserId);
    if (rateLimitResponse) return rateLimitResponse;

    // Create Convex session record (enforces usage limits)
    convex.setAuth(token);
    try {
      await convex.mutation(api.learnModeSessions.create, {
        documentId: documentId as Id<"documents">,
      });
    } catch (convexError: unknown) {
      const message =
        (convexError as { data?: string })?.data ??
        (convexError as Error)?.message ??
        "Usage limit reached";
      return NextResponse.json(
        { error: message },
        { status: 403 }
      );
    }

    const workflow = mastra.getWorkflow("learnModeWorkflow");
    const run = await workflow.createRun();

    // Cache run object in memory (needed for Mastra resume)
    cacheRun(documentId, run);

    // Persist workflow run to Convex (auth already set — uses identity for ownership)
    const workflowRunId = await convex.mutation(api.workflowRuns.create, {
      documentId: documentId as Id<"documents">,
      workflowType: "learn" as const,
      currentStep: "understand",
    });

    // Start the workflow
    const result = await run.start({
      inputData: { topic, documentId },
    });

    const response = buildResponse(result);

    // Update workflow status based on result
    if (result.status === "suspended") {
      await convex.mutation(api.workflowRuns.update, {
        workflowRunId,
        status: "suspended",
        currentStep: result.suspended?.[0]?.[0] ?? result.suspended?.[0] ?? "understand",
      });
    } else if (result.status === "success") {
      await convex.mutation(api.workflowRuns.update, {
        workflowRunId,
        status: "completed",
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
    console.error("Learn mode workflow start error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start learn mode",
      },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildResponse(result: any) {
  if (result.status === "suspended") {
    const suspendedStepId =
      result.suspended?.[0]?.[0] ?? result.suspended?.[0];

    return {
      status: "suspended",
      stage: suspendedStepId,
      coachMessage: result.suspendPayload?.coachMessage ?? null,
    };
  }

  if (result.status === "success") {
    return {
      status: "completed",
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
