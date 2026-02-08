"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { EditorHeader } from "./editor-header";
import { CitationExtension } from "./citation-extension";
import { BibliographySection } from "./bibliography-section";

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

export interface TiptapEditorHandle {
  insertCitation: (
    paperId: string,
    citationNumber: number,
    authorYear: string
  ) => void;
  setContent: (markdownDraft: string) => void;
  getText: () => string;
  getCitationPaperIds: () => string[];
}

type CitationStyle = "vancouver" | "apa" | "ama" | "chicago";

interface TiptapEditorProps {
  documentId: string;
  initialContent?: Record<string, unknown>;
  initialTitle: string;
  mode: DocumentMode;
  citationStyle?: CitationStyle;
  onSave: (data: {
    content: Record<string, unknown>;
    wordCount: number;
    title?: string;
  }) => Promise<void>;
  onInsertCitation?: () => void;
  onStyleChange?: (style: CitationStyle) => void;
  onCheckPlagiarism?: () => void;
  isPlagiarismLoading?: boolean;
  onCheckAiDetection?: () => void;
  isAiDetectionLoading?: boolean;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  isExportLoading?: boolean;
  draftSelector?: React.ReactNode;
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditor(
    {
      documentId,
      initialContent,
      initialTitle,
      mode,
      citationStyle = "vancouver",
      onSave,
      onInsertCitation,
      onStyleChange,
      onCheckPlagiarism,
      isPlagiarismLoading,
      onCheckAiDetection,
      isAiDetectionLoading,
      onExportDocx,
      onExportPdf,
      isExportLoading,
      draftSelector,
    },
    ref
  ) {
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
        CitationExtension,
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
            // Auto-clear error after 5 seconds so next edit retries
            setTimeout(() => setSaveStatus("idle"), 5000);
          }
        }, 2000);
      },
      [onSave]
    );

    const handleTitleChange = useCallback(
      (newTitle: string) => {
        setTitle(newTitle);
        pendingTitleRef.current = newTitle;
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

    // Update all citation nodes when style changes
    const handleStyleChange = useCallback(
      (newStyle: CitationStyle) => {
        if (!editor || !onStyleChange) return;

        // Walk through document and update all citation node styles
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === "citation") {
            editor
              .chain()
              .setNodeSelection(pos)
              .updateAttributes("citation", { style: newStyle })
              .run();
          }
        });

        // Restore cursor to end
        editor.commands.focus("end");

        // Notify parent to persist the change
        onStyleChange(newStyle);
      },
      [editor, onStyleChange]
    );

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
      };
    }, []);

    // Expose insertCitation and setContent to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        insertCitation: (
          paperId: string,
          citationNumber: number,
          authorYear: string
        ) => {
          if (!editor) return;
          editor
            .chain()
            .focus()
            .insertContent({
              type: "citation",
              attrs: {
                paperId,
                citationNumber,
                authorYear,
                style: citationStyle,
              },
            })
            .run();
        },
        setContent: (markdownDraft: string) => {
          if (!editor) return;
          // Convert markdown-style draft to Tiptap-compatible HTML
          const html = markdownDraft
            .replace(/^## (.+)$/gm, "<h2>$1</h2>")
            .replace(/^### (.+)$/gm, "<h3>$1</h3>")
            .replace(/^---$/gm, "<hr>")
            .replace(/\n\n/g, "</p><p>")
            .replace(/^(?!<[hp]|<h[r23])(.+)/gm, "<p>$1</p>");
          editor.commands.setContent(html);
        },
        getText: () => {
          if (!editor) return "";
          return editor.getText();
        },
        getCitationPaperIds: () => {
          if (!editor) return [];
          const ids: string[] = [];
          editor.state.doc.descendants((node) => {
            if (node.type.name === "citation" && node.attrs.paperId) {
              ids.push(node.attrs.paperId);
            }
          });
          return ids;
        },
      }),
      [editor, citationStyle]
    );

    const wordCount = editor?.storage.characterCount.words() ?? 0;
    const charCount = editor?.storage.characterCount.characters() ?? 0;

    return (
      <div
        className={`flex flex-col bg-background ${
          isFullscreen ? "fixed inset-0 z-50" : "rounded-lg border shadow-sm"
        }`}
      >
        <EditorHeader
          title={title}
          onTitleChange={handleTitleChange}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          mode={mode}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          draftSelector={draftSelector}
        />

        <EditorToolbar
          editor={editor}
          onInsertCitation={onInsertCitation}
          citationStyle={citationStyle}
          onStyleChange={onStyleChange ? handleStyleChange : undefined}
          onCheckPlagiarism={onCheckPlagiarism}
          isPlagiarismLoading={isPlagiarismLoading}
          onCheckAiDetection={onCheckAiDetection}
          isAiDetectionLoading={isAiDetectionLoading}
          onExportDocx={onExportDocx}
          onExportPdf={onExportPdf}
          isExportLoading={isExportLoading}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl">
            <EditorContent editor={editor} />
          </div>
          <BibliographySection
            documentId={documentId}
            citationStyle={citationStyle}
          />
        </div>

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
);
