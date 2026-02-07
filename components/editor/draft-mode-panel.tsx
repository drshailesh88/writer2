"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DisclaimerModal } from "./disclaimer-modal";
import { useDraftWorkflow } from "@/lib/hooks/use-draft-workflow";
import type { Outline, ApprovedPaper } from "@/lib/mastra/types";
import {
  PenTool,
  Search,
  FileText,
  CheckCircle2,
  ListChecks,
  Circle,
  Loader2,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    id: 1,
    label: "Define Research Scope",
    description: "Specify your topic and research question",
    icon: Search,
  },
  {
    id: 2,
    label: "Find Relevant Papers",
    description: "AI searches and recommends papers for your bibliography",
    icon: FileText,
  },
  {
    id: 3,
    label: "Create Outline",
    description: "AI generates IMRAD outline based on your topic",
    icon: ListChecks,
  },
  {
    id: 4,
    label: "Write Draft",
    description: "AI writes each section, citing from approved papers only",
    icon: PenTool,
  },
  {
    id: 5,
    label: "Review & Finalize",
    description: "Review AI output, make edits, check quality",
    icon: CheckCircle2,
  },
];

interface DraftModePanelProps {
  mode: "draft_guided" | "draft_handsoff";
  documentId: string;
  onDraftComplete?: (draft: string) => void;
}

export function DraftModePanel({
  mode,
  documentId,
  onDraftComplete,
}: DraftModePanelProps) {
  const isHandsOff = mode === "draft_handsoff";
  const [topic, setTopic] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const workflow = useDraftWorkflow(documentId);

  const handleStart = () => {
    if (!topic.trim()) return;
    if (isHandsOff) {
      setShowDisclaimer(true);
    } else {
      workflow.startWorkflow(topic.trim(), mode);
    }
  };

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    workflow.startWorkflow(topic.trim(), mode);
  };

  const handleApproveOutline = () => {
    workflow.resumeWorkflow({ approved: true, editedOutline: workflow.outline });
  };

  const handleApprovePapers = () => {
    workflow.resumeWorkflow({ approved: true, approvedPapers: workflow.papersBySection });
  };

  const handleApproveDraft = () => {
    workflow.resumeWorkflow({ approved: true, editedDrafts: workflow.sectionDrafts });
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  // When draft completes, notify parent
  useEffect(() => {
    if (workflow.status === "completed" && workflow.completeDraft && onDraftComplete) {
      onDraftComplete(workflow.completeDraft);
    }
  }, [workflow.status, workflow.completeDraft, onDraftComplete]);

  const isIdle = workflow.status === "idle";
  const currentStep = workflow.currentStep;

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-sky-600" />
          <span className="text-sm font-semibold">
            {isHandsOff ? "Hands-off Draft" : "Guided Draft"}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {isHandsOff ? "Autonomous" : "Collaborative"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {isHandsOff
            ? "AI generates your draft autonomously"
            : "AI assists at each step with your approval"}
        </p>
      </div>

      {/* Hands-off disclaimer banner — shown in all states except completed */}
      {isHandsOff && workflow.status !== "completed" && (
        <div className="border-b bg-amber-50/50 px-4 py-2 dark:bg-amber-950/20">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
            This draft is AI-generated and MUST be reviewed before submission.
            You are solely responsible for submitted content.
          </p>
        </div>
      )}

      {/* Error banner */}
      {workflow.error && (
        <div className="border-b bg-red-50/50 px-4 py-2 dark:bg-red-950/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-red-700 dark:text-red-400 leading-relaxed">
              {workflow.error}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 text-[11px]"
            onClick={workflow.reset}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Start Over
          </Button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Topic input (only when idle) */}
        {isIdle && (
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Research Topic
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. "Laparoscopic vs open appendectomy outcomes"'
              className="min-h-[44px] text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>
        )}

        {/* Workflow steps */}
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Workflow
        </p>
        <div className="space-y-3">
          {WORKFLOW_STEPS.map((step) => {
            const isComplete = step.id < currentStep;
            const isActive = step.id === currentStep;
            const isProcessing = isActive && workflow.isLoading;

            return (
              <div
                key={step.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isActive
                    ? "border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20"
                    : isComplete
                      ? "border-transparent bg-muted/30"
                      : "border-transparent"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : isProcessing ? (
                      <Loader2 className="h-4 w-4 text-sky-600 animate-spin" />
                    ) : isActive ? (
                      <step.icon className="h-4 w-4 text-sky-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        isComplete
                          ? "text-muted-foreground line-through"
                          : isActive
                            ? "font-medium"
                            : "text-muted-foreground"
                      }`}
                    >
                      Step {step.id}: {step.label}
                    </span>
                    {isActive && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isProcessing ? "Working..." : step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Inline content for active steps */}
                {isActive && !isHandsOff && renderStepContent(step.id)}
              </div>
            );
          })}
        </div>

        {/* Completed state */}
        {workflow.status === "completed" && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-900 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                Draft Complete
              </span>
            </div>
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
              Your draft has been inserted into the editor. Review and edit as needed.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-[11px]"
              onClick={workflow.reset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Start New Draft
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Action footer */}
      <div className="p-3">
        {isIdle ? (
          <Button
            className="w-full min-h-[44px]"
            onClick={handleStart}
            disabled={!topic.trim()}
          >
            {isHandsOff ? "Start Autonomous Draft" : "Start Guided Workflow"}
          </Button>
        ) : workflow.isLoading ? (
          <Button className="w-full min-h-[44px]" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </Button>
        ) : workflow.status === "completed" ? (
          <Button className="w-full min-h-[44px]" variant="outline" onClick={workflow.reset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Start New Draft
          </Button>
        ) : null}
      </div>

      {/* Disclaimer modal for hands-off mode */}
      <DisclaimerModal
        open={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onDecline={() => setShowDisclaimer(false)}
      />
    </div>
  );

  // Render step-specific content (approve/reject UI, outline preview, etc.)
  function renderStepContent(stepId: number) {
    switch (stepId) {
      case 3: // Outline approval
        if (workflow.status !== "awaiting-outline-approval" || !workflow.outline) return null;
        return (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium">Generated Outline:</p>
            <div className="rounded border bg-background p-2 space-y-1 max-h-48 overflow-y-auto">
              {workflow.outline.sections.map((section) => (
                <div key={section.title}>
                  <button
                    className="flex items-center gap-1 text-xs font-medium w-full text-left hover:text-sky-600"
                    onClick={() => toggleSection(section.title)}
                  >
                    {expandedSections.has(section.title) ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {section.title}
                  </button>
                  {expandedSections.has(section.title) && (
                    <ul className="ml-5 mt-0.5 space-y-0.5">
                      {section.subsections.map((sub) => (
                        <li key={sub} className="text-[11px] text-muted-foreground">
                          • {sub}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="min-h-[32px] text-xs" onClick={handleApproveOutline}>
                Approve Outline
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[32px] text-xs"
                onClick={() => workflow.resumeWorkflow({ approved: false })}
              >
                Regenerate
              </Button>
            </div>
          </div>
        );

      case 2: // Paper approval
        if (workflow.status !== "awaiting-paper-approval" || !workflow.papersBySection) return null;
        return (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium">Found Papers:</p>
            <div className="rounded border bg-background p-2 space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(workflow.papersBySection).map(([section, papers]) => (
                <div key={section}>
                  <button
                    className="flex items-center gap-1 text-xs font-medium w-full text-left hover:text-sky-600"
                    onClick={() => toggleSection(section)}
                  >
                    {expandedSections.has(section) ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {section}
                    <Badge variant="secondary" className="text-[9px] ml-1">
                      {papers.length}
                    </Badge>
                  </button>
                  {expandedSections.has(section) && (
                    <ul className="ml-5 mt-1 space-y-1">
                      {papers.map((paper: ApprovedPaper, i: number) => (
                        <li key={paper.externalId || i} className="text-[11px] text-muted-foreground">
                          {paper.title}
                          {paper.year && ` (${paper.year})`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="min-h-[32px] text-xs" onClick={handleApprovePapers}>
                Approve Papers
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[32px] text-xs"
                onClick={() => workflow.resumeWorkflow({ approved: false })}
              >
                Search Again
              </Button>
            </div>
          </div>
        );

      case 4: // Draft review
        if (workflow.status !== "awaiting-draft-review" || !workflow.sectionDrafts) return null;
        return (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium">Draft Sections:</p>
            <div className="rounded border bg-background p-2 space-y-2 max-h-60 overflow-y-auto">
              {workflow.sectionDrafts.map((section) => (
                <div key={section.sectionTitle}>
                  <button
                    className="flex items-center gap-1 text-xs font-medium w-full text-left hover:text-sky-600"
                    onClick={() => toggleSection(section.sectionTitle)}
                  >
                    {expandedSections.has(section.sectionTitle) ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {section.sectionTitle}
                  </button>
                  {expandedSections.has(section.sectionTitle) && (
                    <p className="ml-5 mt-1 text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-6">
                      {section.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="min-h-[32px] text-xs" onClick={handleApproveDraft}>
                Insert into Editor
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[32px] text-xs"
                onClick={() => workflow.resumeWorkflow({ approved: false })}
              >
                Rewrite
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}
