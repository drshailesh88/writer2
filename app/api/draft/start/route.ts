import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/lib/mastra";

// In-memory store for workflow runs (keyed by documentId)
const workflowRuns = new Map<string, { run: unknown; mode: string }>();

export { workflowRuns };

export async function POST(req: NextRequest) {
  try {
    const { topic, mode, documentId } = await req.json();

    if (!topic || !mode || !documentId) {
      return NextResponse.json(
        { error: "Missing required fields: topic, mode, documentId" },
        { status: 400 }
      );
    }

    const workflowKey =
      mode === "draft_handsoff"
        ? "draftHandsOffWorkflow"
        : "draftGuidedWorkflow";

    const workflow = mastra.getWorkflow(workflowKey as "draftGuidedWorkflow" | "draftHandsOffWorkflow");
    const run = await workflow.createRun();

    // Store the run reference for later resume
    workflowRuns.set(documentId, { run, mode });

    // Start the workflow
    const result = await run.start({
      inputData: { topic },
    });

    const response = buildResponse(result);

    // Clean up if completed
    if (result.status === "success") {
      workflowRuns.delete(documentId);
    }

    return NextResponse.json(response);
  } catch (error) {
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
