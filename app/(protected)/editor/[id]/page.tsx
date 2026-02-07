"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useRef, useState } from "react";
import { TiptapEditor, type TiptapEditorHandle } from "@/components/editor/tiptap-editor";
import { CitationModal } from "@/components/editor/citation-modal";
import { DraftSelector } from "@/components/editor/draft-selector";

export default function EditorPage() {
  const params = useParams();
  const documentId = params.id as string;
  const editorRef = useRef<TiptapEditorHandle>(null);
  const [citationModalOpen, setCitationModalOpen] = useState(false);

  const document = useQuery(api.documents.get, {
    documentId: documentId as Id<"documents">,
  });
  const updateDocument = useMutation(api.documents.update);
  const insertCitationMutation = useMutation(api.citations.insert);

  // Papers for citation selection
  const papers = useQuery(api.papers.list, {});

  // Existing citations for numbering
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

      // Insert citation node in editor
      editorRef.current.insertCitation(paperId, citationNumber, authorYear);

      // Save to citations table
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

  return (
    <div className="flex flex-col gap-0 -mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
      <TiptapEditor
        ref={editorRef}
        documentId={documentId}
        initialContent={document.content as Record<string, unknown> | undefined}
        initialTitle={document.title}
        mode={document.mode}
        citationStyle={document.citationStyle}
        onSave={handleSave}
        onInsertCitation={() => setCitationModalOpen(true)}
        draftSelector={<DraftSelector currentDocumentId={documentId} />}
      />

      <CitationModal
        open={citationModalOpen}
        onOpenChange={setCitationModalOpen}
        papers={papers ?? []}
        onSelect={handleCitationSelect}
      />
    </div>
  );
}
