# Data Model: Convex Database Schema

**Feature**: 002-convex-database-schema
**Date**: 2026-02-07

## Entity Relationship Overview

```
Users ──1:N──> Documents
Users ──1:N──> Papers
Users ──1:N──> Collections
Users ──1:N──> PlagiarismChecks
Users ──1:N──> AiDetectionChecks
Users ──1:N──> DeepResearchReports
Users ──1:N──> LearnModeSessions
Users ──1:1──> Subscriptions

Collections ──1:N──> Papers (optional)
Documents ──1:N──> Citations
Papers ──1:N──> Citations
Documents ──1:N──> LearnModeSessions
Documents ──0:N──> PlagiarismChecks (optional)
Documents ──0:N──> AiDetectionChecks (optional)
```

## Entities

### 1. Users (EXTEND existing)

**New fields to add** (existing: clerkId, email, name, avatarUrl, subscriptionTier, createdAt, updatedAt):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| institution | string | optional | University/hospital name |
| specialization | string | optional | Medical specialization |
| razorpayCustomerId | string | optional | Razorpay customer ID for payments |
| plagiarismChecksUsed | number | required | Monthly counter, default 0 |
| aiDetectionChecksUsed | number | required | Monthly counter, default 0 |
| deepResearchUsed | number | required | Monthly counter, default 0 |

**Indexes**: `by_clerk_id` (existing), `by_email` (existing)

### 2. Documents

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | id("users") | required | Owner reference |
| title | string | required | Document title |
| content | any | optional | Tiptap JSON document content |
| mode | union("learn", "draft_guided", "draft_handsoff") | required | Writing mode |
| currentStage | string | optional | Progress through workflow |
| outlineData | any | optional | Approved outline JSON |
| approvedPapers | any | optional | Papers approved per section JSON |
| citationStyle | union("vancouver", "apa", "ama", "chicago") | required | Citation format |
| wordCount | number | required | Current word count, default 0 |
| status | union("in_progress", "completed", "archived") | required | Document status |
| createdAt | number | required | Timestamp |
| updatedAt | number | required | Timestamp |

**Indexes**: `by_user_id` ["userId"], `by_user_and_status` ["userId", "status"]

### 3. Papers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | id("users") | required | Owner reference |
| collectionId | id("collections") | optional | Collection reference |
| externalId | string | required | PubMed ID / Semantic Scholar ID / DOI |
| source | union("pubmed", "semantic_scholar", "openalex", "uploaded") | required | Paper source |
| title | string | required | Paper title |
| authors | array(string) | required | Author names |
| journal | string | optional | Journal name |
| year | number | optional | Publication year |
| abstract | string | optional | Paper abstract |
| doi | string | optional | Digital Object Identifier |
| url | string | optional | External link |
| pdfFileId | id("_storage") | optional | Convex file storage reference |
| isOpenAccess | boolean | required | Open access flag |
| metadata | any | optional | Additional metadata JSON |
| createdAt | number | required | Timestamp |

**Indexes**: `by_user_id` ["userId"], `by_external_id` ["externalId"], `by_collection_id` ["collectionId"]

### 4. Collections

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | id("users") | required | Owner reference |
| name | string | required | Collection name |
| description | string | optional | Collection description |
| createdAt | number | required | Timestamp |

**Indexes**: `by_user_id` ["userId"]

### 5. Citations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| documentId | id("documents") | required | Document reference |
| paperId | id("papers") | required | Paper reference |
| sectionName | string | required | Which section the citation is in |
| position | number | required | Position in document |
| citationText | string | required | Formatted citation text |

**Indexes**: `by_document_id` ["documentId"]

### 6. PlagiarismChecks

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | id("users") | optional | Owner (null for anonymous funnel) |
| documentId | id("documents") | optional | Document reference |
| inputText | string | required | Text that was checked |
| wordCount | number | required | Word count of input |
| overallSimilarity | number | optional | Percentage, set on completion |
| sources | any | optional | Array of matching sources JSON |
| copyleaksScanId | string | optional | External scan reference |
| status | union("pending", "completed", "failed") | required | Check status |
| createdAt | number | required | Timestamp |

**Indexes**: `by_user_id` ["userId"], `by_status` ["status"]

### 7. AiDetectionChecks

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | id("users") | required | Owner reference |
| documentId | id("documents") | optional | Document reference |
| inputText | string | required | Text that was checked |
| wordCount | number | required | Word count of input |
| overallAiScore | number | optional | Percentage, set on completion |
| sentenceResults | any | optional | Per-sentence analysis JSON |
| copyleaksScanId | string | optional | External scan reference |
| status | union("pending", "completed", "failed") | required | Check status |
| createdAt | number | required | Timestamp |

**Indexes**: `by_user_id` ["userId"], `by_status` ["status"]

### 8. DeepResearchReports

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | id("users") | required | Owner reference |
| topic | string | required | Research topic |
| report | string | optional | Markdown report content |
| citedPapers | any | optional | Array of cited papers JSON |
| status | union("pending", "in_progress", "completed", "failed") | required | Report status |
| createdAt | number | required | Timestamp |

**Indexes**: `by_user_id` ["userId"], `by_status` ["status"]

### 9. LearnModeSessions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | id("users") | required | Owner reference |
| documentId | id("documents") | required | Document reference |
| currentStage | union("understand", "literature", "outline", "drafting", "feedback") | required | 5-stage progression |
| conversationHistory | any | optional | Array of messages JSON |
| feedbackGiven | any | optional | Structured feedback JSON |
| createdAt | number | required | Timestamp |
| updatedAt | number | required | Timestamp |

**Indexes**: `by_user_id` ["userId"], `by_document_id` ["documentId"]

### 10. Subscriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | id("users") | required | Owner reference |
| razorpaySubscriptionId | string | required | Razorpay subscription ID |
| planType | union("basic", "pro") | required | Subscription plan |
| status | union("active", "paused", "cancelled", "expired") | required | Subscription status |
| currentPeriodStart | number | required | Billing period start timestamp |
| currentPeriodEnd | number | required | Billing period end timestamp |
| createdAt | number | required | Timestamp |

**Indexes**: `by_user_id` ["userId"], `by_status` ["status"]

## Subscription Limits Table

| Feature | No Signup | Free | Basic | Pro |
|---------|-----------|------|-------|-----|
| Plagiarism Checks/month | 1 (1000 words) | 2 | 5 | 20 |
| AI Detection Checks/month | 0 | 2 | 10 | Unlimited |
| Deep Research Reports/month | 0 | 0 | 5 | 15 |
| Draft Mode | No | No | Yes | Yes |
| Learn Mode | No | Yes | Yes | Yes |
