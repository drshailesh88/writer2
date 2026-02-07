"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus, FileText } from "lucide-react";

const modeLabels: Record<string, string> = {
  learn: "Learn",
  draft_guided: "Guided",
  draft_handsoff: "Hands-off",
};

interface DraftSelectorProps {
  currentDocumentId: string;
}

export function DraftSelector({ currentDocumentId }: DraftSelectorProps) {
  const router = useRouter();
  const documents = useQuery(api.documents.list, {});
  const createDocument = useMutation(api.documents.create);
  const [newDraftOpen, setNewDraftOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("Untitled Document");
  const [newMode, setNewMode] = useState<
    "learn" | "draft_guided" | "draft_handsoff"
  >("learn");
  const [newCitationStyle, setNewCitationStyle] = useState<
    "vancouver" | "apa" | "ama" | "chicago"
  >("vancouver");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateDraft = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const id = await createDocument({
        title: newTitle.trim() || "Untitled Document",
        mode: newMode,
        citationStyle: newCitationStyle,
      });
      setNewDraftOpen(false);
      setNewTitle("Untitled Document");
      router.push(`/editor/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create document";
      if (message.includes("limit") || message.includes("upgrade")) {
        setCreateError("You've reached your plan limit. Please upgrade to create more documents.");
      } else {
        setCreateError(message);
      }
    } finally {
      setCreating(false);
    }
  };

  const activeDocuments = (documents ?? []).filter(
    (d) => d.status !== "archived"
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] sm:min-h-[32px] gap-1 text-xs text-muted-foreground"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">My Drafts</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {activeDocuments.map((doc) => (
            <DropdownMenuItem
              key={doc._id}
              className={`min-h-[44px] flex items-center gap-2 cursor-pointer ${
                doc._id === currentDocumentId ? "bg-accent" : ""
              }`}
              onClick={() => {
                if (doc._id !== currentDocumentId) {
                  router.push(`/editor/${doc._id}`);
                }
              }}
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-sm truncate">{doc.title}</span>
                <span className="text-xs text-muted-foreground">
                  {doc.wordCount.toLocaleString()} words
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {modeLabels[doc.mode]}
              </Badge>
            </DropdownMenuItem>
          ))}

          {activeDocuments.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No drafts yet
            </div>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="min-h-[44px] cursor-pointer"
            onClick={() => setNewDraftOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Draft
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Draft Dialog */}
      <Dialog open={newDraftOpen} onOpenChange={setNewDraftOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Draft</DialogTitle>
            <DialogDescription>
              Start a new research document
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="draft-title">Title</Label>
              <Input
                id="draft-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Untitled Document"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft-mode">Writing Mode</Label>
              <Select
                value={newMode}
                onValueChange={(v) =>
                  setNewMode(v as "learn" | "draft_guided" | "draft_handsoff")
                }
              >
                <SelectTrigger id="draft-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learn">
                    Learn Mode — AI coaches you through writing
                  </SelectItem>
                  <SelectItem value="draft_guided">
                    Draft (Guided) — AI assists with your approval
                  </SelectItem>
                  <SelectItem value="draft_handsoff">
                    Draft (Hands-off) — AI generates autonomously
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft-citation">Citation Style</Label>
              <Select
                value={newCitationStyle}
                onValueChange={(v) =>
                  setNewCitationStyle(
                    v as "vancouver" | "apa" | "ama" | "chicago"
                  )
                }
              >
                <SelectTrigger id="draft-citation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vancouver">Vancouver (numeric)</SelectItem>
                  <SelectItem value="apa">APA (Author, Year)</SelectItem>
                  <SelectItem value="ama">AMA (numeric)</SelectItem>
                  <SelectItem value="chicago">Chicago (Author, Year)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {createError && (
            <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setNewDraftOpen(false); setCreateError(null); }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDraft} disabled={creating}>
              {creating ? "Creating..." : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
