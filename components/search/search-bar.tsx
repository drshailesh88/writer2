"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export function SearchBar({ onSearch, isLoading, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search papers (e.g., laparoscopic appendectomy)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[44px] pl-10"
          disabled={isLoading}
          aria-label="Search papers"
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || query.trim().length < 2}
        className="min-h-[44px] min-w-[100px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching
          </>
        ) : (
          "Search"
        )}
      </Button>
    </form>
  );
}
