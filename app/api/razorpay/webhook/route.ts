import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyWebhookSignature } from "@/lib/razorpay";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      console.error("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event as string;
    const subscriptionEntity = payload.payload?.subscription?.entity;

    console.log(`Razorpay webhook received: event=${event}`);

    if (!subscriptionEntity) {
      return NextResponse.json({ received: true });
    }

    const razorpaySubscriptionId = subscriptionEntity.id as string;
    const notes = subscriptionEntity.notes || {};
    const clerkUserId = notes.clerkUserId as string | undefined;
    const planType = (notes.planType || "basic") as "basic" | "pro";

    switch (event) {
      case "subscription.activated": {
        if (!clerkUserId) {
          console.error("No clerkUserId in subscription notes:", razorpaySubscriptionId);
          break;
        }

        // Look up user by Clerk ID
        const user = await convex.query(api.users.getByClerkId, {
          clerkId: clerkUserId,
        });

        if (!user) {
          console.error("User not found for clerkId:", clerkUserId);
          break;
        }

        const startAt = subscriptionEntity.current_start
          ? subscriptionEntity.current_start * 1000
          : Date.now();
        const endAt = subscriptionEntity.current_end
          ? subscriptionEntity.current_end * 1000
          : startAt + 30 * 24 * 60 * 60 * 1000;

        await convex.mutation(api.subscriptions.activateFromWebhook, {
          userId: user._id,
          razorpaySubscriptionId,
          planType,
          currentPeriodStart: startAt,
          currentPeriodEnd: endAt,
        });
        break;
      }

      case "subscription.charged": {
        // Billing period renewal — update the period dates
        const startAt = subscriptionEntity.current_start
          ? subscriptionEntity.current_start * 1000
          : Date.now();
        const endAt = subscriptionEntity.current_end
          ? subscriptionEntity.current_end * 1000
          : startAt + 30 * 24 * 60 * 60 * 1000;

        await convex.mutation(api.subscriptions.updateFromWebhook, {
          razorpaySubscriptionId,
          status: "active",
          currentPeriodStart: startAt,
          currentPeriodEnd: endAt,
        });
        break;
      }

      case "subscription.cancelled": {
        await convex.mutation(api.subscriptions.updateFromWebhook, {
          razorpaySubscriptionId,
          status: "cancelled",
        });
        break;
      }

      case "payment.failed": {
        // Payment failed — set subscription to paused (3-day grace period)
        await convex.mutation(api.subscriptions.updateFromWebhook, {
          razorpaySubscriptionId,
          status: "paused",
        });
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }

    // Always respond 200 to prevent retries
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    // Still respond 200 to prevent infinite retries
    return NextResponse.json({ received: true });
  }
}
