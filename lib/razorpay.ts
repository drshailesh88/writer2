import Razorpay from "razorpay";
import crypto from "crypto";

let instance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!instance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
    }

    instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return instance;
}

export async function createSubscription(
  planId: string,
  totalCount: number = 12
): Promise<{
  subscriptionId: string;
  shortUrl: string;
}> {
  const razorpay = getRazorpayInstance();

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    quantity: 1,
  });

  return {
    subscriptionId: subscription.id,
    shortUrl: subscription.short_url || "",
  };
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean = true
): Promise<{ status: string }> {
  const razorpay = getRazorpayInstance();

  const result = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);

  return { status: result.status || "cancelled" };
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export function getPlanId(planType: "basic" | "pro"): string {
  const planId =
    planType === "basic"
      ? process.env.RAZORPAY_BASIC_PLAN_ID
      : process.env.RAZORPAY_PRO_PLAN_ID;

  if (!planId) {
    throw new Error(`RAZORPAY_${planType.toUpperCase()}_PLAN_ID must be set`);
  }

  return planId;
}
