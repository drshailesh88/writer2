"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PenTool,
  Search,
  FileText,
  CheckCircle2,
  ListChecks,
  Circle,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    id: 1,
    label: "Define Research Scope",
    description: "Specify your topic, research question, and target journal",
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
    description: "AI generates IMRAD outline based on your papers",
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
  currentStep?: number;
}

export function DraftModePanel({
  mode,
  currentStep = 1,
}: DraftModePanelProps) {
  const isHandsOff = mode === "draft_handsoff";

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

      {/* Hands-off disclaimer */}
      {isHandsOff && (
        <div className="border-b bg-amber-50/50 px-4 py-2 dark:bg-amber-950/20">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
            This draft is AI-generated and MUST be reviewed before submission.
            You are solely responsible for submitted content.
          </p>
        </div>
      )}

      {/* Workflow steps */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Workflow
        </p>
        <div className="space-y-3">
          {WORKFLOW_STEPS.map((step) => {
            const isComplete = step.id < currentStep;
            const isActive = step.id === currentStep;

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
                    ) : isActive ? (
                      <step.icon className="h-4 w-4 text-sky-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                    </div>
                    {isActive && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {isActive && !isHandsOff && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="min-h-[32px] text-xs" disabled>
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[32px] text-xs"
                      disabled
                    >
                      Revise
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 py-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            AI workflow will be available when the Mastra agent is connected (Task 8)
          </p>
        </div>
      </div>

      <Separator />

      {/* Action footer */}
      <div className="p-3">
        <Button className="w-full min-h-[44px]" disabled>
          {isHandsOff ? "Start Autonomous Draft" : "Start Guided Workflow"}
        </Button>
      </div>
    </div>
  );
}
