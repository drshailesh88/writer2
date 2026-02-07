"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useRef, useState } from "react";
import { TiptapEditor, type TiptapEditorHandle } from "@/components/editor/tiptap-editor";
import { CitationModal } from "@/components/editor/citation-modal";
import { DraftSelector } from "@/components/editor/draft-selector";
import { LearnModePanel } from "@/components/editor/learn-mode-panel";
import { DraftModePanel } from "@/components/editor/draft-mode-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PanelRight } from "lucide-react";

export default function EditorPage() {
  const params = useParams();
  const documentId = params.id as string;
  const editorRef = useRef<TiptapEditorHandle>(null);
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const document = useQuery(api.documents.get, {
    documentId: documentId as Id<"documents">,
  });
  const updateDocument = useMutation(api.documents.update);
  const insertCitationMutation = useMutation(api.citations.insert);

  const papers = useQuery(api.papers.list, {});
  const citations = useQuery(api.citations.listByDocument, {
    documentId: documentId as Id<"documents">,
  });

  const handleSave = useCallback(
    async (data: {
      content: Record<string, unknown>;
      wordCount: number;
      title?: string;
    }) => {
      await updateDocument({
        documentId: documentId as Id<"documents">,
        content: data.content,
        wordCount: data.wordCount,
        ...(data.title ? { title: data.title } : {}),
      });
    },
    [documentId, updateDocument]
  );

  const handleCitationSelect = useCallback(
    async (paperId: string) => {
      if (!editorRef.current || !document) return;

      const paper = papers?.find((p) => p._id === paperId);
      if (!paper) return;

      const citationNumber = (citations?.length ?? 0) + 1;
      const firstAuthor = paper.authors[0] || "Unknown";
      const authorYear = `${firstAuthor.split(" ").pop()}, ${paper.year ?? "n.d."}`;

      editorRef.current.insertCitation(paperId, citationNumber, authorYear);

      await insertCitationMutation({
        documentId: documentId as Id<"documents">,
        paperId: paperId as Id<"papers">,
        sectionName: "body",
        position: citationNumber,
        citationText: authorYear,
      });

      setCitationModalOpen(false);
    },
    [document, papers, citations, documentId, insertCitationMutation]
  );

  // Loading state
  if (document === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Loading document...</div>
      </div>
    );
  }

  // Not found
  if (document === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Document not found</div>
      </div>
    );
  }

  const isLearnMode = document.mode === "learn";
  const isDraftMode =
    document.mode === "draft_guided" || document.mode === "draft_handsoff";

  const handleDraftComplete = useCallback(
    (draft: string) => {
      if (editorRef.current) {
        editorRef.current.setContent(draft);
      }
    },
    []
  );

  const getEditorText = useCallback(() => {
    return editorRef.current?.getText() ?? "";
  }, []);

  const handleStyleChange = useCallback(
    async (style: "vancouver" | "apa" | "ama" | "chicago") => {
      await updateDocument({
        documentId: documentId as Id<"documents">,
        citationStyle: style,
      });
    },
    [documentId, updateDocument]
  );

  const sidebarContent = isLearnMode ? (
    <LearnModePanel
      documentId={documentId}
      topic={document.title || ""}
      currentStage={document.currentStage || "understand"}
      editorContent={getEditorText()}
    />
  ) : isDraftMode ? (
    <DraftModePanel
      mode={document.mode as "draft_guided" | "draft_handsoff"}
      documentId={documentId}
      onDraftComplete={handleDraftComplete}
    />
  ) : null;

  const sidebarToggle = (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => {
        // Desktop: toggle sidebar; Mobile: open sheet
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          setMobileSidebarOpen(true);
        } else {
          setSidebarOpen((prev) => !prev);
        }
      }}
      className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] shrink-0"
      aria-label="Toggle AI panel"
    >
      <PanelRight className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="flex gap-0 -mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
      {/* Editor area */}
      <div className="flex-1 min-w-0">
        <TiptapEditor
          ref={editorRef}
          documentId={documentId}
          initialContent={document.content as Record<string, unknown> | undefined}
          initialTitle={document.title}
          mode={document.mode}
          citationStyle={document.citationStyle}
          onSave={handleSave}
          onInsertCitation={() => setCitationModalOpen(true)}
          onStyleChange={handleStyleChange}
          draftSelector={
            <div className="flex items-center gap-1">
              <DraftSelector currentDocumentId={documentId} />
              {sidebarContent && sidebarToggle}
            </div>
          }
        />
      </div>

      {/* Desktop sidebar */}
      {sidebarContent && sidebarOpen && (
        <div className="hidden lg:flex lg:w-80 lg:shrink-0 lg:border-l lg:bg-background">
          <div className="w-full">{sidebarContent}</div>
        </div>
      )}

      {/* Mobile sidebar (Sheet) */}
      {sidebarContent && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="right" className="w-80 p-0">
            <SheetTitle className="sr-only">AI Panel</SheetTitle>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Citation modal */}
      <CitationModal
        open={citationModalOpen}
        onOpenChange={setCitationModalOpen}
        papers={papers ?? []}
        onSelect={handleCitationSelect}
      />
    </div>
  );
}
