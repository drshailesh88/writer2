import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getCachedRun } from "@/lib/workflow-cache";
import { captureApiError } from "@/lib/sentry-helpers";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Set auth on Convex client for ownership checks
    convex.setAuth(token);

    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 }
      );
    }

    // Check Convex for persistent workflow state (auth-gated — only returns user's own runs)
    const workflowRun = await convex.query(api.workflowRuns.getByDocument, {
      documentId: documentId as Id<"documents">,
    });

    if (!workflowRun) {
      return NextResponse.json({ active: false });
    }

    // Check if the in-memory run object is still available (needed for resume)
    const hasRunInMemory = getCachedRun(documentId) !== null;

    return NextResponse.json({
      active: true,
      mode: workflowRun.workflowType,
      currentStep: workflowRun.currentStep,
      status: workflowRun.status,
      canResume: hasRunInMemory,
    });
  } catch (error) {
    captureApiError(error, "/api/draft/status");
    console.error("Draft status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 }
    );
  }
}
