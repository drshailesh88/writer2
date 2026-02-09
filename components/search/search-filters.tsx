"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { SearchFilters } from "@/lib/search/types";

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const STUDY_TYPES = [
  { value: "", label: "All Types" },
  { value: "randomized controlled trial", label: "Randomized Controlled Trial" },
  { value: "meta-analysis", label: "Meta-Analysis" },
  { value: "systematic review", label: "Systematic Review" },
  { value: "review", label: "Review" },
  { value: "clinical trial", label: "Clinical Trial" },
  { value: "case reports", label: "Case Report" },
  { value: "observational study", label: "Observational Study" },
];

export function SearchFiltersPanel({
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.yearFrom ||
    filters.yearTo ||
    filters.studyType ||
    filters.openAccessOnly ||
    filters.humanOnly;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto min-h-[44px] p-1 text-xs text-muted-foreground sm:min-h-0"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Year Range */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Year Range
        </Label>
        <div className="flex items-center gap-2">
          <Select
            value={filters.yearFrom ? String(filters.yearFrom) : ""}
            onValueChange={(v) =>
              updateFilter("yearFrom", v ? parseInt(v, 10) : undefined)
            }
          >
            <SelectTrigger className="min-h-[44px] sm:min-h-0">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">to</span>
          <Select
            value={filters.yearTo ? String(filters.yearTo) : ""}
            onValueChange={(v) =>
              updateFilter("yearTo", v ? parseInt(v, 10) : undefined)
            }
          >
            <SelectTrigger className="min-h-[44px] sm:min-h-0">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Study Type */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Study Type
        </Label>
        <Select
          value={filters.studyType ?? ""}
          onValueChange={(v) =>
            updateFilter("studyType", v || undefined)
          }
        >
          <SelectTrigger className="min-h-[44px] sm:min-h-0">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {STUDY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Open Access */}
      <div className="flex min-h-[44px] items-center justify-between sm:min-h-0">
        <Label
          htmlFor="oa-toggle"
          className="text-xs font-medium text-muted-foreground"
        >
          Open Access Only
        </Label>
        <Switch
          id="oa-toggle"
          checked={filters.openAccessOnly ?? false}
          onCheckedChange={(checked) =>
            updateFilter("openAccessOnly", checked || undefined)
          }
        />
      </div>

      {/* Human Studies */}
      <div className="flex min-h-[44px] items-center gap-2 sm:min-h-0">
        <Checkbox
          id="human-only"
          checked={filters.humanOnly ?? false}
          onCheckedChange={(checked) =>
            updateFilter("humanOnly", checked === true || undefined)
          }
        />
        <Label
          htmlFor="human-only"
          className="text-xs font-medium text-muted-foreground"
        >
          Human Studies Only
        </Label>
      </div>
    </div>
  );
}
