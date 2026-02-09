"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { PlagiarismSource } from "@/lib/copyleaks";

export interface PlagiarismResult {
  overallSimilarity: number;
  sources: PlagiarismSource[];
}

interface UsePlagiarismCheckReturn {
  submitCheck: (text: string, documentId?: string) => Promise<void>;
  status: "idle" | "pending" | "completed" | "failed";
  result: PlagiarismResult | null;
  error: string | null;
  isLoading: boolean;
  limitExceeded: boolean;
  checkId: string | null;
  reset: () => void;
}

export function usePlagiarismCheck(): UsePlagiarismCheckReturn {
  const [status, setStatus] = useState<
    "idle" | "pending" | "completed" | "failed"
  >("idle");
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [checkId, setCheckId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get usage data for upgrade modal
  const usage = useQuery(api.users.getUsage);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount to prevent memory leaks
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus("idle");
    setResult(null);
    setError(null);
    setLimitExceeded(false);
    setCheckId(null);
  }, [stopPolling]);

  const pollForResults = useCallback(
    (id: string) => {
      let isPolling = false;
      let pollCount = 0;
      const MAX_POLLS = 60; // 60 * 3s = 3 minutes max

      pollingRef.current = setInterval(async () => {
        if (isPolling) return; // Prevent stacking requests
        isPolling = true;
        pollCount++;

        // Timeout after MAX_POLLS attempts
        if (pollCount > MAX_POLLS) {
          stopPolling();
          setStatus("failed");
          setError("Plagiarism check timed out. Please try again.");
          isPolling = false;
          return;
        }

        try {
          const response = await fetch(
            `/api/plagiarism/status?checkId=${encodeURIComponent(id)}`
          );
          const data = await response.json();

          if (data.status === "completed") {
            stopPolling();
            setStatus("completed");
            setResult({
              overallSimilarity: data.result.overallSimilarity,
              sources: data.result.sources || [],
            });
            toast.success("Plagiarism check complete", {
              description: `Similarity: ${data.result.overallSimilarity}%`,
            });
          } else if (data.status === "failed") {
            stopPolling();
            setStatus("failed");
            setError(
              "Plagiarism check failed. Please try again."
            );
            toast.error("Plagiarism check failed. Please try again.");
          }
        } catch {
          // Continue polling on transient errors
        } finally {
          isPolling = false;
        }
      }, 3000);
    },
    [stopPolling]
  );

  const submitCheck = useCallback(
    async (text: string, documentId?: string) => {
      reset();
      setStatus("pending");

      try {
        const response = await fetch("/api/plagiarism/check", {
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
          throw new Error(data.error || "Failed to submit plagiarism check");
        }

        setCheckId(data.checkId);

        // Start polling for results
        pollForResults(data.checkId);
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
    [reset, pollForResults]
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
export function usePlagiarismUsage() {
  return useQuery(api.users.getUsage);
}
