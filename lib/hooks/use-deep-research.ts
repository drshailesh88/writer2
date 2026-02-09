"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useDeepResearch() {
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Real-time polling of report status via Convex
  const report = useQuery(
    api.deepResearchReports.get,
    reportId ? { reportId: reportId as Id<"deepResearchReports"> } : "skip"
  );

  const isLoading =
    isStarting ||
    (report !== undefined &&
      report !== null &&
      (report.status === "pending" || report.status === "in_progress"));

  const startResearch = useCallback(async (topic: string) => {
    setError(null);
    setIsStarting(true);

    try {
      const response = await fetch("/api/deep-research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error || "Failed to start research";
        setError(message);
        toast.error("Deep research failed", { description: message });
        return null;
      }

      setReportId(data.reportId);
      toast.success("Deep research started", {
        description: "You'll be notified when the report is ready.",
      });
      return data.reportId as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      toast.error("Deep research failed", { description: message });
      return null;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const viewReport = useCallback((id: string) => {
    setReportId(id);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setReportId(null);
    setError(null);
    setIsStarting(false);
  }, []);

  return {
    startResearch,
    viewReport,
    reset,
    reportId,
    report,
    isLoading,
    isStarting,
    error,
  };
}
