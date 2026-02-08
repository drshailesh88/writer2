import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { workflowRuns } from "../start/route";

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const { getToken } = await auth();
    if (!(await getToken())) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { documentId, stepId, resumeData } = await req.json();

    if (!documentId || !stepId) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, stepId" },
        { status: 400 }
      );
    }

    const entry = workflowRuns.get(documentId);
    if (!entry) {
      return NextResponse.json(
        { error: "No active workflow found for this document. Please start a new one." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = entry.run as any;

    // Resume the workflow with user's data
    const result = await run.resume({
      step: stepId,
      resumeData: resumeData || { approved: true },
    });

    const response = buildResponse(result);

    // Clean up if completed
    if (result.status === "success") {
      workflowRuns.delete(documentId);
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
