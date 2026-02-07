"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  feature: "plagiarism" | "aiDetection" | "export";
  currentUsage: number;
  limit: number;
  tier: string;
  open: boolean;
  onClose: () => void;
}

const FEATURE_LABELS: Record<string, string> = {
  plagiarism: "Plagiarism Check",
  aiDetection: "AI Detection",
  export: "Document Export",
};

const TIER_LIMITS = {
  free: { plagiarism: 2, aiDetection: 2, export: "N/A" },
  basic: { plagiarism: 5, aiDetection: 10, export: "Unlimited" },
  pro: { plagiarism: 20, aiDetection: "Unlimited", export: "Unlimited" },
};

export function UpgradeModal({
  feature,
  currentUsage,
  limit,
  tier,
  open,
  onClose,
}: UpgradeModalProps) {
  const featureLabel = FEATURE_LABELS[feature] || feature;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {feature === "export" ? "Upgrade Required" : "Monthly Limit Reached"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {feature === "export"
              ? `${featureLabel} is not available on your current plan`
              : `You have reached your monthly usage limit for ${featureLabel}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {feature === "export" ? (
                <>{featureLabel} is available on Basic and Pro plans.</>
              ) : (
                <>
                  You&apos;ve used{" "}
                  <span className="font-bold">
                    {currentUsage}/{limit}
                  </span>{" "}
                  {featureLabel.toLowerCase()} checks this month.
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Your current plan:{" "}
              <Badge variant="outline" className="ml-1 text-xs capitalize">
                {tier}
              </Badge>
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Upgrade for more checks:
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {/* Free column */}
              <div
                className={`rounded-lg border p-3 ${
                  tier === "free"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <p className="font-medium">Free</p>
                <p className="mt-1 text-muted-foreground">
                  {TIER_LIMITS.free[feature as keyof typeof TIER_LIMITS.free]}/mo
                </p>
                {tier === "free" && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    Current
                  </Badge>
                )}
              </div>

              {/* Basic column */}
              <div
                className={`rounded-lg border p-3 ${
                  tier === "basic"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <p className="font-medium">Basic</p>
                <p className="mt-1 text-muted-foreground">
                  {TIER_LIMITS.basic[feature as keyof typeof TIER_LIMITS.basic]}/mo
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  INR 1,000/mo
                </p>
                {tier === "basic" ? (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    Current
                  </Badge>
                ) : tier === "free" ? (
                  <Check className="mx-auto mt-2 h-4 w-4 text-green-500" />
                ) : null}
              </div>

              {/* Pro column */}
              <div
                className={`rounded-lg border p-3 ${
                  tier === "pro"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <p className="font-medium">Pro</p>
                <p className="mt-1 text-muted-foreground">
                  {TIER_LIMITS.pro[feature as keyof typeof TIER_LIMITS.pro]}/mo
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  INR 2,000/mo
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 text-[10px] text-muted-foreground"
                >
                  Coming Soon
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button asChild className="min-h-[44px] flex-1">
              <Link href="/pricing">
                Upgrade to Basic
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="min-h-[44px]"
            >
              <X className="mr-2 h-4 w-4" />
              Maybe Later
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Usage resets on the 1st of each month
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
