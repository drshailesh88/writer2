import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/lib/mastra";

// In-memory store for learn mode workflow runs (keyed by documentId)
const learnWorkflowRuns = new Map<string, { run: unknown }>();

export { learnWorkflowRuns };

export async function POST(req: NextRequest) {
  try {
    const { topic, documentId } = await req.json();

    if (!topic || !documentId) {
      return NextResponse.json(
        { error: "Missing required fields: topic, documentId" },
        { status: 400 }
      );
    }

    const workflow = mastra.getWorkflow("learnModeWorkflow");
    const run = await workflow.createRun();

    // Store the run reference for later resume/advance
    learnWorkflowRuns.set(documentId, { run });

    // Start the workflow
    const result = await run.start({
      inputData: { topic, documentId },
    });

    const response = buildResponse(result);

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
