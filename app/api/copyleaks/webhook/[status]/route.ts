import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { parsePlagiarismResult } from "@/lib/copyleaks";
import { requireConvexActionSecret } from "@/lib/convex-action-secret";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function verifyCopyleaksSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.COPYLEAKS_WEBHOOK_SECRET || process.env.COPYLEAKS_API_KEY;
  if (!secret || !signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ status: string }> }
) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.COPYLEAKS_WEBHOOK_SECRET || process.env.COPYLEAKS_API_KEY;
    if (webhookSecret) {
      const signature = req.headers.get("x-copyleaks-signature")
        || req.headers.get("authorization");

      if (!verifyCopyleaksSignature(rawBody, signature)) {
        console.error("Copyleaks webhook: Invalid or missing signature");
        return NextResponse.json(
          { error: "Unauthorized: Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    const actionSecret = requireConvexActionSecret();
    const { status } = await params;
    const payload = JSON.parse(rawBody);
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

        await convex.action(api.plagiarismChecks.updateResult, {
          checkId: checkId as never,
          overallSimilarity: result.overallSimilarity,
          sources: result.sources,
          copyleaksScanId: scanId,
          status: "completed",
          actionSecret,
        });
      }
      // AI detection uses synchronous API, so webhooks are only for plagiarism
    } else if (status === "error" || status === "creditsChecked") {
      if (status === "error") {
        if (isPlagiarism) {
          await convex.action(api.plagiarismChecks.updateResult, {
            checkId: checkId as never,
            overallSimilarity: 0,
            sources: [],
            copyleaksScanId: scanId,
            status: "failed",
            actionSecret,
          });
        }
      }
    }

    // Always respond 200 to Copyleaks
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Copyleaks webhook error:", error);
    if (error instanceof Error && error.message.includes("CONVEX_ACTION_SECRET")) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }
    // Still respond 200 to prevent infinite retries
    return NextResponse.json({ received: true });
  }
}
