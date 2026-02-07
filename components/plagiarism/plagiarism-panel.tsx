"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  CheckCircle,
  ExternalLink,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlagiarismSource {
  id: string;
  title: string;
  url: string;
  matchedWords: number;
  totalWords: number;
  similarity: number;
  matchedText: string;
}

interface PlagiarismResults {
  overallSimilarity: number;
  sources: PlagiarismSource[];
}

interface PlagiarismPanelProps {
  results: PlagiarismResults | null;
  isLoading: boolean;
  onSourceClick: (source: PlagiarismSource) => void;
  onClose: () => void;
}

/**
 * Returns Tailwind color classes based on similarity percentage thresholds.
 * Green < 10%, Amber 10-25%, Red > 25%.
 */
function getSimilarityColor(similarity: number) {
  if (similarity < 10) {
    return {
      bg: "bg-green-100 dark:bg-green-950/40",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-900",
      ring: "ring-green-500/20",
      progressBg: "bg-green-500",
    };
  }
  if (similarity <= 25) {
    return {
      bg: "bg-amber-100 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-900",
      ring: "ring-amber-500/20",
      progressBg: "bg-amber-500",
    };
  }
  return {
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-900",
    ring: "ring-red-500/20",
    progressBg: "bg-red-500",
  };
}

/** Truncates a URL for display, keeping it under a reasonable length. */
function truncateUrl(url: string, maxLength = 50): string {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname + parsed.pathname;
    if (display.length <= maxLength) return display;
    return display.slice(0, maxLength - 3) + "...";
  } catch {
    if (url.length <= maxLength) return url;
    return url.slice(0, maxLength - 3) + "...";
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Score skeleton */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Separator />
      {/* Source skeletons */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-12 w-full" />
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
        <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          No plagiarism detected
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your text appears to be original. No matching sources were found.
        </p>
      </div>
    </div>
  );
}

export function PlagiarismPanel({
  results,
  isLoading,
  onSourceClick,
  onClose,
}: PlagiarismPanelProps) {
  const hasResults = results !== null;
  const hasSources = hasResults && results.sources.length > 0;
  const colors = hasResults
    ? getSimilarityColor(results.overallSimilarity)
    : null;

  // Shared inner content used by both desktop panel and mobile bottom sheet
  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold">
            V1 Drafts Plagiarism Check
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0"
          onClick={onClose}
          aria-label="Close plagiarism panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : !hasResults || !hasSources ? (
        <EmptyState />
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {/* Overall similarity score badge */}
            <div className="flex flex-col items-center gap-2 py-3">
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full ring-4",
                  colors!.bg,
                  colors!.ring
                )}
              >
                <span
                  className={cn("text-2xl font-bold tabular-nums", colors!.text)}
                >
                  {results.overallSimilarity}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Overall Similarity
              </p>
              <Badge
                className={cn(
                  "text-xs",
                  results.overallSimilarity < 10
                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                    : results.overallSimilarity <= 25
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                )}
              >
                {results.overallSimilarity < 10
                  ? "Low Risk"
                  : results.overallSimilarity <= 25
                    ? "Moderate Risk"
                    : "High Risk"}
              </Badge>
            </div>

            <Separator />

            {/* Source list */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Matched Sources ({results.sources.length})
              </p>
              <div className="space-y-3">
                {results.sources.map((source) => {
                  const sourceColors = getSimilarityColor(source.similarity);
                  return (
                    <button
                      key={source.id}
                      type="button"
                      className={cn(
                        "w-full min-h-[44px] rounded-lg border p-3 text-left",
                        "transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        sourceColors.border
                      )}
                      onClick={() => onSourceClick(source)}
                      aria-label={`View details for source: ${source.title}`}
                    >
                      {/* Source title and similarity */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug line-clamp-2">
                          {source.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 tabular-nums text-[11px]",
                            sourceColors.text,
                            sourceColors.border
                          )}
                        >
                          {source.similarity}%
                        </Badge>
                      </div>

                      {/* URL */}
                      <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate text-[11px]">
                          {truncateUrl(source.url)}
                        </span>
                      </div>

                      {/* Matched words count */}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {source.matchedWords} of {source.totalWords} words
                        matched
                      </p>

                      {/* Matched text snippet */}
                      {source.matchedText && (
                        <div className="mt-2 rounded border-l-2 border-l-amber-400 bg-amber-50/50 px-2.5 py-1.5 dark:bg-amber-950/20">
                          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3 italic">
                            &ldquo;{source.matchedText}&rdquo;
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
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
        aria-label="Plagiarism check results"
      >
        {panelContent}
      </aside>

      {/* Mobile: Bottom sheet overlay */}
      <div
        className="fixed inset-0 z-50 md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Plagiarism check results"
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
