"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  Loader2,
  Crown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

/* ── Razorpay type declarations ── */
interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color: string };
  prefill?: { email?: string };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/* ── Plan definitions ── */
type PlanKey = "free" | "basic" | "pro";

interface PlanConfig {
  name: string;
  price: string;
  priceSubtext: string;
  description: string;
  highlighted: boolean;
  badge: string | null;
  ctaLabel: string;
  ctaDisabled: boolean;
  comingSoon: boolean;
}

const PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    name: "Free",
    price: "0",
    priceSubtext: "forever",
    description: "Get started with essential research tools",
    highlighted: false,
    badge: null,
    ctaLabel: "Current Plan",
    ctaDisabled: true,
    comingSoon: false,
  },
  basic: {
    name: "Basic",
    price: "1,000",
    priceSubtext: "/month",
    description: "Everything you need to write your thesis",
    highlighted: true,
    badge: "Most Popular",
    ctaLabel: "Subscribe to Basic",
    ctaDisabled: false,
    comingSoon: false,
  },
  pro: {
    name: "Pro",
    price: "2,000",
    priceSubtext: "/month",
    description: "For power users and research teams",
    highlighted: false,
    badge: "Coming Soon",
    ctaLabel: "Coming Soon",
    ctaDisabled: true,
    comingSoon: true,
  },
};

/* ── Feature rows for comparison table ── */
interface FeatureRow {
  label: string;
  free: string | boolean;
  basic: string | boolean;
  pro: string | boolean;
}

const FEATURES: FeatureRow[] = [
  {
    label: "Plagiarism Checks",
    free: "2/month",
    basic: "5/month",
    pro: "20/month",
  },
  {
    label: "AI Detection",
    free: "2/month",
    basic: "10/month",
    pro: "Unlimited",
  },
  {
    label: "Paper Search",
    free: "Unlimited",
    basic: "Unlimited",
    pro: "Unlimited",
  },
  {
    label: "Citations & Bibliography",
    free: "Unlimited",
    basic: "Unlimited",
    pro: "Unlimited",
  },
  {
    label: "Deep Research",
    free: false,
    basic: "5/month",
    pro: "15/month",
  },
  {
    label: "Learn Mode",
    free: true,
    basic: true,
    pro: true,
  },
  {
    label: "Draft Mode",
    free: false,
    basic: true,
    pro: true,
  },
];

/* ── FAQ data ── */
interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major payment methods through Razorpay, including UPI, credit cards, debit cards, net banking, and popular wallets like Paytm and PhonePe. All payments are processed securely in Indian Rupees (INR).",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period. There are no cancellation fees.",
  },
  {
    question: "What happens when I hit my monthly limit?",
    answer:
      "When you reach your monthly limit for a feature (e.g., plagiarism checks), you will not be able to use that feature until your limits reset at the start of the next billing cycle. You can upgrade your plan at any time to get higher limits immediately.",
  },
  {
    question: "Is there a free trial for the Basic plan?",
    answer:
      "We do not offer a free trial for the Basic plan. However, the Free tier gives you access to core features like Learn Mode, paper search, and citations with limited plagiarism and AI detection checks, so you can evaluate the platform before subscribing.",
  },
  {
    question: "When does my usage reset?",
    answer:
      "Your monthly usage limits reset on the same date each month, aligned with your subscription start date. For example, if you subscribed on the 15th, your limits reset on the 15th of each month.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "You can upgrade from Free to Basic at any time. When the Pro plan launches, you will be able to upgrade from Basic to Pro. Downgrades take effect at the end of your current billing period.",
  },
];

/* ── Toast component (inline, no external dependency) ── */
interface ToastState {
  visible: boolean;
  type: "success" | "error";
  message: string;
}

function InlineToast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  if (!toast.visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className={`flex items-center gap-3 rounded-lg border px-5 py-3.5 shadow-lg ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
            : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        }`}
      >
        {toast.type === "success" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0" />
        )}
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          onClick={onDismiss}
          className="ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Feature cell renderer ── */
function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
    );
  }
  return (
    <span className="text-sm font-medium text-foreground">{value}</span>
  );
}

/* ── Main pricing page ── */
export default function PricingPage() {
  const router = useRouter();
  const usage = useQuery(api.users.getUsage);

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "success",
    message: "",
  });

  const currentTier: PlanKey =
    usage?.tier === "basic" || usage?.tier === "pro"
      ? usage.tier
      : "free";

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ visible: true, type, message });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 5000);
    },
    []
  );

  const dismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  /* ── Load Razorpay script dynamically ── */
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  /* ── Subscribe handler ── */
  const handleSubscribe = useCallback(async () => {
    if (isSubscribing) return;
    setIsSubscribing(true);

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("error", "Failed to load payment gateway. Please try again.");
        setIsSubscribing(false);
        return;
      }

      // 2. Create subscription via API
      const response = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "basic" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to create subscription"
        );
      }

      const data = await response.json();
      const { subscriptionId, razorpayKeyId } = data as {
        subscriptionId: string;
        razorpayKeyId: string;
      };

      if (!subscriptionId || !razorpayKeyId) {
        throw new Error("Invalid subscription data received");
      }

      // 3. Open Razorpay Checkout
      const razorpay = new window.Razorpay!({
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "V1 Drafts",
        description: "Basic Plan - INR 1,000/month",
        handler: () => {
          showToast("success", "Subscription activated! Redirecting...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        },
        modal: {
          ondismiss: () => {
            setIsSubscribing(false);
          },
        },
        theme: {
          color: "#2563eb",
        },
      });

      razorpay.on("payment.failed", (resp: { error: { description: string } }) => {
        showToast(
          "error",
          resp.error.description || "Payment failed. Please try again."
        );
        setIsSubscribing(false);
      });

      razorpay.open();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      showToast("error", message);
      setIsSubscribing(false);
    }
  }, [isSubscribing, loadRazorpayScript, showToast, router]);

  /* ── Loading state ── */
  if (usage === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="font-mono text-sm text-muted-foreground">
            Loading pricing&hellip;
          </p>
        </div>
      </div>
    );
  }

  const planKeys: PlanKey[] = ["free", "basic", "pro"];

  /* ── Render ── */
  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-16">
      {/* ─── Header ─── */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
          All research needs met under one single roof. Choose the plan that
          fits your workflow.
        </p>
      </div>

      {/* ─── Plan Cards (3-column on desktop, stacked on mobile) ─── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {planKeys.map((key) => {
          const plan = PLANS[key];
          const isCurrentPlan = key === currentTier;
          const isHighlighted = plan.highlighted;

          return (
            <Card
              key={key}
              className={`relative flex flex-col ${
                isHighlighted
                  ? "border-2 border-blue-600 shadow-lg dark:border-blue-500"
                  : "border"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    className={`px-3 py-1 text-xs font-semibold ${
                      plan.comingSoon
                        ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        : "bg-blue-600 text-white hover:bg-blue-600"
                    }`}
                  >
                    {plan.comingSoon && (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Current Plan badge */}
              {isCurrentPlan && key === "free" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-xs font-semibold"
                  >
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 pt-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  {key === "free" && (
                    <Check className="h-6 w-6 text-muted-foreground" />
                  )}
                  {key === "basic" && (
                    <Crown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  )}
                  {key === "pro" && (
                    <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  )}
                </div>
                <CardTitle className="text-lg font-semibold">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 pb-6">
                {/* Price */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      INR
                    </span>
                    <span className="text-4xl font-bold tracking-tight">
                      {plan.price}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.priceSubtext}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Feature list */}
                <ul className="space-y-3">
                  {FEATURES.map((feature) => {
                    const value = feature[key];
                    const included =
                      typeof value === "boolean" ? value : true;

                    return (
                      <li
                        key={feature.label}
                        className="flex items-center gap-3 text-sm"
                      >
                        {included ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span
                          className={
                            included
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {feature.label}
                          {typeof value === "string" && (
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                              ({value})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>

              <CardFooter className="pb-8 pt-0">
                {key === "free" ? (
                  <Button
                    variant={isCurrentPlan ? "secondary" : "outline"}
                    className="min-h-[44px] w-full text-sm font-medium"
                    disabled={isCurrentPlan}
                    aria-label={
                      isCurrentPlan
                        ? "You are currently on the Free plan"
                        : "Free plan"
                    }
                  >
                    {isCurrentPlan ? "Current Plan" : "Free"}
                  </Button>
                ) : key === "basic" ? (
                  <Button
                    className="min-h-[44px] w-full bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                    disabled={isSubscribing || currentTier === "basic"}
                    onClick={handleSubscribe}
                    aria-label={
                      currentTier === "basic"
                        ? "You are currently on the Basic plan"
                        : "Subscribe to Basic plan"
                    }
                  >
                    {isSubscribing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : currentTier === "basic" ? (
                      "Current Plan"
                    ) : (
                      "Subscribe to Basic"
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="min-h-[44px] w-full text-sm font-medium"
                    disabled
                    aria-label="Pro plan coming soon"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Coming Soon
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* ─── Feature Comparison Table (desktop) ─── */}
      <section>
        <h2 className="text-center text-xl font-semibold tracking-tight">
          Feature comparison
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          A detailed look at what each plan includes
        </p>

        {/* Desktop table */}
        <div className="mt-8 hidden sm:block">
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">
                    Feature
                  </th>
                  {planKeys.map((key) => (
                    <th
                      key={key}
                      className={`px-6 py-4 text-center font-medium ${
                        key === "basic"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {PLANS[key].name}
                      {key === currentTier && (
                        <Badge
                          variant="secondary"
                          className="ml-2 px-1.5 py-0 font-mono text-[10px]"
                        >
                          You
                        </Badge>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, idx) => (
                  <tr
                    key={feature.label}
                    className={
                      idx < FEATURES.length - 1 ? "border-b" : ""
                    }
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {feature.label}
                    </td>
                    {planKeys.map((key) => (
                      <td
                        key={key}
                        className={`px-6 py-4 text-center ${
                          key === "basic"
                            ? "bg-blue-50/50 dark:bg-blue-950/20"
                            : ""
                        }`}
                      >
                        <FeatureCell value={feature[key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile comparison cards */}
        <div className="mt-8 space-y-4 sm:hidden">
          {FEATURES.map((feature) => (
            <Card key={feature.label} className="py-0">
              <CardContent className="py-4">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  {feature.label}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {planKeys.map((key) => (
                    <div key={key}>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        {PLANS[key].name}
                      </p>
                      <FeatureCell value={feature[key]} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section>
        <h2 className="text-center text-xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Everything you need to know about billing and plans
        </p>

        <div className="mx-auto mt-8 max-w-2xl space-y-2">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;

            return (
              <Card key={idx} className="py-0">
                <button
                  onClick={() =>
                    setOpenFaqIndex(isOpen ? null : idx)
                  }
                  className="flex min-h-[44px] w-full items-center justify-between px-6 py-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className="pr-4 text-sm font-medium text-foreground">
                    {item.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${idx}`}
                    className="border-t px-6 pb-4 pt-3"
                  >
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <div className="text-center">
        <Separator className="mb-10" />
        <p className="text-lg font-semibold">Ready to accelerate your research?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Join thousands of medical students writing better papers, faster.
        </p>
        <Button
          className="mt-6 min-h-[44px] bg-blue-600 px-8 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          disabled={isSubscribing || currentTier === "basic"}
          onClick={handleSubscribe}
          aria-label="Subscribe to Basic plan"
        >
          {isSubscribing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : currentTier === "basic" ? (
            "You are on the Basic Plan"
          ) : (
            "Get Started with Basic"
          )}
        </Button>
      </div>

      {/* Toast */}
      <InlineToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
