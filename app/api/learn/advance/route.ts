import { NextRequest, NextResponse } from "next/server";
import { learnWorkflowRuns } from "../start/route";

export async function POST(req: NextRequest) {
  try {
    const { documentId, currentStage } = await req.json();

    if (!documentId || !currentStage) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, currentStage" },
        { status: 400 }
      );
    }

    const entry = learnWorkflowRuns.get(documentId);
    if (!entry) {
      return NextResponse.json(
        {
          error:
            "No active learn mode session found. Please start a new session.",
        },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = entry.run as any;

    // Resume the workflow to advance to the next stage
    const result = await run.resume({
      step: currentStage,
      resumeData: { stageComplete: true },
    });

    const response = buildResponse(result);

    // Clean up if completed
    if (result.status === "success") {
      learnWorkflowRuns.delete(documentId);
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
