"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User as UserIcon,
  Crown,
  BarChart3,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
} from "lucide-react";

// ---- Inline toast (matching subscription page pattern) ----

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

// ---- Helpers ----

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
  if (limit === -1) return 0;
  if (limit === 0) return 100;
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

// ---- Loading skeleton ----

function AccountSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Profile card skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <Skeleton className="h-11 w-32" />
        </CardContent>
      </Card>

      {/* Subscription card skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-11 w-full sm:w-48" />
            <Skeleton className="h-11 w-full sm:w-40" />
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

      {/* Sign out skeleton */}
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

// ---- Main page component ----

export default function AccountPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const user = useQuery(api.users.getCurrent);
  const usage = useQuery(api.users.getUsage);
  const updateProfile = useMutation(api.users.updateProfile);

  const [institution, setInstitution] = useState<string | null>(null);
  const [specialization, setSpecialization] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  // ---- Save profile handler ----

  const handleSaveProfile = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      await updateProfile({
        institution: institution ?? undefined,
        specialization: specialization ?? undefined,
      });
      showToast("success", "Profile updated successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save profile.";
      showToast("error", message);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, institution, specialization, updateProfile, showToast]);

  // ---- Sign out handler ----

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      showToast("error", "Failed to sign out. Please try again.");
      setIsSigningOut(false);
    }
  }, [isSigningOut, signOut, showToast]);

  // ---- Loading state ----

  if (user === undefined || usage === undefined) {
    return <AccountSkeleton />;
  }

  // ---- Error state ----

  if (user === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Unable to load your account. Please try refreshing the page.
            </p>
            <Button
              variant="outline"
              className="mt-4 min-h-[44px]"
              onClick={() => window.location.reload()}
              aria-label="Refresh the page"
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Derived state ----

  const tier = usage?.tier ?? user.subscriptionTier ?? "free";
  const planInfo = getPlanLabel(tier);

  // Initialize form fields from server data on first render
  const institutionValue = institution ?? user.institution ?? "";
  const specializationValue = specialization ?? user.specialization ?? "";

  const hasChanges =
    institutionValue !== (user.institution ?? "") ||
    specializationValue !== (user.specialization ?? "");

  const avatarUrl = clerkUser?.imageUrl;
  const displayName = clerkUser?.fullName || user.name || "Researcher";
  const displayEmail =
    clerkUser?.primaryEmailAddress?.emailAddress || user.email || "";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Token data
  const tokensUsed = usage?.tokensUsed ?? 0;
  const tokensLimit = usage?.tokensLimit ?? 200;
  const tokensRemaining = Math.max(0, tokensLimit - tokensUsed);
  const tokenPercent = tokensLimit > 0 ? Math.min(Math.round((tokensUsed / tokensLimit) * 100), 100) : 0;

  // Usage data
  const learnModeUsed = usage?.learnModeUsed ?? 0;
  const learnModeLimit = usage?.learnModeLimit ?? 0;
  const plagiarismUsed = usage?.plagiarismUsed ?? 0;
  const plagiarismLimit = usage?.plagiarismLimit ?? 0;
  const aiDetectionUsed = usage?.aiDetectionUsed ?? 0;
  const aiDetectionLimit = usage?.aiDetectionLimit ?? 0;
  const deepResearchUsed = usage?.deepResearchUsed ?? 0;
  const deepResearchLimit = usage?.deepResearchLimit ?? 0;

  const learnModePercent = getUsagePercent(learnModeUsed, learnModeLimit);
  const plagiarismPercent = getUsagePercent(plagiarismUsed, plagiarismLimit);
  const aiDetectionPercent = getUsagePercent(aiDetectionUsed, aiDetectionLimit);
  const deepResearchPercent = getUsagePercent(
    deepResearchUsed,
    deepResearchLimit
  );

  // ---- Render ----

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, subscription, and usage.
        </p>
      </div>

      {/* ---- Profile card ---- */}
      <section>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Profile
        </p>
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${displayName}'s avatar`}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary">
                  <span className="font-mono text-lg font-bold text-primary-foreground">
                    {initials}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">
                  {displayName}
                </CardTitle>
                <CardDescription className="mt-0.5 truncate">
                  {displayEmail}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution" className="text-sm font-medium">
                  Institution
                </Label>
                <Input
                  id="institution"
                  placeholder="e.g. AIIMS New Delhi"
                  value={institutionValue}
                  onChange={(e) => setInstitution(e.target.value)}
                  aria-label="Institution name"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="specialization"
                  className="text-sm font-medium"
                >
                  Specialization
                </Label>
                <Input
                  id="specialization"
                  placeholder="e.g. General Surgery"
                  value={specializationValue}
                  onChange={(e) => setSpecialization(e.target.value)}
                  aria-label="Specialization"
                />
              </div>

              <Button
                className="min-h-[44px]"
                onClick={handleSaveProfile}
                disabled={isSaving || !hasChanges}
                aria-label="Save profile changes"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---- Subscription status card ---- */}
      <section>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Subscription
        </p>
        <Card className="mt-4">
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="min-h-[44px] gap-2"
                onClick={() => router.push("/account/subscription")}
                aria-label="Manage subscription"
              >
                <UserIcon className="h-4 w-4" />
                Manage Subscription
              </Button>
              <Button
                variant="outline"
                className="min-h-[44px] gap-2"
                onClick={() => router.push("/pricing")}
                aria-label="View pricing plans"
              >
                <ArrowRight className="h-4 w-4" />
                {tier === "free" ? "Upgrade Plan" : "Change Plan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---- Usage dashboard card ---- */}
      <section>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Monthly Usage
        </p>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Usage This Month
            </CardTitle>
            <CardDescription>
              Usage resets on each billing cycle. Limits depend on your plan.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Token Balance — highlighted */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    Tokens Remaining
                  </span>
                  <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
                    {tokensRemaining.toLocaleString()} / {tokensLimit.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={tokenPercent}
                  className={`mt-2 h-3 ${getProgressColor(tokenPercent)}`}
                  aria-label={`Tokens: ${tokensRemaining.toLocaleString()} of ${tokensLimit.toLocaleString()} remaining`}
                />
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Tokens are consumed by each operation. Resets monthly.
                </p>
              </div>

              <Separator />

              {/* Learn Mode sessions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Learn Mode Sessions</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {getUsageLabel(learnModeUsed, learnModeLimit)}
                  </span>
                </div>
                {learnModeLimit !== 0 && (
                  <Progress
                    value={learnModeLimit === -1 ? 0 : learnModePercent}
                    className={`h-2 ${getProgressColor(learnModePercent)}`}
                    aria-label={`Learn Mode sessions: ${getUsageLabel(learnModeUsed, learnModeLimit)}`}
                  />
                )}
                {learnModeLimit === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Upgrade your plan to access Learn Mode.
                  </p>
                )}
              </div>

              <Separator />

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
      </section>

      {/* ---- Sign out ---- */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="min-h-[44px] w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Sign out of your account"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Sign Out
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Toast */}
      <InlineToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
