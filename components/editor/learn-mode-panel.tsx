"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useLearnMode } from "@/lib/hooks/use-learn-mode";
import { FEEDBACK_CATEGORIES } from "@/lib/mastra/types";
import type { ConversationMessage } from "@/lib/mastra/types";
import {
  GraduationCap,
  Send,
  Lightbulb,
  BookOpen,
  HelpCircle,
  PenLine,
  MessageSquare,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Sparkles,
  Quote,
  ChevronRight,
} from "lucide-react";

const STAGES = [
  { id: "understand" as const, label: "Understand Topic", icon: HelpCircle },
  { id: "literature" as const, label: "Literature Review", icon: BookOpen },
  { id: "outline" as const, label: "Create Outline", icon: Lightbulb },
  { id: "drafting" as const, label: "Write Draft", icon: PenLine },
  { id: "feedback" as const, label: "Get Feedback", icon: MessageSquare },
];

interface LearnModePanelProps {
  documentId: string;
  topic: string;
  currentStage?: string;
  editorContent?: string;
}

export function LearnModePanel({
  documentId,
  topic,
  currentStage: initialStage = "understand",
  editorContent = "",
}: LearnModePanelProps) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const learnMode = useLearnMode(documentId, topic);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [learnMode.conversationHistory.length]);

  // Start session on mount if idle
  useEffect(() => {
    if (learnMode.status === "idle" && topic) {
      learnMode.startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || learnMode.isLoading) return;

    setInput("");
    await learnMode.sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAskForHelp = async () => {
    if (learnMode.isLoading) return;
    const helpMsg =
      learnMode.currentStage === "drafting"
        ? "Can you give me a sentence starter for this section?"
        : "Can you give me an example from a published paper?";
    await learnMode.sendMessage(helpMsg);
  };

  const currentStageIndex = STAGES.findIndex(
    (s) => s.id === learnMode.currentStage
  );

  return (
    <div className="flex h-full flex-col">
      {/* ─── Header ─── */}
      <div className="border-b bg-gradient-to-r from-amber-50/80 to-orange-50/40 px-4 py-3 dark:from-amber-950/20 dark:to-background">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <GraduationCap className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Writing Coach
          </span>
          <Badge
            variant="secondary"
            className="ml-auto bg-amber-100/80 text-amber-800 text-[10px] dark:bg-amber-900/30 dark:text-amber-300"
          >
            Learn Mode
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground pl-8">
          I&apos;ll guide you — I won&apos;t write for you
        </p>
      </div>

      {/* ─── Stage Progress ─── */}
      <div className="border-b px-4 py-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Stage {currentStageIndex + 1} of 5
        </p>
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border dark:bg-border" />
          <div
            className="absolute left-[7px] top-2 w-[2px] bg-amber-400 dark:bg-amber-500 transition-all duration-500"
            style={{
              height: `${Math.max(0, currentStageIndex) * 25}%`,
            }}
          />

          <div className="space-y-0.5">
            {STAGES.map((stage, i) => {
              const isActive = stage.id === learnMode.currentStage;
              const isComplete = i < currentStageIndex;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-2.5 rounded-md px-0 py-1 text-xs transition-colors relative ${
                    isActive
                      ? "text-amber-800 font-medium dark:text-amber-300"
                      : isComplete
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="relative z-10">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    ) : isActive ? (
                      <div className="h-4 w-4 rounded-full border-2 border-amber-500 bg-amber-100 dark:border-amber-400 dark:bg-amber-900/50" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/30" />
                    )}
                  </div>
                  <span className={isComplete ? "line-through" : ""}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Feedback Panel (Stage 5) ─── */}
      {learnMode.isFeedbackStage && (
        <FeedbackPanel
          feedbackItems={learnMode.feedbackItems}
          currentIndex={learnMode.currentFeedbackIndex}
          isLoading={learnMode.status === "loading-feedback"}
          onGetFeedback={() => learnMode.requestFeedback(editorContent)}
          onAddressed={learnMode.addressFeedback}
          hasEditorContent={editorContent.length > 20}
        />
      )}

      {/* ─── Chat Area ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-3">
          {learnMode.conversationHistory.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {/* Loading indicator */}
          {(learnMode.status === "sending" ||
            learnMode.status === "starting" ||
            learnMode.status === "advancing") && <TypingIndicator />}

          {/* Error */}
          {learnMode.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-xs text-red-700 dark:text-red-400">
                {learnMode.error}
              </p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      <Separator />

      {/* ─── Action Buttons ─── */}
      <div className="px-3 pt-2">
        <div className="flex gap-1.5">
          {/* Ask for Help */}
          {!learnMode.isFeedbackStage && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1 text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30"
              onClick={handleAskForHelp}
              disabled={learnMode.isLoading}
            >
              <Sparkles className="h-3 w-3" />
              Ask for Help
            </Button>
          )}

          {/* Next Stage */}
          {learnMode.canAdvance && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1 ml-auto"
              onClick={learnMode.advanceStage}
              disabled={learnMode.isLoading}
            >
              Next Stage
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* ─── Input Area ─── */}
      <div className="p-3 pt-1.5">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder={
              learnMode.isFeedbackStage
                ? "Ask about the feedback..."
                : "Respond to your coach..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={learnMode.isLoading || learnMode.status === "idle"}
          />
          <Button
            size="icon"
            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] shrink-0 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
            onClick={handleSend}
            disabled={
              !input.trim() ||
              learnMode.isLoading ||
              learnMode.status === "idle"
            }
          >
            {learnMode.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          The coach asks questions — it won&apos;t write for you
        </p>
      </div>
    </div>
  );
}

// ─── Chat Message Bubble ───
function ChatMessage({ message }: { message: ConversationMessage }) {
  const isCoach = message.role === "coach";

  return (
    <div className={`flex ${isCoach ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[90%] rounded-xl px-3 py-2.5 ${
          isCoach
            ? "bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40"
            : "bg-slate-100 dark:bg-slate-800"
        }`}
      >
        {isCoach && (
          <div className="flex items-center gap-1 mb-1">
            <GraduationCap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              Coach
            </span>
          </div>
        )}
        <p
          className={`text-[13px] leading-relaxed whitespace-pre-wrap ${
            isCoach
              ? "text-amber-950 dark:text-amber-100"
              : "text-foreground"
          }`}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}

// ─── Typing Indicator ───
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 dark:bg-amber-950/20 dark:border-amber-900/40">
        <div className="flex items-center gap-1">
          <GraduationCap className="h-3 w-3 text-amber-600 dark:text-amber-400 mr-1" />
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Panel ───
function FeedbackPanel({
  feedbackItems,
  currentIndex,
  isLoading,
  onGetFeedback,
  onAddressed,
  hasEditorContent,
}: {
  feedbackItems: { category: string; suggestion: string; example?: string | null; addressed: boolean }[];
  currentIndex: number;
  isLoading: boolean;
  onGetFeedback: () => void;
  onAddressed: () => void;
  hasEditorContent: boolean;
}) {
  const totalCategories = FEEDBACK_CATEGORIES.length;
  const currentFeedback = feedbackItems[currentIndex - 1]; // Last received feedback
  const allDone = currentIndex >= totalCategories;
  const currentCategory = FEEDBACK_CATEGORIES[currentIndex];

  return (
    <div className="border-b px-3 py-3">
      {/* Feedback progress */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Feedback
        </p>
        <Badge
          variant="secondary"
          className="text-[10px] bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        >
          {Math.min(currentIndex, totalCategories)}/{totalCategories}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted mb-3">
        <div
          className="h-1 rounded-full bg-amber-400 transition-all duration-500"
          style={{
            width: `${(Math.min(currentIndex, totalCategories) / totalCategories) * 100}%`,
          }}
        />
      </div>

      {allDone ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 dark:bg-green-950/20 dark:border-green-900">
          <p className="text-xs font-medium text-green-700 dark:text-green-400">
            All feedback categories reviewed!
          </p>
          <p className="text-[11px] text-green-600 dark:text-green-500 mt-0.5">
            Great work! Review your revisions and finalize your paper.
          </p>
        </div>
      ) : currentFeedback && !currentFeedback.addressed ? (
        /* Show current feedback */
        <div className="space-y-2">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
              {FEEDBACK_CATEGORIES.find((c) => c.id === currentFeedback.category)?.label ||
                currentFeedback.category}
            </p>
            <p className="text-xs leading-relaxed text-foreground">
              {currentFeedback.suggestion}
            </p>

            {currentFeedback.example && (
              <div className="mt-2 rounded-md bg-muted/50 p-2 border-l-2 border-amber-300 dark:border-amber-600">
                <div className="flex items-center gap-1 mb-0.5">
                  <Quote className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Published example
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                  {currentFeedback.example}
                </p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1"
            onClick={onAddressed}
          >
            <CheckCircle2 className="h-3 w-3" />
            I&apos;ve addressed this
            <ChevronRight className="h-3 w-3 ml-auto" />
          </Button>
        </div>
      ) : (
        /* Get next feedback */
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs gap-1 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
          onClick={onGetFeedback}
          disabled={isLoading || !hasEditorContent}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <MessageSquare className="h-3 w-3" />
              {currentCategory
                ? `Get feedback: ${currentCategory.label}`
                : "Get feedback"}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
