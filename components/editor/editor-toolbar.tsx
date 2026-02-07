"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  BookOpen,
} from "lucide-react";

type CitationStyle = "vancouver" | "apa" | "ama" | "chicago";

const STYLE_LABELS: Record<CitationStyle, string> = {
  vancouver: "Vancouver",
  apa: "APA",
  ama: "AMA",
  chicago: "Chicago",
};

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  tooltip: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({
  onClick,
  isActive,
  tooltip,
  children,
  disabled,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          disabled={disabled}
          className={`min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] rounded-md transition-colors ${
            isActive
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={tooltip}
          aria-pressed={isActive}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
  onInsertCitation?: () => void;
  citationStyle?: CitationStyle;
  onStyleChange?: (style: CitationStyle) => void;
}

export function EditorToolbar({
  editor,
  onInsertCitation,
  citationStyle,
  onStyleChange,
}: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <TooltipProvider>
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5"
      >
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          tooltip="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          tooltip="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          tooltip="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          tooltip="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        {onInsertCitation && (
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onInsertCitation}
                  className="min-h-[44px] sm:min-h-[32px] gap-1.5 text-xs font-medium"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Insert Citation</span>
                  <span className="sm:hidden">Cite</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert citation from library</TooltipContent>
            </Tooltip>

            {citationStyle && onStyleChange && (
              <Select
                value={citationStyle}
                onValueChange={(value) =>
                  onStyleChange(value as CitationStyle)
                }
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger
                      size="sm"
                      className="min-h-[44px] sm:min-h-[32px] w-auto text-xs font-medium"
                      aria-label="Citation style"
                    >
                      <SelectValue>
                        {STYLE_LABELS[citationStyle]}
                      </SelectValue>
                    </SelectTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Citation style</TooltipContent>
                </Tooltip>
                <SelectContent>
                  <SelectItem value="vancouver">Vancouver</SelectItem>
                  <SelectItem value="apa">APA</SelectItem>
                  <SelectItem value="ama">AMA</SelectItem>
                  <SelectItem value="chicago">Chicago</SelectItem>
                </SelectContent>
              </Select>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
