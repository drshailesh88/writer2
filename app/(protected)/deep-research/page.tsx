"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDeepResearch } from "@/lib/hooks/use-deep-research";
import { UpgradeModal } from "@/components/modals/upgrade-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FlaskConical,
  Loader2,
  Copy,
  Check,
  Clock,
  AlertCircle,
  FileText,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

/* ── Helpers ── */

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function getStatusConfig(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        icon: Clock,
        showSpinner: false,
      };
    case "in_progress":
      return {
        label: "In Progress",
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
        icon: Loader2,
        showSpinner: true,
      };
    case "completed":
      return {
        label: "Completed",
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
        icon: Check,
        showSpinner: false,
      };
    case "failed":
      return {
        label: "Failed",
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
        icon: AlertCircle,
        showSpinner: false,
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground",
        icon: Clock,
        showSpinner: false,
      };
  }
}

/* ── Cited Paper Type ── */

interface CitedPaper {
  title?: string;
  authors?: string[];
  year?: number | string;
  journal?: string;
  url?: string;
}

/* ── Component ── */

export default function DeepResearchPage() {
  const [topic, setTopic] = useState("");
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const {
    startResearch,
    viewReport,
    reset,
    report,
    isLoading,
    isStarting,
    error,
  } = useDeepResearch();

  const usage = useQuery(api.users.getUsage);
  const reports = useQuery(api.deepResearchReports.listByUser);

  /* ── Derived state ── */
  const isBlocked = usage !== undefined && usage !== null && usage.deepResearchLimit === 0;
  const isOverLimit =
    usage !== undefined &&
    usage !== null &&
    usage.deepResearchLimit > 0 &&
    usage.deepResearchUsed >= usage.deepResearchLimit;
  const canStart = topic.trim().length >= 5 && !isLoading && !isBlocked && !isOverLimit;

  /* ── Handlers ── */

  const handleStartResearch = useCallback(async () => {
    if (!canStart) return;

    if (isBlocked) {
      setShowUpgrade(true);
      return;
    }

    if (isOverLimit) {
      setShowUpgrade(true);
      return;
    }

    await startResearch(topic.trim());
    setTopic("");
  }, [canStart, isBlocked, isOverLimit, topic, startResearch]);

  const handleViewReport = useCallback(
    (reportId: string) => {
      viewReport(reportId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [viewReport]
  );

  const handleCopyReport = useCallback(async () => {
    if (!report?.report) return;
    try {
      await navigator.clipboard.writeText(report.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: no clipboard API
    }
  }, [report]);

  const handleBackToInput = useCallback(() => {
    reset();
  }, [reset]);

  /* ── Loading state ── */
  if (usage === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* ─── Header ─── */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950">
            <FlaskConical className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Deep Research
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Enter a research topic and our AI agent will search academic
          databases, analyze papers, and generate a comprehensive research
          report.
        </p>
      </div>

      {/* ─── Topic Input Section ─── */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="research-topic"
                className="text-sm font-medium leading-none"
              >
                Research Topic
              </label>
              <Input
                id="research-topic"
                type="text"
                placeholder="e.g., Role of TREM2 in Alzheimer's disease"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={500}
                disabled={isLoading}
                className="min-h-[44px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canStart) {
                    handleStartResearch();
                  }
                }}
                aria-describedby="topic-char-count"
              />
              <div className="flex items-center justify-between">
                <p
                  id="topic-char-count"
                  className="text-xs text-muted-foreground"
                >
                  {topic.length} / 500
                </p>
                {usage && (
                  <p className="text-xs text-muted-foreground">
                    {usage.deepResearchLimit === 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        Upgrade to access Deep Research
                      </span>
                    ) : (
                      <>
                        {usage.deepResearchUsed} / {usage.deepResearchLimit}{" "}
                        reports used this month
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            <Button
              onClick={handleStartResearch}
              disabled={!canStart}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {isStarting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="mr-2 h-4 w-4" />
              )}
              {isStarting ? "Starting Research..." : "Start Research"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Active Report Display ─── */}
      {report && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToInput}
                    className="min-h-[44px] -ml-2 px-2 text-muted-foreground sm:min-h-0"
                    aria-label="Back to research input"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg leading-tight sm:text-xl">
                    {report.topic}
                  </CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const statusConfig = getStatusConfig(report.status);
                  return (
                    <Badge
                      variant="secondary"
                      className={`gap-1 px-2.5 py-1 font-mono text-xs ${statusConfig.className}`}
                    >
                      {statusConfig.showSpinner ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <statusConfig.icon className="h-3 w-3" />
                      )}
                      {statusConfig.label}
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            {/* Loading state while research is in progress */}
            {(report.status === "pending" ||
              report.status === "in_progress") && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="mt-4 font-medium">
                  {report.status === "pending"
                    ? "Queuing your research..."
                    : "Researching your topic..."}
                </p>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                  {report.status === "pending"
                    ? "Your request is being prepared. This usually takes a few seconds."
                    : "Our AI agent is searching databases, reading papers, and synthesizing findings. This may take 2-5 minutes."}
                </p>
              </div>
            )}

            {/* Failed state */}
            {report.status === "failed" && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <p className="mt-4 font-medium">Research Failed</p>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Something went wrong while generating your report. Please try
                  again with a different or more specific topic.
                </p>
                <Button
                  variant="outline"
                  onClick={handleBackToInput}
                  className="mt-4 min-h-[44px]"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Completed report content */}
            {report.status === "completed" && report.report && (
              <div className="space-y-6">
                {/* Copy button */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReport}
                    className="min-h-[44px] gap-2 sm:min-h-0"
                    aria-label="Copy report to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Report
                      </>
                    )}
                  </Button>
                </div>

                {/* Report body rendered as prose */}
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-li:leading-relaxed">
                  {report.report.split("\n").map((line, i) => {
                    const trimmed = line.trim();

                    // Empty line = paragraph break
                    if (!trimmed) return <br key={i} />;

                    // Heading detection (markdown style)
                    if (trimmed.startsWith("### ")) {
                      return (
                        <h3 key={i} className="mt-6 mb-2 text-base font-semibold">
                          {trimmed.slice(4)}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith("## ")) {
                      return (
                        <h2 key={i} className="mt-8 mb-3 text-lg font-semibold">
                          {trimmed.slice(3)}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith("# ")) {
                      return (
                        <h1 key={i} className="mt-8 mb-4 text-xl font-bold">
                          {trimmed.slice(2)}
                        </h1>
                      );
                    }

                    // Bullet points
                    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                      return (
                        <li key={i} className="ml-4 list-disc">
                          {trimmed.slice(2)}
                        </li>
                      );
                    }

                    // Numbered list
                    const numberedMatch = trimmed.match(/^\d+\.\s/);
                    if (numberedMatch) {
                      return (
                        <li key={i} className="ml-4 list-decimal">
                          {trimmed.slice(numberedMatch[0].length)}
                        </li>
                      );
                    }

                    // Bold text support (simple **text** replacement)
                    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={i} className="mb-2">
                        {parts.map((part, j) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <strong key={j}>
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>

                {/* Cited Papers */}
                {report.citedPapers &&
                  Array.isArray(report.citedPapers) &&
                  report.citedPapers.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Cited Papers ({report.citedPapers.length})
                        </h3>
                        <div className="space-y-3">
                          {(report.citedPapers as CitedPaper[]).map(
                            (paper, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-medium text-muted-foreground">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium leading-snug">
                                    {paper.title || "Untitled Paper"}
                                  </p>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                    {paper.authors &&
                                      paper.authors.length > 0 && (
                                        <span>
                                          {paper.authors.slice(0, 3).join(", ")}
                                          {paper.authors.length > 3 &&
                                            ` et al.`}
                                        </span>
                                      )}
                                    {paper.year && (
                                      <>
                                        <span aria-hidden="true">-</span>
                                        <span>{paper.year}</span>
                                      </>
                                    )}
                                    {paper.journal && (
                                      <>
                                        <span aria-hidden="true">-</span>
                                        <span className="italic">
                                          {paper.journal}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {paper.url && (
                                  <a
                                    href={paper.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    aria-label={`Open ${paper.title || "paper"} in new tab`}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Previous Reports Section ─── */}
      <section>
        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Previous Reports
        </h2>

        {reports === undefined ? (
          <Card className="mt-4">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">No research reports yet</h3>
              <p className="mt-1.5 max-w-[300px] text-sm text-muted-foreground">
                Start your first deep research above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-2">
            {reports.map((item) => {
              const statusConfig = getStatusConfig(item.status);
              return (
                <Card
                  key={item._id}
                  className="group cursor-pointer py-0 gap-0 transition-all duration-200 hover:shadow-sm"
                  onClick={() => handleViewReport(item._id)}
                >
                  <CardContent className="flex items-center gap-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
                      <FlaskConical className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.topic}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`gap-1 px-1.5 py-0 font-mono text-[10px] ${statusConfig.className}`}
                        >
                          {statusConfig.showSpinner ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <statusConfig.icon className="h-2.5 w-2.5" />
                          )}
                          {statusConfig.label}
                        </Badge>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ArrowLeft className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Upgrade Modal ─── */}
      {usage && (
        <UpgradeModal
          feature="deepResearch"
          currentUsage={usage.deepResearchUsed}
          limit={usage.deepResearchLimit}
          tier={usage.tier}
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
