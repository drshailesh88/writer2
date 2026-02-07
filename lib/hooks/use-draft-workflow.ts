"use client";

import { useState, useCallback } from "react";
import type { Outline, ApprovedPaper, SectionDraft } from "../mastra/types";

export type DraftWorkflowStatus =
  | "idle"
  | "starting"
  | "generating-outline"
  | "awaiting-outline-approval"
  | "finding-papers"
  | "awaiting-paper-approval"
  | "writing-sections"
  | "awaiting-draft-review"
  | "combining"
  | "completed"
  | "error";

interface DraftWorkflowState {
  status: DraftWorkflowStatus;
  currentStep: number;
  outline: Outline | null;
  papersBySection: Record<string, ApprovedPaper[]> | null;
  sectionDrafts: SectionDraft[] | null;
  completeDraft: string | null;
  suspendedStep: string | null;
  error: string | null;
}

const STEP_MAP: Record<string, number> = {
  "generate-outline": 3,
  "find-papers": 2,
  "write-sections": 4,
  "combine-draft": 5,
};

export function useDraftWorkflow(documentId: string) {
  const [state, setState] = useState<DraftWorkflowState>({
    status: "idle",
    currentStep: 1,
    outline: null,
    papersBySection: null,
    sectionDrafts: null,
    completeDraft: null,
    suspendedStep: null,
    error: null,
  });

  const startWorkflow = useCallback(
    async (topic: string, mode: "draft_guided" | "draft_handsoff") => {
      setState((prev) => ({
        ...prev,
        status: "starting",
        currentStep: 1,
        error: null,
      }));

      try {
        const res = await fetch("/api/draft/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, mode, documentId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to start workflow");
        }

        const data = await res.json();
        handleWorkflowResponse(data, mode);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "Failed to start workflow",
        }));
      }
    },
    [documentId]
  );

  const resumeWorkflow = useCallback(
    async (resumeData: Record<string, unknown>) => {
      if (!state.suspendedStep) return;

      const previousStatus = state.status;
      setState((prev) => ({
        ...prev,
        status: getProgressStatus(prev.suspendedStep!),
        error: null,
      }));

      try {
        const res = await fetch("/api/draft/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            stepId: state.suspendedStep,
            resumeData,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to resume workflow");
        }

        const data = await res.json();
        handleWorkflowResponse(data, "draft_guided");
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: previousStatus,
          error: err instanceof Error ? err.message : "Failed to resume workflow",
        }));
      }
    },
    [documentId, state.suspendedStep]
  );

  const handleWorkflowResponse = useCallback(
    (data: Record<string, unknown>, mode: string) => {
      if (data.status === "suspended") {
        const stepId = data.suspendedStep as string;
        const payload = data.suspendPayload as Record<string, unknown> | null;
        const step = STEP_MAP[stepId] || 1;

        setState((prev) => ({
          ...prev,
          currentStep: step,
          suspendedStep: stepId,
          status: getAwaitingStatus(stepId),
          ...(stepId === "generate-outline" && payload?.outline
            ? { outline: payload.outline as Outline }
            : {}),
          ...(stepId === "find-papers" && payload?.papersBySection
            ? { papersBySection: payload.papersBySection as Record<string, ApprovedPaper[]> }
            : {}),
          ...(stepId === "write-sections" && payload?.sectionDrafts
            ? { sectionDrafts: payload.sectionDrafts as SectionDraft[] }
            : {}),
        }));
      } else if (data.status === "completed") {
        setState((prev) => ({
          ...prev,
          status: "completed",
          currentStep: 5,
          completeDraft: data.completeDraft as string | null,
          suspendedStep: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: `Unexpected workflow status: ${data.status}`,
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      currentStep: 1,
      outline: null,
      papersBySection: null,
      sectionDrafts: null,
      completeDraft: null,
      suspendedStep: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    startWorkflow,
    resumeWorkflow,
    reset,
    isLoading:
      state.status === "starting" ||
      state.status === "generating-outline" ||
      state.status === "finding-papers" ||
      state.status === "writing-sections" ||
      state.status === "combining",
  };
}

function getAwaitingStatus(stepId: string): DraftWorkflowStatus {
  switch (stepId) {
    case "generate-outline":
      return "awaiting-outline-approval";
    case "find-papers":
      return "awaiting-paper-approval";
    case "write-sections":
      return "awaiting-draft-review";
    default:
      return "idle";
  }
}

function getProgressStatus(stepId: string): DraftWorkflowStatus {
  switch (stepId) {
    case "generate-outline":
      return "finding-papers";
    case "find-papers":
      return "writing-sections";
    case "write-sections":
      return "combining";
    default:
      return "starting";
  }
}
