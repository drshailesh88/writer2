"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown,
  CreditCard,
  Calendar,
  BarChart3,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

// ─── Inline toast (matching pricing page pattern) ───

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
          className="ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ───

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPlanLabel(
  tier: string
): { label: string; variant: "default" | "secondary" | "outline" } {
  switch (tier) {
    case "pro":
      return { label: "Pro", variant: "default" };
    case "basic":
      return { label: "Basic", variant: "default" };
    default:
      return { label: "Free", variant: "secondary" };
  }
}

function getUsagePercent(used: number, limit: number): number {
  if (limit === -1) return 0; // unlimited
  if (limit === 0) return 100; // not available
  return Math.min(Math.round((used / limit) * 100), 100);
}

function getUsageLabel(used: number, limit: number): string {
  if (limit === -1) return `${used} used (Unlimited)`;
  if (limit === 0) return "Not available on this plan";
  return `${used} / ${limit} used`;
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return "[&_[data-slot=progress-indicator]]:bg-red-500";
  if (percent >= 70)
    return "[&_[data-slot=progress-indicator]]:bg-amber-500";
  return "[&_[data-slot=progress-indicator]]:bg-blue-600";
}

// ─── Loading skeleton ───

function SubscriptionSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Plan card skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>

      {/* Usage card skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-11 w-full sm:w-40" />
            <Skeleton className="h-11 w-full sm:w-48" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main page component ───

export default function SubscriptionPage() {
  const router = useRouter();
  const subscription = useQuery(api.subscriptions.getByUser);
  const usage = useQuery(api.users.getUsage);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "success",
    message: "",
  });

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

  // ─── Cancel subscription handler ───

  const handleCancelSubscription = useCallback(async () => {
    if (isCancelling) return;
    setIsCancelling(true);

    try {
      const response = await fetch("/api/razorpay/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ||
            "Failed to cancel subscription"
        );
      }

      showToast(
        "success",
        "Subscription cancelled. You will retain access until the end of your billing period."
      );
      setCancelDialogOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      showToast("error", message);
    } finally {
      setIsCancelling(false);
    }
  }, [isCancelling, showToast]);

  // ─── Loading state ───

  if (subscription === undefined || usage === undefined) {
    return <SubscriptionSkeleton />;
  }

  // ─── Derived state ───

  const tier = usage?.tier ?? "free";
  const planInfo = getPlanLabel(tier);

  const hasActiveSubscription =
    subscription !== null &&
    (subscription.status === "active" || subscription.status === "paused");

  const isPaused = subscription?.status === "paused";
  const isCancelled = subscription?.status === "cancelled";

  const renewalDate = subscription?.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : null;

  const plagiarismUsed = usage?.plagiarismUsed ?? 0;
  const plagiarismLimit = usage?.plagiarismLimit ?? 0;
  const aiDetectionUsed = usage?.aiDetectionUsed ?? 0;
  const aiDetectionLimit = usage?.aiDetectionLimit ?? 0;
  const deepResearchUsed = usage?.deepResearchUsed ?? 0;
  const deepResearchLimit = usage?.deepResearchLimit ?? 0;

  const plagiarismPercent = getUsagePercent(plagiarismUsed, plagiarismLimit);
  const aiDetectionPercent = getUsagePercent(aiDetectionUsed, aiDetectionLimit);
  const deepResearchPercent = getUsagePercent(
    deepResearchUsed,
    deepResearchLimit
  );

  // ─── Render ───

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      {/* ─── Page header ─── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Subscription
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan, view usage, and billing details.
        </p>
      </div>

      {/* ─── Grace period warning banner ─── */}
      {isPaused && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            Payment issue detected
          </AlertTitle>
          <AlertDescription>
            Your subscription is currently paused due to a payment issue. Please
            update your payment method to avoid service interruption.
            {renewalDate && (
              <span>
                {" "}
                Your access will remain available until{" "}
                <span className="font-semibold">{renewalDate}</span>.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Cancelled notice ─── */}
      {isCancelled && renewalDate && (
        <Alert className="border-zinc-300 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            Subscription cancelled
          </AlertTitle>
          <AlertDescription>
            Your subscription has been cancelled. You will retain access to your
            current plan until{" "}
            <span className="font-semibold">{renewalDate}</span>. After that,
            your account will revert to the Free plan.
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Current plan card ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  Current Plan
                  <Badge
                    variant={planInfo.variant}
                    className={
                      tier === "basic" || tier === "pro"
                        ? "bg-blue-600 text-white hover:bg-blue-600"
                        : ""
                    }
                  >
                    {planInfo.label}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {tier === "pro"
                    ? "Full access to all features with highest limits"
                    : tier === "basic"
                      ? "Everything you need to write your thesis"
                      : "Essential research tools with limited usage"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Billing / Renewal date */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              {hasActiveSubscription && renewalDate ? (
                <span>
                  {isPaused ? "Access until" : "Renews on"}{" "}
                  <span className="font-medium">{renewalDate}</span>
                </span>
              ) : isCancelled && renewalDate ? (
                <span>
                  Access until{" "}
                  <span className="font-medium">{renewalDate}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  No active subscription
                </span>
              )}
            </div>

            {/* Payment method indicator */}
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
              {hasActiveSubscription ? (
                <span>Billed via Razorpay</span>
              ) : (
                <span className="text-muted-foreground">
                  No payment method on file
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Usage card ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Monthly Usage
          </CardTitle>
          <CardDescription>
            Usage resets on each billing cycle. Limits depend on your plan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Plagiarism checks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Plagiarism Checks</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {getUsageLabel(plagiarismUsed, plagiarismLimit)}
                </span>
              </div>
              {plagiarismLimit !== 0 && (
                <Progress
                  value={plagiarismLimit === -1 ? 0 : plagiarismPercent}
                  className={`h-2 ${getProgressColor(plagiarismPercent)}`}
                  aria-label={`Plagiarism checks: ${getUsageLabel(plagiarismUsed, plagiarismLimit)}`}
                />
              )}
              {plagiarismLimit === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upgrade your plan to access plagiarism checks.
                </p>
              )}
            </div>

            <Separator />

            {/* AI Detection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">AI Detection</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {getUsageLabel(aiDetectionUsed, aiDetectionLimit)}
                </span>
              </div>
              {aiDetectionLimit !== 0 && (
                <Progress
                  value={aiDetectionLimit === -1 ? 0 : aiDetectionPercent}
                  className={`h-2 ${getProgressColor(aiDetectionPercent)}`}
                  aria-label={`AI Detection: ${getUsageLabel(aiDetectionUsed, aiDetectionLimit)}`}
                />
              )}
              {aiDetectionLimit === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upgrade your plan to access AI detection.
                </p>
              )}
            </div>

            <Separator />

            {/* Deep Research */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Deep Research</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {getUsageLabel(deepResearchUsed, deepResearchLimit)}
                </span>
              </div>
              {deepResearchLimit !== 0 && (
                <Progress
                  value={deepResearchLimit === -1 ? 0 : deepResearchPercent}
                  className={`h-2 ${getProgressColor(deepResearchPercent)}`}
                  aria-label={`Deep Research: ${getUsageLabel(deepResearchUsed, deepResearchLimit)}`}
                />
              )}
              {deepResearchLimit === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upgrade your plan to access deep research.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Actions card ─── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Upgrade / Change plan */}
            <Button
              variant="outline"
              className="min-h-[44px] gap-2"
              onClick={() => router.push("/pricing")}
              aria-label="View pricing plans"
            >
              <ArrowRight className="h-4 w-4" />
              {hasActiveSubscription ? "Change Plan" : "Upgrade Plan"}
            </Button>

            {/* Cancel subscription */}
            {hasActiveSubscription && !isCancelled && (
              <AlertDialog
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="min-h-[44px]"
                    aria-label="Cancel subscription"
                  >
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {renewalDate ? (
                        <>
                          Your subscription will remain active until{" "}
                          <span className="font-semibold">{renewalDate}</span>.
                          After that, your account will revert to the Free plan.
                        </>
                      ) : (
                        <>
                          Your subscription will be cancelled immediately. Your
                          account will revert to the Free plan.
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="min-h-[44px]"
                      disabled={isCancelling}
                    >
                      Keep Subscription
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCancelSubscription();
                      }}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Yes, Cancel"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {hasActiveSubscription
              ? "Cancellation takes effect at the end of your current billing period. No refunds for partial months."
              : "You are on the Free plan. Upgrade to unlock more features and higher usage limits."}
          </p>
        </CardFooter>
      </Card>

      {/* Toast */}
      <InlineToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
