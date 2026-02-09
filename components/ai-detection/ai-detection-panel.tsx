"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";

interface SentenceResult {
  text: string;
  startPosition: number;
  endPosition: number;
  classification: "human" | "ai";
  probability: number;
}

interface AiDetectionResults {
  overallAiScore: number;
  humanScore: number;
  sentences: SentenceResult[];
}

interface AiDetectionPanelProps {
  results: AiDetectionResults | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClose: () => void;
}

/**
 * Returns color info based on AI probability thresholds.
 * Green < 30% (likely human), Yellow 30-70% (uncertain), Red > 70% (likely AI).
 */
function getAiScoreColor(score: number) {
  if (score < 30) {
    return {
      bg: "bg-green-100 dark:bg-green-950/40",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-900",
      progressClass: "[&_[data-slot=progress-indicator]]:bg-green-500",
      label: "Likely Human",
      dot: "bg-green-500",
    };
  }
  if (score <= 70) {
    return {
      bg: "bg-amber-100 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-900",
      progressClass: "[&_[data-slot=progress-indicator]]:bg-amber-500",
      label: "Uncertain",
      dot: "bg-amber-500",
    };
  }
  return {
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-900",
    progressClass: "[&_[data-slot=progress-indicator]]:bg-red-500",
    label: "Likely AI",
    dot: "bg-red-500",
  };
}

/**
 * Returns a dot color class for a sentence based on its AI probability.
 */
function getSentenceDotColor(probability: number): string {
  if (probability < 30) return "bg-green-500";
  if (probability <= 70) return "bg-amber-500";
  return "bg-red-500";
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Disclaimer skeleton */}
      <Skeleton className="h-24 w-full rounded-lg" />
      {/* Score skeleton */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      <Separator />
      {/* Sentence skeletons */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-5 w-10 shrink-0 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
        <ShieldCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          No AI content detected
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your text appears to be entirely human-written.
        </p>
      </div>
    </div>
  );
}

/** Mandatory, non-dismissible disclaimer about AI detection limitations. */
function DisclaimerAlert() {
  return (
    <Alert className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
        AI detection provides an estimate, not a definitive conclusion.
        Scientific and medical writing may show elevated scores due to
        standardized structure and specialized vocabulary. Non-native English
        writers may also see higher scores. Results should not be used as sole
        evidence of AI use.
      </AlertDescription>
    </Alert>
  );
}

export function AiDetectionPanel({
  results,
  isLoading,
  error,
  onRetry,
  onClose,
}: AiDetectionPanelProps) {
  const hasResults = results !== null;
  const hasSentences = hasResults && results.sentences.length > 0;
  const colors = hasResults ? getAiScoreColor(results.overallAiScore) : null;

  // Shared inner content for both desktop and mobile layouts
  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold">
            V1 Drafts AI Detection
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0"
          onClick={onClose}
          aria-label="Close AI detection panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      {error && onRetry ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <DisclaimerAlert />
          <ErrorAlert
            error={error}
            onRetry={onRetry}
            retryLabel="Run Again"
            contactSupport
          />
        </div>
      ) : isLoading ? (
        <div className="flex-1 overflow-y-auto">
          {/* Show disclaimer even while loading */}
          <div className="px-4 pt-4">
            <DisclaimerAlert />
          </div>
          <LoadingSkeleton />
        </div>
      ) : !hasResults ? (
        <div className="flex flex-1 flex-col">
          <div className="px-4 pt-4">
            <DisclaimerAlert />
          </div>
          <EmptyState />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {/* Non-dismissible disclaimer -- always visible */}
            <DisclaimerAlert />

            {/* Overall AI score section */}
            <div className="flex flex-col items-center gap-3 py-3">
              {/* Large circular score display */}
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full ring-4",
                  colors!.bg,
                  colors!.text === "text-green-700 dark:text-green-400"
                    ? "ring-green-500/20"
                    : colors!.text === "text-amber-700 dark:text-amber-400"
                      ? "ring-amber-500/20"
                      : "ring-red-500/20"
                )}
              >
                <span
                  className={cn("text-2xl font-bold tabular-nums", colors!.text)}
                >
                  {results.overallAiScore}%
                </span>
              </div>
              <Badge
                className={cn(
                  "text-xs",
                  colors!.bg,
                  colors!.text
                )}
              >
                {colors!.label}
              </Badge>

              {/* Full-width progress bar */}
              <div className="w-full space-y-2">
                <Progress
                  value={results.overallAiScore}
                  className={cn("h-3 w-full", colors!.progressClass)}
                  aria-label={`AI probability: ${results.overallAiScore}%`}
                />
                {/* Human vs AI labels */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Human</span>
                    <span className="font-medium tabular-nums">
                      {results.humanScore}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">AI</span>
                    <span className="font-medium tabular-nums">
                      {results.overallAiScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sentence-level results */}
            {hasSentences && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sentence Analysis ({results.sentences.length})
                </p>
                <div className="space-y-2">
                  {results.sentences.map((sentence, index) => {
                    const dotColor = getSentenceDotColor(sentence.probability);
                    const probColors = getAiScoreColor(sentence.probability);

                    return (
                      <div
                        key={`${sentence.startPosition}-${sentence.endPosition}-${index}`}
                        className="group flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-accent/30"
                      >
                        {/* Colored dot */}
                        <span
                          className={cn(
                            "mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                            dotColor
                          )}
                          aria-hidden="true"
                        />
                        {/* Sentence text */}
                        <p className="flex-1 text-xs leading-relaxed text-foreground/90">
                          {sentence.text}
                        </p>
                        {/* Probability badge */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 tabular-nums text-[10px]",
                            probColors.text,
                            probColors.border
                          )}
                        >
                          {sentence.probability}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No sentences but results exist */}
            {!hasSentences && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No individual sentence analysis available.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: Right-side panel */}
      <aside
        className="hidden md:flex h-full w-[350px] shrink-0 flex-col border-l bg-background"
        role="complementary"
        aria-label="AI detection results"
      >
        {panelContent}
      </aside>

      {/* Mobile: Bottom sheet overlay */}
      <div
        className="fixed inset-0 z-50 md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="AI detection results"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Sheet */}
        <div className="absolute inset-x-0 bottom-0 flex max-h-[60vh] flex-col rounded-t-2xl bg-background shadow-xl animate-in slide-in-from-bottom duration-300">
          {/* Drag handle indicator */}
          <div className="flex justify-center py-2">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          {panelContent}
        </div>
      </div>
    </>
  );
}
