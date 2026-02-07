// Shared types for Draft Mode workflows

export interface OutlineSection {
  title: string;
  subsections: string[];
}

export interface Outline {
  sections: OutlineSection[];
}

export interface ApprovedPaper {
  externalId: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  abstract: string | null;
  doi: string | null;
}

export interface SectionDraft {
  sectionTitle: string;
  content: string;
  citations: number[]; // indices into approvedPapers array
}

export interface WorkflowState {
  topic: string;
  currentStep: number; // 1-5
  outline: Outline | null;
  papersBySection: Record<string, ApprovedPaper[]>;
  approvedPapers: ApprovedPaper[];
  sectionDrafts: SectionDraft[];
  completeDraft: string | null;
  error: string | null;
}

// Workflow step labels for UI
export const WORKFLOW_STEP_LABELS: Record<number, string> = {
  1: "Define Research Scope",
  2: "Find Relevant Papers",
  3: "Create Outline",
  4: "Write Draft",
  5: "Review & Finalize",
};
