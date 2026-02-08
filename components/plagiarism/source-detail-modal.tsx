"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
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

interface SourceDetailModalProps {
  source: PlagiarismSource | null;
  open: boolean;
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
    };
  }
  if (similarity <= 25) {
    return {
      bg: "bg-amber-100 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-900",
    };
  }
  return {
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-900",
  };
}

export function SourceDetailModal({
  source,
  open,
  onClose,
}: SourceDetailModalProps) {
  if (!source) return null;

  const colors = getSimilarityColor(source.similarity);
  const matchPercentage =
    source.totalWords > 0
      ? Math.round((source.matchedWords / source.totalWords) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">
            {source.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details about the matched plagiarism source including similarity
            score, URL, and matched text.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL row */}
          <div className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center text-sm text-blue-600 underline-offset-2 hover:underline dark:text-blue-400 break-all leading-snug"
              aria-label={`Open source URL in new tab: ${source.url}`}
            >
              {source.url}
            </a>
          </div>

          <Separator />

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Similarity badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Similarity:</span>
              <Badge
                variant="outline"
                className={cn(
                  "tabular-nums text-xs font-semibold",
                  colors.text,
                  colors.border
                )}
              >
                {source.similarity}%
              </Badge>
            </div>

            {/* Matched words */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Matched:</span>
              <span className="text-xs font-medium tabular-nums">
                {source.matchedWords} / {source.totalWords} words
              </span>
              <span className="text-[11px] text-muted-foreground">
                ({matchPercentage}%)
              </span>
            </div>
          </div>

          <Separator />

          {/* Matched text block */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Matched Text
            </p>
            <blockquote className="rounded-lg border-l-4 border-l-amber-400 bg-amber-50/50 px-4 py-3 dark:bg-amber-950/20">
              <p className="text-sm leading-relaxed text-foreground/90 italic">
                &ldquo;{source.matchedText}&rdquo;
              </p>
            </blockquote>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-1">
            <Button
              className="min-h-[44px] gap-2"
              onClick={() => window.open(source.url, "_blank", "noopener,noreferrer")}
              aria-label={`View source: ${source.title}`}
            >
              <ExternalLink className="h-4 w-4" />
              View Source
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
