import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { captureApiError } from "@/lib/sentry-helpers";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  try {
    // AI detection requires auth
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    convex.setAuth(token);

    const checkId = req.nextUrl.searchParams.get("checkId");

    if (!checkId) {
      return NextResponse.json(
        { error: "checkId query parameter is required" },
        { status: 400 }
      );
    }

    const check = await convex.query(api.aiDetectionChecks.get, {
      checkId: checkId as never,
    });

    if (!check) {
      return NextResponse.json({ error: "Check not found" }, { status: 404 });
    }

    return NextResponse.json({
      checkId: check._id,
      status: check.status,
      result:
        check.status === "completed"
          ? {
              overallAiScore: check.overallAiScore,
              humanScore: 100 - (check.overallAiScore ?? 0),
              sentences: check.sentenceResults,
            }
          : undefined,
    });
  } catch (error) {
    captureApiError(error, "/api/ai-detection/status");
    console.error("AI detection status error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
