"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";

interface Paper {
  _id: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  doi?: string;
}

interface CitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  papers: Paper[];
  onSelect: (paperId: string) => void;
}

export function CitationModal({
  open,
  onOpenChange,
  papers,
  onSelect,
}: CitationModalProps) {
  const [search, setSearch] = useState("");

  const filtered = papers.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.authors.some((a) => a.toLowerCase().includes(q)) ||
      (p.journal && p.journal.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Insert Citation
          </DialogTitle>
          <DialogDescription>
            Select a paper from your library to cite
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search papers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[40vh] overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {papers.length === 0
                ? "No papers in your library. Save papers from Search first."
                : "No papers match your search."}
            </div>
          ) : (
            filtered.map((paper) => (
              <Button
                key={paper._id}
                variant="ghost"
                className="w-full min-h-[44px] justify-start text-left h-auto py-2 px-3"
                onClick={() => onSelect(paper._id)}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {paper.title}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {paper.authors.slice(0, 3).join(", ")}
                    {paper.authors.length > 3 && " et al."}
                    {paper.year && ` (${paper.year})`}
                    {paper.journal && ` — ${paper.journal}`}
                  </span>
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
