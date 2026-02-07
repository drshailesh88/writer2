"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AiDetectionSection } from "@/lib/copyleaks";

export interface AiDetectionResult {
  overallAiScore: number;
  humanScore: number;
  sentences: AiDetectionSection[];
}

interface UseAiDetectionReturn {
  submitCheck: (text: string, documentId?: string) => Promise<void>;
  status: "idle" | "pending" | "completed" | "failed";
  result: AiDetectionResult | null;
  error: string | null;
  isLoading: boolean;
  limitExceeded: boolean;
  checkId: string | null;
  reset: () => void;
}

export function useAiDetection(): UseAiDetectionReturn {
  const [status, setStatus] = useState<
    "idle" | "pending" | "completed" | "failed"
  >("idle");
  const [result, setResult] = useState<AiDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [checkId, setCheckId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setLimitExceeded(false);
    setCheckId(null);
  }, []);

  const submitCheck = useCallback(
    async (text: string, documentId?: string) => {
      reset();
      setStatus("pending");

      try {
        const response = await fetch("/api/ai-detection/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, documentId }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.limitExceeded) {
            setLimitExceeded(true);
            setStatus("idle");
            setError(data.error);
            return;
          }
          throw new Error(data.error || "Failed to submit AI detection check");
        }

        setCheckId(data.checkId);

        // AI detection returns results synchronously
        if (data.status === "completed" && data.result) {
          setStatus("completed");
          setResult({
            overallAiScore: data.result.overallAiScore,
            humanScore: data.result.humanScore,
            sentences: data.result.sentences || [],
          });
        } else {
          // Fallback: poll for results if somehow async
          setStatus("completed");
          setResult({
            overallAiScore: data.result?.overallAiScore ?? 0,
            humanScore: data.result?.humanScore ?? 100,
            sentences: data.result?.sentences || [],
          });
        }
      } catch (err) {
        setStatus("failed");
        // Show user-friendly message, hide technical details
        const message =
          err instanceof TypeError && err.message === "Failed to fetch"
            ? "Service temporarily unavailable. Please try again in a few minutes."
            : err instanceof Error && err.message
              ? err.message
              : "An unexpected error occurred. Please try again.";
        setError(message);
      }
    },
    [reset]
  );

  return {
    submitCheck,
    status,
    result,
    error,
    isLoading: status === "pending",
    limitExceeded,
    checkId,
    reset,
  };
}

// Re-export usage for convenience
export function useAiDetectionUsage() {
  return useQuery(api.users.getUsage);
}
