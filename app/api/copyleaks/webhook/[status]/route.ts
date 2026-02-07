import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { parsePlagiarismResult } from "@/lib/copyleaks";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ status: string }> }
) {
  try {
    const { status } = await params;
    const payload = await req.json();
    const scanId =
      payload?.scannedDocument?.scanId || payload?.scanId || "";

    console.log(`Copyleaks webhook received: status=${status}, scanId=${scanId}`);

    if (!scanId) {
      // Respond 200 to prevent retries for malformed requests
      return NextResponse.json({ received: true });
    }

    // Determine if this is a plagiarism scan (plag_) or AI detection scan (ai_)
    const isPlagiarism = scanId.startsWith("plag_");

    // Extract the Convex checkId from the scanId pattern: plag_{checkId}_{timestamp}
    const parts = scanId.split("_");
    // checkId is the second part
    const checkId = parts.length >= 2 ? parts[1] : null;

    if (!checkId) {
      console.error("Could not extract checkId from scanId:", scanId);
      return NextResponse.json({ received: true });
    }

    if (status === "completed") {
      if (isPlagiarism) {
        const result = parsePlagiarismResult(payload);

        await convex.mutation(api.plagiarismChecks.updateResult, {
          checkId: checkId as never,
          overallSimilarity: result.overallSimilarity,
          sources: result.sources,
          copyleaksScanId: scanId,
          status: "completed",
        });
      }
      // AI detection uses synchronous API, so webhooks are only for plagiarism
    } else if (status === "error" || status === "creditsChecked") {
      if (status === "error") {
        if (isPlagiarism) {
          await convex.mutation(api.plagiarismChecks.updateResult, {
            checkId: checkId as never,
            overallSimilarity: 0,
            sources: [],
            copyleaksScanId: scanId,
            status: "failed",
          });
        }
        // Note: Usage counter decrement would need user context
        // which we don't have in webhook. The counter was already
        // incremented on submission. For failed scans, we accept
        // the slight over-count as a tradeoff. The user can contact
        // support for manual adjustment if needed.
      }
    }

    // Always respond 200 to Copyleaks
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Copyleaks webhook error:", error);
    // Still respond 200 to prevent infinite retries
    return NextResponse.json({ received: true });
  }
}
