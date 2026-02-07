import { NextRequest, NextResponse } from "next/server";
import { workflowRuns } from "../start/route";

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 }
      );
    }

    const entry = workflowRuns.get(documentId);
    if (!entry) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      mode: entry.mode,
    });
  } catch (error) {
    console.error("Draft status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 }
    );
  }
}
