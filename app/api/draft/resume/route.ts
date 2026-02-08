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
    if (!(await getToken()) || !clerkUserId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit: 10/min per user
    const rateLimitResponse = enforceRateLimit(req, "draftMode", clerkUserId);
    if (rateLimitResponse) return rateLimitResponse;

    const { documentId, stepId, resumeData } = await req.json();

    if (!documentId || !stepId) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, stepId" },
        { status: 400 }
      );
    }

    // Check in-memory cache for the run object
    const run = getCachedRun(documentId);
    if (!run) {
      // Check Convex to give a better error message
      const workflowRun = await convex.query(api.workflowRuns.getByDocument, {
        documentId: documentId as Id<"documents">,
      });

      if (workflowRun) {
        return NextResponse.json(
          { error: "Workflow session was lost due to a server restart. Please start a new workflow." },
          { status: 410 }
        );
      }

      return NextResponse.json(
        { error: "No active workflow found for this document. Please start a new one." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (run as any).resume({
      step: stepId,
      resumeData: resumeData || { approved: true },
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
    console.error("Draft workflow resume error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resume workflow" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildResponse(result: any) {
  if (result.status === "suspended") {
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
