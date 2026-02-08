# Convex Function Contracts

**Feature**: 002-convex-database-schema
**Date**: 2026-02-07

## Users (convex/users.ts) — EXTEND

### Existing (keep)
- `users.getOrCreate` — mutation, no args, returns user doc
- `users.getCurrent` — query, no args, returns user doc | null

### New
- `users.updateProfile` — mutation
  - Args: `{ institution?: string, specialization?: string }`
  - Returns: void
  - Auth: required

- `users.resetMonthlyUsage` — internalMutation
  - Args: `{ userId: Id<"users"> }`
  - Returns: void
  - Note: Called by scheduled job at month boundary

## Documents (convex/documents.ts) — NEW

- `documents.create` — mutation
  - Args: `{ title: string, mode: "learn" | "draft_guided" | "draft_handsoff", citationStyle: "vancouver" | "apa" | "ama" | "chicago" }`
  - Returns: Id<"documents">
  - Auth: required

- `documents.get` — query
  - Args: `{ documentId: Id<"documents"> }`
  - Returns: document doc | null
  - Auth: required (ownership check)

- `documents.list` — query
  - Args: `{ status?: "in_progress" | "completed" | "archived" }`
  - Returns: document[]
  - Auth: required (scoped to user)

- `documents.update` — mutation
  - Args: `{ documentId: Id<"documents">, title?: string, content?: any, currentStage?: string, outlineData?: any, approvedPapers?: any, citationStyle?: string, wordCount?: number, status?: string }`
  - Returns: void
  - Auth: required (ownership check)

- `documents.archive` — mutation
  - Args: `{ documentId: Id<"documents"> }`
  - Returns: void
  - Auth: required (ownership check)

## Papers (convex/papers.ts) — NEW

- `papers.save` — mutation
  - Args: `{ externalId: string, source: string, title: string, authors: string[], journal?: string, year?: number, abstract?: string, doi?: string, url?: string, isOpenAccess: boolean, metadata?: any, collectionId?: Id<"collections"> }`
  - Returns: Id<"papers">
  - Auth: required

- `papers.get` — query
  - Args: `{ paperId: Id<"papers"> }`
  - Returns: paper doc | null
  - Auth: required

- `papers.list` — query
  - Args: `{ collectionId?: Id<"collections"> }`
  - Returns: paper[]
  - Auth: required (scoped to user)

- `papers.update` — mutation
  - Args: `{ paperId: Id<"papers">, collectionId?: Id<"collections">, pdfFileId?: Id<"_storage"> }`
  - Returns: void
  - Auth: required

- `papers.remove` — mutation
  - Args: `{ paperId: Id<"papers"> }`
  - Returns: void
  - Auth: required

- `papers.getByExternalId` — query
  - Args: `{ externalId: string }`
  - Returns: paper doc | null
  - Auth: required (scoped to user)

## Collections (convex/collections.ts) — NEW

- `collections.create` — mutation
  - Args: `{ name: string, description?: string }`
  - Returns: Id<"collections">
  - Auth: required

- `collections.list` — query
  - Args: `{}`
  - Returns: collection[]
  - Auth: required (scoped to user)

- `collections.update` — mutation
  - Args: `{ collectionId: Id<"collections">, name?: string, description?: string }`
  - Returns: void
  - Auth: required

- `collections.remove` — mutation
  - Args: `{ collectionId: Id<"collections"> }`
  - Returns: void
  - Auth: required

## Citations (convex/citations.ts) — NEW

- `citations.insert` — mutation
  - Args: `{ documentId: Id<"documents">, paperId: Id<"papers">, sectionName: string, position: number, citationText: string }`
  - Returns: Id<"citations">
  - Auth: required

- `citations.listByDocument` — query
  - Args: `{ documentId: Id<"documents"> }`
  - Returns: citation[] (ordered by position)
  - Auth: required

- `citations.update` — mutation
  - Args: `{ citationId: Id<"citations">, position?: number, citationText?: string }`
  - Returns: void
  - Auth: required

- `citations.remove` — mutation
  - Args: `{ citationId: Id<"citations"> }`
  - Returns: void
  - Auth: required

## PlagiarismChecks (convex/plagiarismChecks.ts) — NEW

- `plagiarismChecks.create` — mutation
  - Args: `{ inputText: string, wordCount: number, documentId?: Id<"documents"> }`
  - Returns: Id<"plagiarismChecks">
  - Auth: optional (supports anonymous funnel)
  - Note: Checks usage limit before creating

- `plagiarismChecks.updateResult` — mutation
  - Args: `{ checkId: Id<"plagiarismChecks">, overallSimilarity: number, sources: any, copyleaksScanId: string, status: "completed" | "failed" }`
  - Returns: void

- `plagiarismChecks.get` — query
  - Args: `{ checkId: Id<"plagiarismChecks"> }`
  - Returns: check doc | null

- `plagiarismChecks.listByUser` — query
  - Args: `{}`
  - Returns: check[]
  - Auth: required

## AiDetectionChecks (convex/aiDetectionChecks.ts) — NEW

- `aiDetectionChecks.create` — mutation
  - Args: `{ inputText: string, wordCount: number, documentId?: Id<"documents"> }`
  - Returns: Id<"aiDetectionChecks">
  - Auth: required
  - Note: Checks usage limit before creating

- `aiDetectionChecks.updateResult` — mutation
  - Args: `{ checkId: Id<"aiDetectionChecks">, overallAiScore: number, sentenceResults: any, copyleaksScanId: string, status: "completed" | "failed" }`
  - Returns: void

- `aiDetectionChecks.get` — query
  - Args: `{ checkId: Id<"aiDetectionChecks"> }`
  - Returns: check doc | null

- `aiDetectionChecks.listByUser` — query
  - Args: `{}`
  - Returns: check[]
  - Auth: required

## DeepResearchReports (convex/deepResearchReports.ts) — NEW

- `deepResearchReports.create` — mutation
  - Args: `{ topic: string }`
  - Returns: Id<"deepResearchReports">
  - Auth: required
  - Note: Checks usage limit before creating

- `deepResearchReports.updateResult` — mutation
  - Args: `{ reportId: Id<"deepResearchReports">, report: string, citedPapers: any, status: "in_progress" | "completed" | "failed" }`
  - Returns: void

- `deepResearchReports.get` — query
  - Args: `{ reportId: Id<"deepResearchReports"> }`
  - Returns: report doc | null

- `deepResearchReports.listByUser` — query
  - Args: `{}`
  - Returns: report[]
  - Auth: required

## LearnModeSessions (convex/learnModeSessions.ts) — NEW

- `learnModeSessions.create` — mutation
  - Args: `{ documentId: Id<"documents"> }`
  - Returns: Id<"learnModeSessions">
  - Auth: required

- `learnModeSessions.get` — query
  - Args: `{ sessionId: Id<"learnModeSessions"> }`
  - Returns: session doc | null

- `learnModeSessions.getByDocument` — query
  - Args: `{ documentId: Id<"documents"> }`
  - Returns: session doc | null

- `learnModeSessions.update` — mutation
  - Args: `{ sessionId: Id<"learnModeSessions">, currentStage?: string, conversationHistory?: any, feedbackGiven?: any }`
  - Returns: void

## Subscriptions (convex/subscriptions.ts) — NEW

- `subscriptions.create` — mutation
  - Args: `{ razorpaySubscriptionId: string, planType: "basic" | "pro", currentPeriodStart: number, currentPeriodEnd: number }`
  - Returns: Id<"subscriptions">
  - Auth: required

- `subscriptions.getByUser` — query
  - Args: `{}`
  - Returns: subscription doc | null
  - Auth: required

- `subscriptions.updateStatus` — mutation
  - Args: `{ subscriptionId: Id<"subscriptions">, status: "active" | "paused" | "cancelled" | "expired", currentPeriodStart?: number, currentPeriodEnd?: number }`
  - Returns: void

## Files (convex/files.ts) — NEW

- `files.generateUploadUrl` — mutation
  - Args: `{}`
  - Returns: string (upload URL)
  - Auth: required

- `files.getUrl` — query
  - Args: `{ storageId: Id<"_storage"> }`
  - Returns: string | null (download URL)

## Subscription Limits (convex/lib/subscriptionLimits.ts) — NEW

- `checkUsageLimit(tier, feature)` — pure function
  - Args: tier ("none" | "free" | "basic" | "pro"), feature ("plagiarism" | "aiDetection" | "deepResearch" | "draftMode" | "learnMode")
  - Returns: `{ allowed: boolean, limit: number | "unlimited", used?: number, reason?: string }`
  - Note: Not a Convex function — imported by mutations that need limit checks

- `SUBSCRIPTION_LIMITS` — exported constant
  - Type: Record<tier, Record<feature, number | -1>>
  - -1 means unlimited
