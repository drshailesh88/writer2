"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Quote,
} from "lucide-react";
import type { PaperSearchResult } from "@/lib/search/types";

interface PaperCardProps {
  paper: PaperSearchResult;
  actions?: React.ReactNode;
}

export function PaperCard({ paper, actions }: PaperCardProps) {
  const [showFullAbstract, setShowFullAbstract] = useState(false);

  const authorDisplay =
    paper.authors.length > 3
      ? `${paper.authors.slice(0, 3).join(", ")} et al.`
      : paper.authors.join(", ");

  const abstractPreview =
    paper.abstract && paper.abstract.length > 150
      ? `${paper.abstract.slice(0, 150)}...`
      : paper.abstract;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        {/* Title */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug sm:text-base">
            {paper.url ? (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline"
              >
                {paper.title}
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            ) : (
              paper.title
            )}
          </h3>
        </div>

        {/* Authors + Journal + Year */}
        <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
          {authorDisplay}
          {paper.journal && (
            <>
              {" "}
              &middot;{" "}
              <span className="italic">{paper.journal}</span>
            </>
          )}
          {paper.year && <> &middot; {paper.year}</>}
        </p>

        {/* Badges row */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {paper.isOpenAccess && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              Open Access
            </Badge>
          )}
          {paper.citationCount > 0 && (
            <Badge variant="outline" className="gap-1">
              <Quote className="h-3 w-3" />
              {paper.citationCount.toLocaleString()}
            </Badge>
          )}
          {paper.sources.length > 1 && (
            <Badge variant="outline" className="text-xs">
              {paper.sources.length} sources
            </Badge>
          )}
          {paper.publicationType && (
            <Badge variant="outline" className="text-xs">
              {paper.publicationType}
            </Badge>
          )}
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <div className="mb-3">
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {showFullAbstract ? paper.abstract : abstractPreview}
            </p>
            {paper.abstract.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto min-h-[44px] p-1 text-xs text-primary sm:min-h-0 sm:p-0"
                onClick={() => setShowFullAbstract(!showFullAbstract)}
              >
                {showFullAbstract ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    Hide Abstract
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" />
                    View Full Abstract
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* DOI */}
        {paper.doi && (
          <p className="mb-3 text-xs text-muted-foreground">
            DOI:{" "}
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {paper.doi}
            </a>
          </p>
        )}

        {/* Actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
