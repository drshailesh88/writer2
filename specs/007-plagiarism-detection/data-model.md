# Data Model: Plagiarism & AI Detection with Payments

**Feature Branch**: `007-plagiarism-detection`
**Date**: 2026-02-07

> Note: All entities below already exist in the Convex schema (`convex/schema.ts`) from Task 2.
> This document maps spec entities to the existing schema and notes any extensions needed.

## Existing Entities (No Changes Required)

### Users (extended fields)

Already has the following fields relevant to this feature:

| Field | Type | Description |
|-------|------|-------------|
| subscriptionTier | "none" \| "free" \| "basic" \| "pro" | Current subscription tier |
| razorpayCustomerId | string? | Razorpay customer reference |
| plagiarismChecksUsed | number? | Monthly plagiarism check counter |
| aiDetectionChecksUsed | number? | Monthly AI detection check counter |
| deepResearchUsed | number? | Monthly deep research counter |

### Plagiarism Checks

| Field | Type | Description |
|-------|------|-------------|
| userId | Id<"users">? | Optional — null for anonymous free checks |
| documentId | Id<"documents">? | Optional — links to editor document |
| inputText | string | Text submitted for checking |
| wordCount | number | Word count of submitted text |
| overallSimilarity | number? | Similarity percentage (0-100) |
| sources | any? | Array of matching sources (JSON) |
| copyleaksScanId | string? | External scan ID for tracking |
| status | "pending" \| "completed" \| "failed" | Scan lifecycle state |
| createdAt | number | Timestamp |

**Indexes**: `by_user_id`, `by_status`

**State Transitions**: `pending` → `completed` (success) or `pending` → `failed` (error)

### AI Detection Checks

| Field | Type | Description |
|-------|------|-------------|
| userId | Id<"users"> | Required — no anonymous AI detection |
| documentId | Id<"documents">? | Optional — links to editor document |
| inputText | string | Text submitted for checking |
| wordCount | number | Word count of submitted text |
| overallAiScore | number? | AI probability percentage (0-100) |
| sentenceResults | any? | Per-sentence AI scores (JSON array) |
| copyleaksScanId | string? | External scan ID for tracking |
| status | "pending" \| "completed" \| "failed" | Scan lifecycle state |
| createdAt | number | Timestamp |

**Indexes**: `by_user_id`, `by_status`

**State Transitions**: `pending` → `completed` (success) or `pending` → `failed` (error)

### Subscriptions

| Field | Type | Description |
|-------|------|-------------|
| userId | Id<"users"> | Owner of subscription |
| razorpaySubscriptionId | string | Razorpay subscription reference |
| planType | "basic" \| "pro" | Plan tier |
| status | "active" \| "paused" \| "cancelled" \| "expired" | Subscription lifecycle |
| currentPeriodStart | number | Billing period start timestamp |
| currentPeriodEnd | number | Billing period end timestamp |
| createdAt | number | Timestamp |

**Indexes**: `by_user_id`, `by_status`

**State Transitions**:
- `active` → `paused` (payment failed, grace period)
- `paused` → `active` (payment retried successfully)
- `paused` → `expired` (grace period expired, 3 days)
- `active` → `cancelled` (user cancels, effective at period end)

### Subscription Limits (existing utility)

Already defined in `convex/lib/subscriptionLimits.ts`:

| Tier | Plagiarism | AI Detection | Deep Research | Draft Mode | Learn Mode |
|------|-----------|--------------|---------------|------------|------------|
| none | 1 | 0 | 0 | 0 | 0 |
| free | 2 | 2 | 0 | 0 | unlimited |
| basic | 5 | 10 | 5 | unlimited | unlimited |
| pro | 20 | unlimited | 15 | unlimited | unlimited |

## New Data: Sources JSON Structure

The `sources` field in `plagiarismChecks` will store an array with the following shape:

```typescript
type PlagiarismSource = {
  id: string;          // Copyleaks source ID
  title: string;       // Source document title
  url: string;         // Source URL
  matchedWords: number; // Number of matched words
  totalWords: number;  // Total words in comparison
  similarity: number;  // Percentage similarity with this source
  matchedText: string; // Snippet of matched text
};
```

## New Data: Sentence Results JSON Structure

The `sentenceResults` field in `aiDetectionChecks` will store an array with the following shape:

```typescript
type SentenceAiResult = {
  text: string;                    // The sentence text
  startPosition: number;           // Character offset start
  endPosition: number;             // Character offset end
  classification: "human" | "ai";  // Classification
  probability: number;             // 0-1 probability score
};
```

## No Schema Changes Required

All tables, fields, indexes, and relationships needed for this feature already exist in `convex/schema.ts`. The Convex mutations in `convex/plagiarismChecks.ts`, `convex/aiDetectionChecks.ts`, and `convex/subscriptions.ts` already handle the core CRUD operations and usage limit checking.
