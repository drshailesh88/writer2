import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  try {
    // Set auth if available (anonymous plagiarism checks don't require it)
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
    }

    const checkId = req.nextUrl.searchParams.get("checkId");

    if (!checkId) {
      return NextResponse.json(
        { error: "checkId query parameter is required" },
        { status: 400 }
      );
    }

    const check = await convex.query(api.plagiarismChecks.get, {
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
              overallSimilarity: check.overallSimilarity,
              sources: check.sources,
            }
          : undefined,
    });
  } catch (error) {
    console.error("Plagiarism status error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
