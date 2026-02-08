"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Download } from "lucide-react";
import {
  generateBibliography,
  exportBibliographyText,
  type CitationStyle,
  type PaperData,
} from "@/lib/bibliography";

const STYLE_LABELS: Record<CitationStyle, string> = {
  vancouver: "Vancouver",
  apa: "APA",
  ama: "AMA",
  chicago: "Chicago",
};

interface BibliographySectionProps {
  documentId: string;
  citationStyle: CitationStyle;
}

export function BibliographySection({
  documentId,
  citationStyle,
}: BibliographySectionProps) {
  const citationsWithPapers = useQuery(api.citations.listWithPapers, {
    documentId: documentId as Id<"documents">,
  });

  // Extract unique papers in citation order for bibliography
  const papers = useMemo(() => {
    if (!citationsWithPapers || citationsWithPapers.length === 0) return [];

    const seen = new Set<string>();
    const ordered: PaperData[] = [];

    for (const citation of citationsWithPapers) {
      if (!citation.paper) continue;
      const paperId = citation.paper._id;
      if (seen.has(paperId)) continue;
      seen.add(paperId);
      ordered.push({
        _id: paperId,
        title: citation.paper.title,
        authors: citation.paper.authors,
        journal: citation.paper.journal ?? undefined,
        year: citation.paper.year ?? undefined,
        doi: citation.paper.doi ?? undefined,
        url: citation.paper.url ?? undefined,
        metadata: citation.paper.metadata as PaperData["metadata"],
      });
    }

    return ordered;
  }, [citationsWithPapers]);

  const entries = useMemo(() => {
    if (papers.length === 0) return [];
    return generateBibliography(papers, citationStyle);
  }, [papers, citationStyle]);

  const handleExport = useCallback(() => {
    if (papers.length === 0) return;

    const text = exportBibliographyText(papers, citationStyle);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bibliography-${citationStyle}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [papers, citationStyle]);

  // Loading state
  if (citationsWithPapers === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-6 pb-8 sm:px-10">
        <div className="border-t border-border/60 pt-8 mt-4">
          <Skeleton className="h-6 w-28 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state: don't render anything
  if (entries.length === 0) return null;

  const isNumbered = citationStyle === "vancouver" || citationStyle === "ama";

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-3xl px-6 pb-10 sm:px-10">
        {/* Thin rule separating body from references */}
        <div className="border-t border-border/50 mt-2 pt-8" />

        {/* References heading with export button */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            References
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  Export {STYLE_LABELS[citationStyle]}
                </span>
                <span className="sm:hidden">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download references as .txt file</TooltipContent>
          </Tooltip>
        </div>

        {/* Bibliography entries */}
        {isNumbered ? (
          <ol className="list-none space-y-2.5 text-sm leading-relaxed text-foreground/85">
            {entries.map((entry, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 tabular-nums text-muted-foreground font-medium w-6 text-right">
                  {i + 1}.
                </span>
                <span>{entry}</span>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="list-none space-y-2.5 text-sm leading-relaxed text-foreground/85">
            {entries.map((entry, i) => (
              <li key={i} className="pl-6 -indent-6">
                {entry}
              </li>
            ))}
          </ul>
        )}
      </div>
    </TooltipProvider>
  );
}
