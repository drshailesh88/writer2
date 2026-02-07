import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { cancelSubscription } from "@/lib/razorpay";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set Convex auth token
    const token = await getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
    }

    // Get user's active subscription
    const subscription = await convex.query(api.subscriptions.getByUser);
    if (!subscription || subscription.status !== "active") {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Cancel at end of billing cycle
    const result = await cancelSubscription(
      subscription.razorpaySubscriptionId,
      true
    );

    return NextResponse.json({
      status: result.status,
      effectiveDate: new Date(subscription.currentPeriodEnd).toISOString(),
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
