"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import type { PaperSearchResult } from "@/lib/search/types";

interface SaveToLibraryProps {
  paper: PaperSearchResult;
}

export function SaveToLibrary({ paper }: SaveToLibraryProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("");

  const existingPaper = useQuery(api.papers.getByExternalId, {
    externalId: paper.externalId,
  });

  const collections = useQuery(api.collections.list);
  const savePaper = useMutation(api.papers.save);

  const isSaved = existingPaper !== null && existingPaper !== undefined;
  const isLoading = existingPaper === undefined;

  const handleSave = async () => {
    if (isSaved || isSaving) return;

    setIsSaving(true);
    try {
      await savePaper({
        externalId: paper.externalId,
        source: paper.source,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal ?? undefined,
        year: paper.year ?? undefined,
        abstract: paper.abstract ?? undefined,
        doi: paper.doi ?? undefined,
        url: paper.url ?? undefined,
        isOpenAccess: paper.isOpenAccess,
        collectionId: selectedCollection
          ? (selectedCollection as Id<"collections">)
          : undefined,
      });
    } catch {
      // Error handled silently — Convex will show error in dev
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isSaved ? "secondary" : "outline"}
        size="sm"
        className="min-h-[44px] gap-1.5 sm:min-h-0"
        disabled={isSaved || isSaving || isLoading}
        onClick={handleSave}
      >
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck className="h-3.5 w-3.5" />
        ) : (
          <Bookmark className="h-3.5 w-3.5" />
        )}
        {isSaved ? "Saved" : "Save to Library"}
      </Button>

      {!isSaved && collections && collections.length > 0 && (
        <Select
          value={selectedCollection}
          onValueChange={setSelectedCollection}
        >
          <SelectTrigger className="min-h-[44px] w-full max-w-[140px] text-xs sm:min-h-0">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No collection</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
