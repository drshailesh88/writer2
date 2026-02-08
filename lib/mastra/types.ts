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

// ─── Learn Mode Types ───

export type LearnModeStage =
  | "understand"
  | "literature"
  | "outline"
  | "drafting"
  | "feedback";

export const LEARN_MODE_STAGES: {
  id: LearnModeStage;
  label: string;
  stepNumber: number;
}[] = [
  { id: "understand", label: "Understand Topic", stepNumber: 1 },
  { id: "literature", label: "Literature Review", stepNumber: 2 },
  { id: "outline", label: "Create Outline", stepNumber: 3 },
  { id: "drafting", label: "Write Draft", stepNumber: 4 },
  { id: "feedback", label: "Get Feedback", stepNumber: 5 },
];

export type FeedbackCategory =
  | "thesis_focus"
  | "evidence_reasoning"
  | "methodology_rigor"
  | "structure_organization"
  | "language_tone";

export const FEEDBACK_CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "thesis_focus",
    label: "Thesis & Focus",
    description: "Clarity of research question, hypothesis, and central argument",
  },
  {
    id: "evidence_reasoning",
    label: "Evidence & Reasoning",
    description: "Quality of citations, logical flow, and evidence-based claims",
  },
  {
    id: "methodology_rigor",
    label: "Methodology Rigor",
    description: "Study design, data collection, inclusion/exclusion criteria",
  },
  {
    id: "structure_organization",
    label: "Structure & Organization",
    description: "IMRAD adherence, paragraph flow, section transitions",
  },
  {
    id: "language_tone",
    label: "Language & Tone",
    description: "Academic register, conciseness, clarity, and grammar",
  },
];

export interface ConversationMessage {
  role: "coach" | "student";
  content: string;
  stage: LearnModeStage;
  timestamp: number;
}

export interface FeedbackItem {
  category: FeedbackCategory;
  suggestion: string;
  example?: string; // Example from published paper
  addressed: boolean;
}

// ─── Convex Workflow Run Record ───

export type WorkflowRunType = "draft_guided" | "draft_handsoff" | "learn";
export type WorkflowRunStatus = "running" | "suspended" | "completed" | "failed";

export interface WorkflowRunRecord {
  _id: string;
  userId: string;
  documentId: string;
  workflowType: WorkflowRunType;
  status: WorkflowRunStatus;
  currentStep: string | null;
  stepData: unknown | null;
  runObject: unknown | null;
  error: string | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface LearnModeState {
  sessionId: string;
  documentId: string;
  currentStage: LearnModeStage;
  conversationHistory: ConversationMessage[];
  feedbackItems: FeedbackItem[];
  currentFeedbackIndex: number;
}
