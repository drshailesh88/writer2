"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FileCheck2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Search,
  ShieldCheck,
  PenTool,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───

interface PlagiarismSource {
  id: string;
  title: string;
  url: string;
  matchedWords: number;
  totalWords: number;
  similarity: number;
  matchedText: string;
}

interface PlagiarismResult {
  overallSimilarity: number;
  sources: PlagiarismSource[];
}

// ─── Cookie Helpers ───

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// ─── Word Count Helper ───

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

// ─── Similarity Color Helper ───

function getSimilarityStyles(similarity: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (similarity < 10) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      label: "Low Similarity",
    };
  }
  if (similarity <= 25) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/50",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      label: "Moderate Similarity",
    };
  }
  return {
    bg: "bg-red-50 dark:bg-red-950/50",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    label: "High Similarity",
  };
}

// ─── Main Page Component ───

export default function FreePlagiarismCheckPage() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<
    "idle" | "pending" | "completed" | "failed"
  >("idle");
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUsedFreeCheck, setHasUsedFreeCheck] = useState(false);
  const [checkingCookie, setCheckingCookie] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const wordCount = countWords(text);
  const isOverLimit = wordCount > 1000;
  const canSubmit =
    wordCount > 0 && !isOverLimit && status !== "pending";

  // ─── Check cookie on mount ───
  useEffect(() => {
    const used = getCookie("v1d_free_check_used");
    if (used === "true") {
      setHasUsedFreeCheck(true);
    }
    setCheckingCookie(false);
  }, []);

  // ─── Cleanup polling on unmount ───
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // ─── Scroll to results when completed ───
  useEffect(() => {
    if (status === "completed" && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  // ─── Poll for results ───
  const pollForResults = useCallback((checkId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes max (60 * 3s)

    pollingRef.current = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setStatus("failed");
        setError(
          "The scan is taking longer than expected. Please try again later."
        );
        return;
      }

      try {
        const response = await fetch(
          `/api/plagiarism/status?checkId=${encodeURIComponent(checkId)}`
        );
        const data = await response.json();

        if (data.status === "completed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setStatus("completed");
          setResult({
            overallSimilarity: data.result.overallSimilarity,
            sources: data.result.sources || [],
          });
          // Set cookie so user cannot check again for 30 days
          setCookie("v1d_free_check_used", "true", 30);
          setHasUsedFreeCheck(true);
        } else if (data.status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setStatus("failed");
          setError("Plagiarism check failed. Please try again.");
        }
      } catch {
        // Continue polling on transient network errors
      }
    }, 3000);
  }, []);

  // ─── Submit handler ───
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setStatus("pending");
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/plagiarism/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("failed");
        setError(data.error || "Failed to submit plagiarism check.");
        return;
      }

      // Start polling
      pollForResults(data.checkId);
    } catch {
      setStatus("failed");
      setError("An unexpected error occurred. Please try again.");
    }
  }, [canSubmit, text, pollForResults]);

  // ─── Render ───
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-mono text-sm font-bold text-primary-foreground">
                V1
              </span>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Drafts
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="min-h-[44px] text-sm font-medium"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="min-h-[44px] text-sm font-medium">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ─── Main Content ─── */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {/* ─── Page Header ─── */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/50">
            <FileCheck2 className="h-7 w-7 text-sky-600 dark:text-sky-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Free Plagiarism Checker
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground sm:text-lg">
            Check your text for plagiarism &mdash; no signup required
          </p>
        </div>

        {/* ─── Cookie Gate: Already Used ─── */}
        {!checkingCookie && hasUsedFreeCheck && status !== "completed" && (
          <Card className="mt-10">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold">
                You&apos;ve already used your free check
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Sign up for a free account to get 2 plagiarism checks per month,
                plus access to AI detection, paper search, and more.
              </p>
              <Link href="/sign-up" className="mt-6">
                <Button className="min-h-[44px] min-w-[200px] text-sm font-medium">
                  Sign Up Free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* ─── Input Area ─── */}
        {!checkingCookie && !hasUsedFreeCheck && (
          <div className="mt-10">
            <Card>
              <CardContent className="pt-6">
                <label
                  htmlFor="plagiarism-input"
                  className="mb-2 block text-sm font-medium"
                >
                  Paste your text below
                </label>
                <Textarea
                  id="plagiarism-input"
                  placeholder="Paste or type your text here to check for plagiarism..."
                  className="min-h-[200px] resize-y text-sm leading-relaxed sm:min-h-[260px]"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={status === "pending"}
                  aria-describedby="word-count-info"
                />

                {/* Word counter + validation */}
                <div
                  id="word-count-info"
                  className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p
                    className={`font-mono text-xs ${
                      isOverLimit
                        ? "font-semibold text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {wordCount.toLocaleString()} / 1,000 words
                  </p>
                  {isOverLimit && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Free checks are limited to 1,000 words
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <div className="mt-5">
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="min-h-[44px] w-full text-sm font-medium sm:w-auto sm:min-w-[220px]"
                  >
                    {status === "pending" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="mr-2 h-4 w-4" />
                        Check for Plagiarism
                      </>
                    )}
                  </Button>
                </div>

                {/* Error message */}
                {error && status === "failed" && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Loading Skeleton ─── */}
        {status === "pending" && (
          <div className="mt-8" aria-live="polite" aria-label="Scanning in progress">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Scanning your text for plagiarism...
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This typically takes 15-30 seconds
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Results Area ─── */}
        {status === "completed" && result && (
          <div ref={resultsRef} className="mt-8 space-y-6" aria-live="polite">
            {/* Overall Score Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
                  {/* Score Badge */}
                  <div
                    className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border-2 ${getSimilarityStyles(result.overallSimilarity).bg} ${getSimilarityStyles(result.overallSimilarity).border}`}
                  >
                    <span
                      className={`font-mono text-3xl font-bold leading-none ${getSimilarityStyles(result.overallSimilarity).text}`}
                    >
                      {result.overallSimilarity}%
                    </span>
                    <span
                      className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${getSimilarityStyles(result.overallSimilarity).text}`}
                    >
                      similarity
                    </span>
                  </div>

                  {/* Score Details */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-lg font-semibold">
                      Plagiarism Check Complete
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.overallSimilarity === 0 ? (
                        <>
                          No plagiarism detected. Your text appears to be
                          original.
                        </>
                      ) : result.overallSimilarity < 10 ? (
                        <>
                          Very low similarity detected. Your text is largely
                          original.
                        </>
                      ) : result.overallSimilarity <= 25 ? (
                        <>
                          Moderate similarity detected. Review the matched
                          sources below and consider rephrasing.
                        </>
                      ) : (
                        <>
                          High similarity detected. We recommend reviewing and
                          rewriting the matched sections.
                        </>
                      )}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`mt-3 font-mono text-xs ${getSimilarityStyles(result.overallSimilarity).bg} ${getSimilarityStyles(result.overallSimilarity).text}`}
                    >
                      {getSimilarityStyles(result.overallSimilarity).label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No Plagiarism Celebration */}
            {result.overallSimilarity === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50">
                    <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                    No plagiarism detected
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Your text was checked against millions of web pages and
                    academic sources. No matches were found.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Source List */}
            {result.sources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Matching Sources ({result.sources.length})
                  </CardTitle>
                  <CardDescription>
                    Text segments that match existing online or academic sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.sources.map((source, index) => (
                      <div key={source.id || index}>
                        {index > 0 && <Separator className="mb-4" />}
                        <div className="space-y-2.5">
                          {/* Source header */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold leading-snug">
                                {source.title}
                              </h4>
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span className="max-w-[280px] truncate sm:max-w-[400px]">
                                    {source.url}
                                  </span>
                                </a>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={`shrink-0 font-mono text-xs ${getSimilarityStyles(source.similarity).bg} ${getSimilarityStyles(source.similarity).text}`}
                            >
                              {source.similarity}% match
                            </Badge>
                          </div>

                          {/* Matched text snippet */}
                          {source.matchedText && (
                            <div className="rounded-lg border bg-muted/40 p-3">
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                &ldquo;{source.matchedText}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Sign-Up CTA (shown after results) ─── */}
            <Card className="border-2 border-primary/20 bg-primary/[0.02]">
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold tracking-tight">
                    Want more? Sign up for free
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Create a free account and unlock powerful research tools
                    designed for medical students.
                  </p>

                  <ul className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                    {[
                      {
                        icon: FileCheck2,
                        text: "2 plagiarism checks/month",
                        color:
                          "text-sky-600 dark:text-sky-400",
                        bg: "bg-sky-50 dark:bg-sky-950/50",
                      },
                      {
                        icon: ShieldCheck,
                        text: "AI detection",
                        color:
                          "text-rose-600 dark:text-rose-400",
                        bg: "bg-rose-50 dark:bg-rose-950/50",
                      },
                      {
                        icon: Search,
                        text: "Paper search across 200M+ papers",
                        color:
                          "text-emerald-600 dark:text-emerald-400",
                        bg: "bg-emerald-50 dark:bg-emerald-950/50",
                      },
                      {
                        icon: PenTool,
                        text: "Draft Mode with AI writing assistance",
                        color:
                          "text-violet-600 dark:text-violet-400",
                        bg: "bg-violet-50 dark:bg-violet-950/50",
                      },
                    ].map((feature) => (
                      <li
                        key={feature.text}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${feature.bg}`}
                        >
                          <feature.icon
                            className={`h-4 w-4 ${feature.color}`}
                          />
                        </div>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/sign-up" className="mt-8">
                    <Button className="min-h-[48px] min-w-[220px] text-base font-medium">
                      Sign Up Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    No credit card required
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative mt-auto">
        <div
          className="h-px bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden="true"
        />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span className="font-mono text-[10px] font-bold text-primary-foreground">
                V1
              </span>
            </div>
            <span className="text-sm font-medium">Drafts</span>
          </div>
          <p className="text-center font-mono text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} V1 Drafts. All research needs met
            under one single roof.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="flex min-h-[44px] items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="flex min-h-[44px] items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/sign-in"
              className="flex min-h-[44px] items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
