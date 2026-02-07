"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Send, Lightbulb, BookOpen, HelpCircle } from "lucide-react";

const STAGES = [
  { id: "understand", label: "Understand Topic", icon: HelpCircle },
  { id: "literature", label: "Literature Review", icon: BookOpen },
  { id: "outline", label: "Create Outline", icon: Lightbulb },
  { id: "drafting", label: "Write Draft", icon: Send },
  { id: "feedback", label: "Get Feedback", icon: GraduationCap },
] as const;

interface LearnModePanelProps {
  currentStage?: string;
}

export function LearnModePanel({ currentStage = "understand" }: LearnModePanelProps) {
  const [input, setInput] = useState("");

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold">Writing Coach</span>
          <Badge variant="secondary" className="text-[10px]">Learn Mode</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Your AI coach will guide you through the writing process
        </p>
      </div>

      {/* Stage progress */}
      <div className="border-b px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Progress
        </p>
        <div className="space-y-1">
          {STAGES.map((stage) => {
            const isActive = stage.id === currentStage;
            const stageIndex = STAGES.findIndex((s) => s.id === stage.id);
            const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
            const isComplete = stageIndex < currentIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                  isActive
                    ? "bg-amber-50 text-amber-700 font-medium dark:bg-amber-950/30 dark:text-amber-400"
                    : isComplete
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground"
                }`}
              >
                <stage.icon className="h-3.5 w-3.5 shrink-0" />
                {stage.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area (placeholder) */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {/* Coach welcome message */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
              Writing Coach
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Welcome! I&apos;m here to help you write your research paper step by step.
              Let&apos;s start by understanding your topic. What research question are you
              investigating?
            </p>
          </div>

          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground italic">
              AI coaching will be available when the Mastra agent is connected (Task 8 &amp; 9)
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Input area */}
      <div className="p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask your writing coach..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="text-sm"
            disabled
          />
          <Button size="icon" className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] shrink-0" disabled>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          The coach asks questions — it won&apos;t write for you
        </p>
      </div>
    </div>
  );
}
