import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSubscription, getPlanId } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planType } = body as { planType?: string };

    if (!planType || (planType !== "basic" && planType !== "pro")) {
      return NextResponse.json(
        { error: "Invalid plan type. Must be 'basic' or 'pro'." },
        { status: 400 }
      );
    }

    if (planType === "pro") {
      return NextResponse.json(
        { error: "Pro plan is not yet available." },
        { status: 400 }
      );
    }

    const razorpayPlanId = getPlanId(planType);
    const { subscriptionId, shortUrl } = await createSubscription(
      razorpayPlanId,
      12,
      { clerkUserId: userId, planType }
    );

    return NextResponse.json({
      subscriptionId,
      shortUrl,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      clerkUserId: userId,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
