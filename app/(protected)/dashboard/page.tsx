"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  PenTool,
  Zap,
  FileText,
  FileCheck2,
  ShieldCheck,
  FlaskConical,
  ArrowRight,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ── Subscription limits for usage display ── */
const LIMITS: Record<string, Record<string, number>> = {
  none: { plagiarism: 1, aiDetection: 0, deepResearch: 0 },
  free: { plagiarism: 2, aiDetection: 2, deepResearch: 0 },
  basic: { plagiarism: 5, aiDetection: 10, deepResearch: 5 },
  pro: { plagiarism: 20, aiDetection: -1, deepResearch: 15 },
};

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

function getModeConfig(mode: string) {
  switch (mode) {
    case "learn":
      return {
        label: "Learn",
        badgeCls:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        borderCls: "border-l-amber-500",
      };
    case "draft_guided":
      return {
        label: "Guided",
        badgeCls:
          "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
        borderCls: "border-l-sky-500",
      };
    case "draft_handsoff":
      return {
        label: "Hands-off",
        badgeCls:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
        borderCls: "border-l-violet-500",
      };
    default:
      return {
        label: mode,
        badgeCls: "bg-muted text-muted-foreground",
        borderCls: "border-l-border",
      };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "in_progress":
      return {
        label: "In Progress",
        cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
      };
    case "completed":
      return {
        label: "Completed",
        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
      };
    case "archived":
      return {
        label: "Archived",
        cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      };
    default:
      return { label: status, cls: "bg-muted text-muted-foreground" };
  }
}

/* ── Quick-action card data ── */
const quickActions = [
  {
    mode: "learn" as const,
    title: "New Learn Mode",
    subtitle: "Guided coaching",
    icon: GraduationCap,
    borderCls: "border-l-amber-500",
    iconBg: "oklch(0.96 0.05 80)",
    iconColor: "oklch(0.65 0.16 55)",
  },
  {
    mode: "draft_guided" as const,
    title: "New Draft (Guided)",
    subtitle: "AI-assisted writing",
    icon: PenTool,
    borderCls: "border-l-sky-500",
    iconBg: "oklch(0.95 0.04 240)",
    iconColor: "oklch(0.55 0.18 240)",
  },
  {
    mode: "draft_handsoff" as const,
    title: "New Draft (Hands-off)",
    subtitle: "Full AI drafting",
    icon: Zap,
    borderCls: "border-l-violet-500",
    iconBg: "oklch(0.94 0.05 290)",
    iconColor: "oklch(0.55 0.17 290)",
  },
];

/* ── Component ── */
export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getCurrent);
  const documents = useQuery(api.documents.list, {});
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const createDocument = useMutation(api.documents.create);
  const hasTriedCreate = useRef(false);
  const [creatingMode, setCreatingMode] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user === null && !hasTriedCreate.current) {
      hasTriedCreate.current = true;
      getOrCreateUser().catch(console.error);
    }
  }, [isAuthenticated, user, getOrCreateUser]);

  const handleCreate = async (
    mode: "learn" | "draft_guided" | "draft_handsoff"
  ) => {
    if (creatingMode) return;
    setCreatingMode(mode);
    try {
      const title =
        mode === "learn" ? "Untitled Research Paper" : "Untitled Draft";
      const docId = await createDocument({ title, mode, citationStyle: "vancouver" });
      router.push(`/editor/${docId}`);
    } catch (err) {
      console.error("Failed to create document:", err);
    } finally {
      setCreatingMode(null);
    }
  };

  /* ── Loading ── */
  if (user === undefined || (user === null && isAuthenticated)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="font-mono text-sm text-muted-foreground">
            Loading your workspace&hellip;
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (user === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Unable to load your account. Please try refreshing the page.
            </p>
            <Button
              variant="outline"
              className="mt-4 min-h-[44px]"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Derived state ── */
  const tier = user.subscriptionTier || "free";
  const limits = LIMITS[tier] || LIMITS.free;
  const recentDocs = (documents ?? []).slice(0, 5);

  const usageStats = [
    {
      label: "Plagiarism Checks",
      icon: FileCheck2,
      used: user.plagiarismChecksUsed ?? 0,
      limit: limits.plagiarism,
      barColor: "bg-amber-500",
      iconCls: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
    {
      label: "AI Detection",
      icon: ShieldCheck,
      used: user.aiDetectionChecksUsed ?? 0,
      limit: limits.aiDetection,
      barColor: "bg-rose-500",
      iconCls: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    },
    {
      label: "Deep Research",
      icon: FlaskConical,
      used: user.deepResearchUsed ?? 0,
      limit: limits.deepResearch,
      barColor: "bg-violet-500",
      iconCls:
        "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    },
  ];

  const initials = (user.name || "R")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ── Render ── */
  return (
    <div className="space-y-8">
      {/* ─── Welcome Header ─── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {user.name || "Researcher"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your research workspace is ready.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="w-fit font-mono text-xs uppercase tracking-wide"
        >
          {tier} Plan
        </Badge>
      </div>

      {/* ─── Quick Actions ─── */}
      <section>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Quick Actions
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {quickActions.map((qa) => (
            <button
              key={qa.mode}
              onClick={() => handleCreate(qa.mode)}
              disabled={!!creatingMode}
              className="group text-left disabled:opacity-50"
            >
              <Card
                className={`h-full border-l-4 ${qa.borderCls} py-0 gap-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: qa.iconBg }}
                  >
                    {creatingMode === qa.mode ? (
                      <Loader2
                        className="h-5 w-5 animate-spin"
                        style={{ color: qa.iconColor }}
                      />
                    ) : (
                      <qa.icon
                        className="h-5 w-5"
                        style={{ color: qa.iconColor }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{qa.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {qa.subtitle}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Main Grid ─── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* ── Recent Drafts ── */}
        <section>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Recent Drafts
            </p>
            {recentDocs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] font-mono text-xs text-muted-foreground"
              >
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>

          {documents === undefined ? (
            <Card className="mt-4">
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : recentDocs.length === 0 ? (
            <Card className="mt-4">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">No drafts yet</h3>
                <p className="mt-1.5 max-w-[280px] text-sm text-muted-foreground">
                  Start your first research paper using one of the quick actions
                  above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-4 space-y-2">
              {recentDocs.map((doc) => {
                const mode = getModeConfig(doc.mode);
                const status = getStatusBadge(doc.status);
                return (
                  <Card
                    key={doc._id}
                    className={`group cursor-pointer border-l-4 ${mode.borderCls} py-0 gap-0 transition-all duration-200 hover:shadow-sm`}
                    onClick={() => router.push(`/editor/${doc._id}`)}
                  >
                    <CardContent className="flex items-center gap-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {doc.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`px-1.5 py-0 font-mono text-[10px] ${mode.badgeCls}`}
                          >
                            {mode.label}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`px-1.5 py-0 font-mono text-[10px] ${status.cls}`}
                          >
                            {status.label}
                          </Badge>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {doc.wordCount.toLocaleString()} words
                          </span>
                        </div>
                      </div>
                      <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:block">
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Sidebar ── */}
        <aside className="space-y-8">
          {/* Usage Stats */}
          <section>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Monthly Usage
            </p>
            <div className="mt-4 space-y-3">
              {usageStats.map((stat) => {
                const unavailable = stat.limit === 0;
                const unlimited = stat.limit === -1;
                const pct = unavailable
                  ? 0
                  : unlimited
                    ? Math.min((stat.used / 20) * 100, 100)
                    : Math.min((stat.used / stat.limit) * 100, 100);

                return (
                  <Card
                    key={stat.label}
                    className="py-0 gap-0 transition-shadow duration-200 hover:shadow-sm"
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconCls}`}
                          >
                            <stat.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">
                            {stat.label}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {unavailable
                            ? "N/A"
                            : unlimited
                              ? `${stat.used} used`
                              : `${stat.used}/${stat.limit}`}
                        </span>
                      </div>
                      {unavailable ? (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[32px] w-full font-mono text-xs"
                          >
                            Upgrade to unlock
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stat.barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Profile Summary */}
          <section>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Profile
            </p>
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary">
                    <span className="font-mono text-sm font-bold text-primary-foreground">
                      {initials}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px] uppercase"
                    >
                      {tier}
                    </Badge>
                  </div>
                  {user.institution && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Institution</span>
                      <span className="max-w-[160px] truncate text-right text-xs font-medium">
                        {user.institution}
                      </span>
                    </div>
                  )}
                  {user.specialization && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Specialization
                      </span>
                      <span className="max-w-[160px] truncate text-right text-xs font-medium">
                        {user.specialization}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="mt-5 min-h-[44px] w-full text-sm font-medium"
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </section>
        </aside>
      </div>
    </div>
  );
}
