import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getCachedRun, removeCachedRun } from "@/lib/workflow-cache";
import { enforceRateLimit } from "@/lib/middleware/rate-limit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const { getToken, userId: clerkUserId } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token || !clerkUserId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Set auth on Convex client
    convex.setAuth(token);

    // Rate limit: 10/min per user
    const rateLimitResponse = await enforceRateLimit(req, "learnMode", clerkUserId);
    if (rateLimitResponse) return rateLimitResponse;

    const { documentId, currentStage } = await req.json();

    if (!documentId || !currentStage) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, currentStage" },
        { status: 400 }
      );
    }

    // Check in-memory cache for the run object
    const run = getCachedRun(documentId);
    if (!run) {
      // Check Convex for better error messaging
      const workflowRun = await convex.query(api.workflowRuns.getByDocument, {
        documentId: documentId as Id<"documents">,
      });

      if (workflowRun) {
        return NextResponse.json(
          { error: "Session was lost due to a server restart. Please start a new Learn Mode session." },
          { status: 410 }
        );
      }

      return NextResponse.json(
        { error: "No active learn mode session found. Please start a new session." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (run as any).resume({
      step: currentStage,
      resumeData: { stageComplete: true },
    });

    const response = buildResponse(result);

    // Update Convex state
    const workflowRun = await convex.query(api.workflowRuns.getByDocument, {
      documentId: documentId as Id<"documents">,
    });

    if (workflowRun) {
      if (result.status === "success") {
        removeCachedRun(documentId);
        await convex.mutation(api.workflowRuns.update, {
          workflowRunId: workflowRun._id,
          status: "completed",
        });
      } else if (result.status === "suspended") {
        await convex.mutation(api.workflowRuns.update, {
          workflowRunId: workflowRun._id,
          status: "suspended",
          currentStep: result.suspended?.[0]?.[0] ?? result.suspended?.[0] ?? "unknown",
        });
      } else if (result.status === "failed") {
        removeCachedRun(documentId);
        await convex.mutation(api.workflowRuns.update, {
          workflowRunId: workflowRun._id,
          status: "failed",
          error: result.error?.message ?? "Workflow failed",
        });
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Learn mode advance error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to advance to next stage",
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
