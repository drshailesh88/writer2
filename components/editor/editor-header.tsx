"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Maximize2, Minimize2, Check, Loader2 } from "lucide-react";
import Link from "next/link";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type DocumentMode = "learn" | "draft_guided" | "draft_handsoff";

const modeLabels: Record<DocumentMode, string> = {
  learn: "Learn Mode",
  draft_guided: "Draft (Guided)",
  draft_handsoff: "Draft (Hands-off)",
};

const modeVariants: Record<DocumentMode, "secondary" | "outline" | "default"> =
  {
    learn: "secondary",
    draft_guided: "outline",
    draft_handsoff: "default",
  };

interface EditorHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  saveStatus: SaveStatus;
  lastSavedAt?: number;
  mode: DocumentMode;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function EditorHeader({
  title,
  onTitleChange,
  saveStatus,
  lastSavedAt,
  mode,
  isFullscreen,
  onToggleFullscreen,
}: EditorHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setEditValue(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditValue(title);
      setIsEditing(false);
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex items-center gap-2 border-b bg-background px-3 py-2 sm:px-4">
      {/* Back button */}
      <Link href="/dashboard">
        <Button
          variant="ghost"
          size="icon-sm"
          className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      {/* Title — inline editable */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
            maxLength={120}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-w-0 truncate rounded-md px-2 py-1 text-left text-sm font-medium transition-colors hover:bg-muted"
            title="Click to rename"
          >
            {title || "Untitled Document"}
          </button>
        )}

        <Badge variant={modeVariants[mode]} className="shrink-0 text-[10px]">
          {modeLabels[mode]}
        </Badge>
      </div>

      {/* Save status */}
      <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <Check className="h-3 w-3 text-green-600" />
            <span>
              Saved{lastSavedAt ? ` at ${formatTimestamp(lastSavedAt)}` : ""}
            </span>
          </>
        )}
        {saveStatus === "error" && (
          <span className="text-destructive">Save failed</span>
        )}
      </div>

      {/* Fullscreen toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleFullscreen}
        className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] shrink-0"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
