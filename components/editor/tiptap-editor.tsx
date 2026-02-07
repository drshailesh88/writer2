"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import { useState, useCallback, useEffect, useRef } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { EditorHeader } from "./editor-header";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type DocumentMode = "learn" | "draft_guided" | "draft_handsoff";

const IMRAD_TEMPLATE = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Introduction" }],
    },
    { type: "paragraph" },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Methods" }],
    },
    { type: "paragraph" },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Results" }],
    },
    { type: "paragraph" },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Discussion" }],
    },
    { type: "paragraph" },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Conclusion" }],
    },
    { type: "paragraph" },
  ],
};

interface TiptapEditorProps {
  documentId: string;
  initialContent?: Record<string, unknown>;
  initialTitle: string;
  mode: DocumentMode;
  onSave: (data: {
    content: Record<string, unknown>;
    wordCount: number;
    title?: string;
  }) => Promise<void>;
  onInsertCitation?: () => void;
}

export function TiptapEditor({
  initialContent,
  initialTitle,
  mode,
  onSave,
  onInsertCitation,
}: TiptapEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | undefined>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTitleRef = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Section heading...";
          }
          return "Start writing...";
        },
      }),
      CharacterCount,
      Underline,
    ],
    content: initialContent || IMRAD_TEMPLATE,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] px-6 py-4 sm:px-10 sm:py-6",
      },
    },
    onUpdate: ({ editor: ed }) => {
      debouncedSave(ed.getJSON(), ed.storage.characterCount.words());
    },
  });

  const debouncedSave = useCallback(
    (content: Record<string, unknown>, wordCount: number) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await onSave({
            content,
            wordCount,
            title: pendingTitleRef.current || undefined,
          });
          pendingTitleRef.current = null;
          setSaveStatus("saved");
          setLastSavedAt(Date.now());
        } catch {
          setSaveStatus("error");
        }
      }, 2000);
    },
    [onSave]
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      pendingTitleRef.current = newTitle;
      // Trigger save with current editor content
      if (editor) {
        debouncedSave(
          editor.getJSON(),
          editor.storage.characterCount.words()
        );
      }
    },
    [editor, debouncedSave]
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const wordCount = editor?.storage.characterCount.words() ?? 0;
  const charCount = editor?.storage.characterCount.characters() ?? 0;

  return (
    <div
      className={`flex flex-col bg-background ${
        isFullscreen ? "fixed inset-0 z-50" : "rounded-lg border shadow-sm"
      }`}
    >
      {/* Header bar */}
      <EditorHeader
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        mode={mode}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Toolbar */}
      <EditorToolbar editor={editor} onInsertCitation={onInsertCitation} />

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-1.5 text-xs text-muted-foreground">
        <div className="sm:hidden">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Save failed"}
        </div>
        <div className="hidden sm:block" />
        <div className="flex items-center gap-3">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="hidden sm:inline">
            {charCount.toLocaleString()} characters
          </span>
        </div>
      </div>
    </div>
  );
}
