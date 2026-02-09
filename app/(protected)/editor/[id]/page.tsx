"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { TiptapEditor, type TiptapEditorHandle } from "@/components/editor/tiptap-editor";
import { DraftSelector } from "@/components/editor/draft-selector";
import { LearnModePanel } from "@/components/editor/learn-mode-panel";
import { DraftModePanel } from "@/components/editor/draft-mode-panel";
import { usePlagiarismCheck, usePlagiarismUsage } from "@/lib/hooks/use-plagiarism-check";
import { useAiDetection } from "@/lib/hooks/use-ai-detection";
import type { PaperData } from "@/lib/bibliography";
import { TOKEN_COSTS } from "@/convex/usageTokens";

// Lazy-load heavy modals and panels (only needed on user action)
const CitationModal = lazy(() => import("@/components/editor/citation-modal").then(m => ({ default: m.CitationModal })));
const PlagiarismPanel = lazy(() => import("@/components/plagiarism/plagiarism-panel").then(m => ({ default: m.PlagiarismPanel })));
const SourceDetailModal = lazy(() => import("@/components/plagiarism/source-detail-modal").then(m => ({ default: m.SourceDetailModal })));
const AiDetectionPanel = lazy(() => import("@/components/ai-detection/ai-detection-panel").then(m => ({ default: m.AiDetectionPanel })));
const UpgradeModal = lazy(() => import("@/components/modals/upgrade-modal").then(m => ({ default: m.UpgradeModal })));
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

  // Plagiarism & AI Detection state
  const [plagiarismPanelOpen, setPlagiarismPanelOpen] = useState(false);
  const [aiDetectionPanelOpen, setAiDetectionPanelOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<{
    id: string;
    title: string;
    url: string;
    matchedWords: number;
    totalWords: number;
    similarity: number;
    matchedText: string;
  } | null>(null);

  const [isExportLoading, setIsExportLoading] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{
    feature: "plagiarism" | "aiDetection" | "export";
    open: boolean;
  }>({ feature: "plagiarism", open: false });

  // Plagiarism & AI Detection hooks
  const plagiarism = usePlagiarismCheck();
  const aiDetection = useAiDetection();
  const usage = usePlagiarismUsage();

  const document = useQuery(api.documents.get, {
    documentId: documentId as Id<"documents">,
  });
  const updateDocument = useMutation(api.documents.update);
  const insertCitationMutation = useMutation(api.citations.insert);
  const removeCitationMutation = useMutation(api.citations.remove);
  const deductTokens = useMutation(api.usageTokens.deductTokens);

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

      // Sync citations: remove orphaned Convex records for citations deleted from editor
      if (editorRef.current && citations) {
        const editorPaperIds = new Set(editorRef.current.getCitationPaperIds());
        for (const citation of citations) {
          if (!editorPaperIds.has(citation.paperId)) {
            removeCitationMutation({ citationId: citation._id }).catch(() => {});
          }
        }
      }
    },
    [documentId, updateDocument, citations, removeCitationMutation]
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <PanelRight className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Document not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This document may have been deleted or you don&apos;t have access.
          </p>
        </div>
        <Button variant="outline" className="min-h-[44px]" asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
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

  const handleCheckPlagiarism = useCallback(() => {
    const text = editorRef.current?.getText() ?? "";
    if (!text.trim()) return;

    // Check limit before submitting
    if (usage && usage.plagiarismUsed >= usage.plagiarismLimit) {
      setUpgradeModal({ feature: "plagiarism", open: true });
      return;
    }

    // Close AI detection panel if open (panel exclusivity)
    setAiDetectionPanelOpen(false);
    aiDetection.reset();

    setPlagiarismPanelOpen(true);
    plagiarism.submitCheck(text, documentId);
  }, [documentId, usage, plagiarism, aiDetection]);

  const handleCheckAiDetection = useCallback(() => {
    const text = editorRef.current?.getText() ?? "";
    if (!text.trim()) return;

    // Check limit before submitting
    if (usage && usage.aiDetectionUsed >= usage.aiDetectionLimit) {
      setUpgradeModal({ feature: "aiDetection", open: true });
      return;
    }

    // Close plagiarism panel if open (panel exclusivity)
    setPlagiarismPanelOpen(false);
    plagiarism.reset();

    setAiDetectionPanelOpen(true);
    aiDetection.submitCheck(text, documentId);
  }, [documentId, usage, plagiarism, aiDetection]);

  // Handle limit exceeded from hooks (async API response)
  const plagiarismLimitExceeded = plagiarism.limitExceeded;
  const plagiarismReset = plagiarism.reset;
  useEffect(() => {
    if (plagiarismLimitExceeded) {
      setUpgradeModal({ feature: "plagiarism", open: true });
      plagiarismReset();
    }
  }, [plagiarismLimitExceeded, plagiarismReset]);

  const aiDetectionLimitExceeded = aiDetection.limitExceeded;
  const aiDetectionReset = aiDetection.reset;
  useEffect(() => {
    if (aiDetectionLimitExceeded) {
      setUpgradeModal({ feature: "aiDetection", open: true });
      aiDetectionReset();
    }
  }, [aiDetectionLimitExceeded, aiDetectionReset]);

  const handleClosePlagiarismPanel = useCallback(() => {
    setPlagiarismPanelOpen(false);
    plagiarism.reset();
  }, [plagiarism]);

  const handleCloseAiDetectionPanel = useCallback(() => {
    setAiDetectionPanelOpen(false);
    aiDetection.reset();
  }, [aiDetection]);

  const handleExportDocx = useCallback(async () => {
    // Check subscription tier — free/none users cannot export
    const tier = usage?.tier ?? "free";
    if (tier === "free" || tier === "none") {
      setUpgradeModal({ feature: "export", open: true });
      return;
    }

    // Check for content
    const content = document?.content as Record<string, unknown> | undefined;
    if (!content) {
      setExportToast("Nothing to export");
      setTimeout(() => setExportToast(null), 3000);
      return;
    }

    // Wait for citation/paper data to finish loading
    if (citations === undefined || papers === undefined) {
      setExportToast("Loading bibliography data... Please try again in a moment.");
      setTimeout(() => setExportToast(null), 3000);
      return;
    }

    setIsExportLoading(true);
    try {
      // Deduct export tokens
      try {
        await deductTokens({ cost: TOKEN_COSTS.EXPORT });
      } catch {
        setIsExportLoading(false);
        setUpgradeModal({ feature: "export", open: true });
        return;
      }

      // Dynamic imports — docx/bibliography are heavy, load on demand
      const [{ tiptapToBlocks }, { exportAsDocx }, { generateBibliography }] = await Promise.all([
        import("@/lib/export/tiptap-to-blocks"),
        import("@/lib/export/docx-exporter"),
        import("@/lib/bibliography"),
      ]);

      const blocks = tiptapToBlocks(content);
      const citationStyle = document?.citationStyle ?? "vancouver";

      // Build bibliography from cited papers
      const citedPaperIds = new Set(
        (citations ?? []).map((c) => c.paperId)
      );
      const citedPapers: PaperData[] = (papers ?? [])
        .filter((p) => citedPaperIds.has(p._id))
        .map((p) => ({
          _id: p._id,
          title: p.title,
          authors: p.authors,
          journal: p.journal,
          year: p.year,
          doi: p.doi,
          url: p.url,
          metadata: p.metadata as PaperData["metadata"],
        }));

      const bibliography = generateBibliography(citedPapers, citationStyle as "vancouver" | "apa" | "ama" | "chicago");

      await exportAsDocx({
        title: document?.title ?? "Untitled",
        blocks,
        bibliography,
        citationStyle: citationStyle as "vancouver" | "apa" | "ama" | "chicago",
      });
    } catch (err) {
      console.error("DOCX export failed:", err);
      setExportToast("Export failed. Please try again.");
      setTimeout(() => setExportToast(null), 4000);
    } finally {
      setIsExportLoading(false);
    }
  }, [document, citations, papers, usage, deductTokens]);

  const handleExportPdf = useCallback(async () => {
    // Check subscription tier — free/none users cannot export
    const tier = usage?.tier ?? "free";
    if (tier === "free" || tier === "none") {
      setUpgradeModal({ feature: "export", open: true });
      return;
    }

    // Check for content
    const content = document?.content as Record<string, unknown> | undefined;
    if (!content) {
      setExportToast("Nothing to export");
      setTimeout(() => setExportToast(null), 3000);
      return;
    }

    // Wait for citation/paper data to finish loading
    if (citations === undefined || papers === undefined) {
      setExportToast("Loading bibliography data... Please try again in a moment.");
      setTimeout(() => setExportToast(null), 3000);
      return;
    }

    setIsExportLoading(true);
    try {
      // Deduct export tokens
      try {
        await deductTokens({ cost: TOKEN_COSTS.EXPORT });
      } catch {
        setIsExportLoading(false);
        setUpgradeModal({ feature: "export", open: true });
        return;
      }

      // Dynamic imports — jspdf/bibliography are heavy, load on demand
      const [{ tiptapToBlocks }, { exportAsPdf }, { generateBibliography }] = await Promise.all([
        import("@/lib/export/tiptap-to-blocks"),
        import("@/lib/export/pdf-exporter"),
        import("@/lib/bibliography"),
      ]);

      const blocks = tiptapToBlocks(content);
      const citationStyle = document?.citationStyle ?? "vancouver";

      // Build bibliography from cited papers
      const citedPaperIds = new Set(
        (citations ?? []).map((c) => c.paperId)
      );
      const citedPapers: PaperData[] = (papers ?? [])
        .filter((p) => citedPaperIds.has(p._id))
        .map((p) => ({
          _id: p._id,
          title: p.title,
          authors: p.authors,
          journal: p.journal,
          year: p.year,
          doi: p.doi,
          url: p.url,
          metadata: p.metadata as PaperData["metadata"],
        }));

      const bibliography = generateBibliography(citedPapers, citationStyle as "vancouver" | "apa" | "ama" | "chicago");

      await exportAsPdf({
        title: document?.title ?? "Untitled",
        blocks,
        bibliography,
        citationStyle: citationStyle as "vancouver" | "apa" | "ama" | "chicago",
      });
    } catch (err) {
      console.error("PDF export failed:", err);
      setExportToast("Export failed. Please try again.");
      setTimeout(() => setExportToast(null), 4000);
    } finally {
      setIsExportLoading(false);
    }
  }, [document, citations, papers, usage, deductTokens]);

  const sidebarContent = isLearnMode ? (
    <LearnModePanel
      documentId={documentId}
      topic={document.title || ""}
      currentStage={document.currentStage || "understand"}
      editorContent={getEditorText()}
      tier={usage?.tier ?? "free"}
      learnModeUsed={usage?.learnModeUsed ?? 0}
      learnModeLimit={usage?.learnModeLimit ?? 3}
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
          onCheckPlagiarism={handleCheckPlagiarism}
          isPlagiarismLoading={plagiarism.isLoading}
          onCheckAiDetection={handleCheckAiDetection}
          isAiDetectionLoading={aiDetection.isLoading}
          onExportDocx={handleExportDocx}
          onExportPdf={handleExportPdf}
          isExportLoading={isExportLoading}
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

      {/* Lazy-loaded panels and modals (Suspense with null fallback — panels have their own loading states) */}
      <Suspense fallback={null}>
        {/* Plagiarism panel (right side) */}
        {plagiarismPanelOpen && (
          <PlagiarismPanel
            results={plagiarism.result}
            isLoading={plagiarism.isLoading}
            onSourceClick={(source) => setSelectedSource(source)}
            onClose={handleClosePlagiarismPanel}
          />
        )}

        {/* AI Detection panel (right side) */}
        {aiDetectionPanelOpen && (
          <AiDetectionPanel
            results={aiDetection.result}
            isLoading={aiDetection.isLoading}
            onClose={handleCloseAiDetectionPanel}
          />
        )}

        {/* Citation modal */}
        {citationModalOpen && (
          <CitationModal
            open={citationModalOpen}
            onOpenChange={setCitationModalOpen}
            papers={papers ?? []}
            onSelect={handleCitationSelect}
          />
        )}

        {/* Source detail modal */}
        {selectedSource !== null && (
          <SourceDetailModal
            source={selectedSource}
            open={selectedSource !== null}
            onClose={() => setSelectedSource(null)}
          />
        )}

        {/* Upgrade modal */}
        {upgradeModal.open && (
          <UpgradeModal
            feature={upgradeModal.feature}
            currentUsage={
              upgradeModal.feature === "plagiarism"
                ? (usage?.plagiarismUsed ?? 0)
                : upgradeModal.feature === "aiDetection"
                  ? (usage?.aiDetectionUsed ?? 0)
                  : 0
            }
            limit={
              upgradeModal.feature === "plagiarism"
                ? (usage?.plagiarismLimit ?? 0)
                : upgradeModal.feature === "aiDetection"
                  ? (usage?.aiDetectionLimit ?? 0)
                  : 0
            }
            tier={usage?.tier ?? "free"}
            open={upgradeModal.open}
            onClose={() => setUpgradeModal((prev) => ({ ...prev, open: false }))}
          />
        )}
      </Suspense>

      {/* Export toast notification */}
      {exportToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-3.5 shadow-lg dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{exportToast}</p>
            <button
              onClick={() => setExportToast(null)}
              className="ml-2 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
