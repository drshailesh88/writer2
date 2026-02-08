"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { PdfViewerModal } from "@/components/library/pdf-viewer-modal";
import {
  Search,
  Plus,
  Upload,
  Library,
  FolderOpen,
  LayoutGrid,
  LayoutList,
  ExternalLink,
  Trash2,
  FolderInput,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Loader2,
  SlidersHorizontal,
  MoreHorizontal,
  Pencil,
  FileText,
} from "lucide-react";

/* ── Source badge config ── */
const SOURCE_STYLES: Record<
  string,
  { label: string; cls: string }
> = {
  pubmed: {
    label: "PubMed",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
  semantic_scholar: {
    label: "Semantic Scholar",
    cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  },
  openalex: {
    label: "OpenAlex",
    cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
  },
  uploaded: {
    label: "Uploaded",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
};

/* ── Sort options ── */
type SortKey = "date_added" | "year" | "title" | "journal";

function sortPapers(
  papers: Doc<"papers">[],
  sortKey: SortKey
): Doc<"papers">[] {
  const sorted = [...papers];
  switch (sortKey) {
    case "date_added":
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case "year":
      return sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    case "title":
      return sorted.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    case "journal":
      return sorted.sort((a, b) =>
        (a.journal ?? "").localeCompare(b.journal ?? "", undefined, {
          sensitivity: "base",
        })
      );
    default:
      return sorted;
  }
}

/* ── Library Paper Card ── */
function LibraryPaperCard({
  paper,
  collections,
  onRemove,
  onMove,
  onViewPdf,
}: {
  paper: Doc<"papers">;
  collections: Doc<"collections">[];
  onRemove: (id: Id<"papers">) => void;
  onMove: (paperId: Id<"papers">, collectionId: Id<"collections"> | undefined) => void;
  onViewPdf: (paper: Doc<"papers">) => void;
}) {
  const [showAbstract, setShowAbstract] = useState(false);

  const authorDisplay =
    paper.authors.length > 3
      ? `${paper.authors.slice(0, 3).join(", ")} et al.`
      : paper.authors.join(", ");

  const abstractPreview =
    paper.abstract && paper.abstract.length > 150
      ? `${paper.abstract.slice(0, 150)}...`
      : paper.abstract;

  const source = SOURCE_STYLES[paper.source] ?? SOURCE_STYLES.uploaded;
  const paperCollection = collections.find((c) => c._id === paper.collectionId);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        {/* Title */}
        <h3 className="mb-2 text-sm font-semibold leading-snug sm:text-base">
          {paper.url ? (
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              {paper.title}
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          ) : (
            paper.title
          )}
        </h3>

        {/* Authors + Journal + Year */}
        <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
          {authorDisplay}
          {paper.journal && (
            <>
              {" "}
              &middot;{" "}
              <span className="italic">{paper.journal}</span>
            </>
          )}
          {paper.year && <> &middot; {paper.year}</>}
        </p>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {paper.isOpenAccess && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              Open Access
            </Badge>
          )}
          <Badge variant="secondary" className={source.cls}>
            {source.label}
          </Badge>
          {paperCollection && (
            <Badge variant="outline" className="text-xs">
              {paperCollection.name}
            </Badge>
          )}
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <div className="mb-3">
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {showAbstract ? paper.abstract : abstractPreview}
            </p>
            {paper.abstract.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto min-h-[44px] p-1 text-xs text-primary sm:min-h-0 sm:p-0"
                onClick={() => setShowAbstract(!showAbstract)}
              >
                {showAbstract ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    Hide Abstract
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" />
                    View Full Abstract
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* DOI */}
        {paper.doi && (
          <p className="mb-3 text-xs text-muted-foreground">
            DOI:{" "}
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {paper.doi}
            </a>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          {paper.pdfFileId && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] gap-1.5 text-xs sm:min-h-0"
              onClick={() => onViewPdf(paper)}
            >
              <FileText className="h-3.5 w-3.5" />
              View PDF
            </Button>
          )}
          {paper.url && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] gap-1.5 text-xs sm:min-h-0"
              asChild
            >
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Original
              </a>
            </Button>
          )}

          {/* Move to collection */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] gap-1.5 text-xs sm:min-h-0"
              >
                <FolderInput className="h-3.5 w-3.5" />
                Move
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                className="min-h-[44px] cursor-pointer"
                onClick={() => onMove(paper._id, undefined)}
              >
                No collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {collections.map((c) => (
                <DropdownMenuItem
                  key={c._id}
                  className="min-h-[44px] cursor-pointer"
                  onClick={() => onMove(paper._id, c._id)}
                >
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] gap-1.5 text-xs text-destructive hover:text-destructive sm:min-h-0"
            onClick={() => onRemove(paper._id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Loading skeleton ── */
function PaperCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <Skeleton className="mb-3 h-5 w-3/4" />
        <Skeleton className="mb-2 h-4 w-1/2" />
        <div className="mb-3 flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

/* ── Collections sidebar content (shared between desktop & mobile) ── */
function CollectionsList({
  collections,
  paperCounts,
  totalPapers,
  activeCollection,
  onSelect,
  onNewCollection,
  onRenameCollection,
  onDeleteCollection,
}: {
  collections: Doc<"collections">[] | undefined;
  paperCounts: Record<string, number>;
  totalPapers: number;
  activeCollection: string | null;
  onSelect: (id: string | null) => void;
  onNewCollection: () => void;
  onRenameCollection: (collection: Doc<"collections">) => void;
  onDeleteCollection: (collection: Doc<"collections">) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Collections
      </p>

      {/* All Papers */}
      <button
        onClick={() => onSelect(null)}
        className={`flex min-h-[44px] items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          activeCollection === null
            ? "border-l-2 border-l-primary bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <span className="flex items-center gap-2">
          <Library className="h-4 w-4" />
          All Papers
        </span>
        <Badge variant="secondary" className="font-mono text-[10px]">
          {totalPapers}
        </Badge>
      </button>

      {/* User collections */}
      {collections === undefined ? (
        <div className="space-y-2 px-3 py-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        collections.map((c) => (
          <div
            key={c._id}
            className={`group flex min-h-[44px] items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              activeCollection === c._id
                ? "border-l-2 border-l-primary bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <button
              onClick={() => onSelect(c._id)}
              className="flex min-w-0 flex-1 items-center gap-2 truncate"
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{c.name}</span>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="secondary" className="font-mono text-[10px]">
                {paperCounts[c._id] ?? 0}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span className="sr-only">Collection actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="min-h-[44px] cursor-pointer gap-2"
                    onClick={() => onRenameCollection(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="min-h-[44px] cursor-pointer gap-2 text-destructive focus:text-destructive"
                    onClick={() => onDeleteCollection(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}

      {/* New Collection button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 min-h-[44px] justify-start gap-2 text-muted-foreground"
        onClick={onNewCollection}
      >
        <Plus className="h-4 w-4" />
        New Collection
      </Button>
    </div>
  );
}

/* ── Main Page ── */
export default function LibraryPage() {
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date_added");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Rename/delete collection state
  const [renameTarget, setRenameTarget] = useState<Doc<"collections"> | null>(null);
  const [renameName, setRenameName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"collections"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // PDF viewer state
  const [pdfViewerPaper, setPdfViewerPaper] = useState<Doc<"papers"> | null>(null);

  // Queries
  const allPapers = useQuery(api.papers.list, {});
  const collectionPapers = useQuery(
    api.papers.list,
    activeCollection
      ? { collectionId: activeCollection as Id<"collections"> }
      : "skip"
  );
  const collections = useQuery(api.collections.list);
  const paperCount = useQuery(api.papers.count);

  // Mutations
  const createCollection = useMutation(api.collections.create);
  const updateCollection = useMutation(api.collections.update);
  const removeCollection = useMutation(api.collections.remove);
  const removePaper = useMutation(api.papers.remove);
  const updatePaper = useMutation(api.papers.update);
  const savePaper = useMutation(api.papers.save);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Derive paper counts per collection
  const paperCounts = useMemo(() => {
    if (!allPapers) return {};
    const counts: Record<string, number> = {};
    for (const p of allPapers) {
      if (p.collectionId) {
        counts[p.collectionId] = (counts[p.collectionId] ?? 0) + 1;
      }
    }
    return counts;
  }, [allPapers]);

  // Active paper list
  const activePapers = activeCollection ? collectionPapers : allPapers;

  // Filter + sort
  const displayPapers = useMemo(() => {
    if (!activePapers) return undefined;

    let filtered = activePapers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = activePapers.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)) ||
          (p.journal && p.journal.toLowerCase().includes(q)) ||
          (p.abstract && p.abstract.toLowerCase().includes(q))
      );
    }

    return sortPapers(filtered, sortKey);
  }, [activePapers, searchQuery, sortKey]);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const FREE_TIER_PAPER_LIMIT = 50;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    setUploadError(null);

    // Validate file type
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size exceeds 50MB limit.");
      return;
    }

    // Check paper count limit for free tier
    if (paperCount !== undefined && paperCount >= FREE_TIER_PAPER_LIMIT) {
      setUploadError(
        `Library limit reached (${FREE_TIER_PAPER_LIMIT} papers). Upgrade to add more.`
      );
      return;
    }

    setIsUploading(true);
    try {
      // 1. Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // 2. Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      // 3. Use filename (minus extension) as title
      const title = file.name.replace(/\.pdf$/i, "");

      // 4. Create paper record, then attach PDF
      const paperId = await savePaper({
        externalId: `upload:${storageId}`,
        source: "uploaded" as const,
        title,
        authors: [],
        isOpenAccess: false,
      });

      // 5. Attach the uploaded PDF to the paper
      if (paperId) {
        await updatePaper({ paperId, pdfFileId: storageId });
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || isCreatingCollection) return;
    setIsCreatingCollection(true);
    try {
      await createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
      });
      setNewCollectionName("");
      setNewCollectionDescription("");
      setShowNewCollectionDialog(false);
    } catch {
      // Convex handles error display in dev
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleRemovePaper = async (paperId: Id<"papers">) => {
    try {
      await removePaper({ paperId });
    } catch {
      // handled by Convex
    }
  };

  const handleMovePaper = async (
    paperId: Id<"papers">,
    collectionId: Id<"collections"> | undefined
  ) => {
    try {
      await updatePaper({ paperId, collectionId });
    } catch {
      // handled by Convex
    }
  };

  const handleRenameCollection = async () => {
    if (!renameTarget || !renameName.trim() || isRenaming) return;
    setIsRenaming(true);
    try {
      await updateCollection({
        collectionId: renameTarget._id,
        name: renameName.trim(),
      });
      setRenameTarget(null);
      setRenameName("");
    } catch {
      // handled by Convex
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await removeCollection({ collectionId: deleteTarget._id });
      // If we were viewing the deleted collection, go back to all
      if (activeCollection === deleteTarget._id) {
        setActiveCollection(null);
      }
      setDeleteTarget(null);
    } catch {
      // handled by Convex
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCollectionSelect = (id: string | null) => {
    setActiveCollection(id);
    setMobileCollectionsOpen(false);
  };

  const isLoading = allPapers === undefined;
  const totalPapers = allPapers?.length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalPapers} paper{totalPapers !== 1 ? "s" : ""} saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            className="min-h-[44px] gap-2"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : "Upload PDF"}
          </Button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <CollectionsList
            collections={collections}
            paperCounts={paperCounts}
            totalPapers={totalPapers}
            activeCollection={activeCollection}
            onSelect={handleCollectionSelect}
            onNewCollection={() => setShowNewCollectionDialog(true)}
            onRenameCollection={(c) => {
              setRenameTarget(c);
              setRenameName(c.name);
            }}
            onDeleteCollection={(c) => setDeleteTarget(c)}
          />
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Mobile collections toggle */}
            <div className="lg:hidden">
              <Sheet
                open={mobileCollectionsOpen}
                onOpenChange={setMobileCollectionsOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] gap-1.5"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Collections
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetTitle className="sr-only">Collections</SheetTitle>
                  <div className="pt-6">
                    <CollectionsList
                      collections={collections}
                      paperCounts={paperCounts}
                      totalPapers={totalPapers}
                      activeCollection={activeCollection}
                      onSelect={handleCollectionSelect}
                      onNewCollection={() => {
                        setMobileCollectionsOpen(false);
                        setShowNewCollectionDialog(true);
                      }}
                      onRenameCollection={(c) => {
                        setMobileCollectionsOpen(false);
                        setRenameTarget(c);
                        setRenameName(c.name);
                      }}
                      onDeleteCollection={(c) => {
                        setMobileCollectionsOpen(false);
                        setDeleteTarget(c);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[44px] pl-9 sm:min-h-0"
              />
            </div>

            {/* Sort */}
            <Select
              value={sortKey}
              onValueChange={(v) => setSortKey(v as SortKey)}
            >
              <SelectTrigger className="min-h-[44px] w-[150px] text-xs sm:min-h-0">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_added">Date Added</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="title">A &ndash; Z</SelectItem>
                <SelectItem value="journal">Journal</SelectItem>
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="hidden items-center gap-0.5 rounded-md border p-0.5 sm:flex">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active collection label */}
          {activeCollection && collections && (
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {collections.find((c) => c._id === activeCollection)?.name ??
                  "Collection"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto min-h-[44px] text-xs text-muted-foreground sm:min-h-0"
                onClick={() => setActiveCollection(null)}
              >
                View All
              </Button>
            </div>
          )}

          {/* Paper list */}
          {isLoading || displayPapers === undefined ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2"
                  : "space-y-3"
              }
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <PaperCardSkeleton key={i} />
              ))}
            </div>
          ) : displayPapers.length === 0 ? (
            <Card className="mt-4">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">
                  {searchQuery
                    ? "No matching papers"
                    : activeCollection
                      ? "No papers in this collection"
                      : "No papers saved yet"}
                </h3>
                <p className="mt-1.5 max-w-[280px] text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term."
                    : activeCollection
                      ? "Move papers here from your library."
                      : "Search papers to add them to your library."}
                </p>
                {!searchQuery && !activeCollection && (
                  <Button variant="outline" className="mt-4 min-h-[44px]" asChild>
                    <a href="/search">Search Papers</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2"
                  : "space-y-3"
              }
            >
              {displayPapers.map((paper) => (
                <LibraryPaperCard
                  key={paper._id}
                  paper={paper}
                  collections={collections ?? []}
                  onRemove={handleRemovePaper}
                  onMove={handleMovePaper}
                  onViewPdf={setPdfViewerPaper}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Collection Dialog */}
      <Dialog
        open={showNewCollectionDialog}
        onOpenChange={setShowNewCollectionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
            <DialogDescription>
              Create a collection to organize your papers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="collection-name"
                className="mb-1.5 block text-sm font-medium"
              >
                Name
              </label>
              <Input
                id="collection-name"
                placeholder="e.g. Thesis Chapter 1"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="min-h-[44px]"
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCollection();
                }}
              />
            </div>
            <div>
              <label
                htmlFor="collection-desc"
                className="mb-1.5 block text-sm font-medium"
              >
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="collection-desc"
                placeholder="Brief description..."
                value={newCollectionDescription}
                onChange={(e) =>
                  setNewCollectionDescription(e.target.value)
                }
                className="min-h-[44px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => setShowNewCollectionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="min-h-[44px]"
              disabled={!newCollectionName.trim() || isCreatingCollection}
              onClick={handleCreateCollection}
            >
              {isCreatingCollection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Collection Dialog */}
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
            <DialogDescription>
              Enter a new name for &ldquo;{renameTarget?.name}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Collection name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              className="min-h-[44px]"
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameCollection();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => {
                setRenameTarget(null);
                setRenameName("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="min-h-[44px]"
              disabled={!renameName.trim() || isRenaming}
              onClick={handleRenameCollection}
            >
              {isRenaming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        pdfFileId={pdfViewerPaper?.pdfFileId ?? null}
        title={pdfViewerPaper?.title ?? ""}
        open={pdfViewerPaper !== null}
        onOpenChange={(open) => {
          if (!open) setPdfViewerPaper(null);
        }}
      />

      {/* Delete Collection Confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;?
              {deleteTarget && (paperCounts[deleteTarget._id] ?? 0) > 0 && (
                <>
                  {" "}
                  The {paperCounts[deleteTarget._id]} paper
                  {(paperCounts[deleteTarget._id] ?? 0) !== 1 ? "s" : ""} in
                  this collection will be moved to &ldquo;All Papers&rdquo;.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px]"
              disabled={isDeleting}
              onClick={handleDeleteCollection}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
