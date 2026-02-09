import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users (extended from Task 1) ───
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    institution: v.optional(v.string()),
    specialization: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("none"),
      v.literal("free"),
      v.literal("basic"),
      v.literal("pro")
    ),
    razorpayCustomerId: v.optional(v.string()),
    plagiarismChecksUsed: v.optional(v.number()),
    aiDetectionChecksUsed: v.optional(v.number()),
    deepResearchUsed: v.optional(v.number()),
    learnModeSessionsUsed: v.optional(v.number()),
    tokensUsed: v.optional(v.number()),
    tokensLimit: v.optional(v.number()),
    lastTokenReset: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // ─── Documents (Drafts/Papers) ───
  documents: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.optional(v.any()),
    mode: v.union(
      v.literal("learn"),
      v.literal("draft_guided"),
      v.literal("draft_handsoff")
    ),
    currentStage: v.optional(v.string()),
    outlineData: v.optional(v.any()),
    approvedPapers: v.optional(v.any()),
    citationStyle: v.union(
      v.literal("vancouver"),
      v.literal("apa"),
      v.literal("ama"),
      v.literal("chicago")
    ),
    wordCount: v.number(),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("archived")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // ─── Papers (Saved to Library) ───
  papers: defineTable({
    userId: v.id("users"),
    collectionId: v.optional(v.id("collections")),
    externalId: v.string(),
    source: v.union(
      v.literal("pubmed"),
      v.literal("semantic_scholar"),
      v.literal("openalex"),
      v.literal("uploaded")
    ),
    title: v.string(),
    authors: v.array(v.string()),
    journal: v.optional(v.string()),
    year: v.optional(v.number()),
    abstract: v.optional(v.string()),
    doi: v.optional(v.string()),
    url: v.optional(v.string()),
    pdfFileId: v.optional(v.id("_storage")),
    isOpenAccess: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_external_id", ["externalId"])
    .index("by_collection_id", ["collectionId"]),

  // ─── Collections (Library Folders) ───
  collections: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),

  // ─── Citations (In-Document Citations) ───
  citations: defineTable({
    documentId: v.id("documents"),
    paperId: v.id("papers"),
    sectionName: v.string(),
    position: v.number(),
    citationText: v.string(),
  }).index("by_document_id", ["documentId"]),

  // ─── Plagiarism Checks ───
  plagiarismChecks: defineTable({
    userId: v.optional(v.id("users")),
    documentId: v.optional(v.id("documents")),
    inputText: v.string(),
    wordCount: v.number(),
    overallSimilarity: v.optional(v.number()),
    sources: v.optional(v.any()),
    copyleaksScanId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"]),

  // ─── AI Detection Checks ───
  aiDetectionChecks: defineTable({
    userId: v.id("users"),
    documentId: v.optional(v.id("documents")),
    inputText: v.string(),
    wordCount: v.number(),
    overallAiScore: v.optional(v.number()),
    sentenceResults: v.optional(v.any()),
    copyleaksScanId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"]),

  // ─── Deep Research Reports ───
  deepResearchReports: defineTable({
    userId: v.id("users"),
    topic: v.string(),
    report: v.optional(v.string()),
    citedPapers: v.optional(v.any()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"]),

  // ─── Learn Mode Sessions ───
  learnModeSessions: defineTable({
    userId: v.id("users"),
    documentId: v.id("documents"),
    currentStage: v.union(
      v.literal("understand"),
      v.literal("literature"),
      v.literal("outline"),
      v.literal("drafting"),
      v.literal("feedback")
    ),
    conversationHistory: v.optional(v.any()),
    feedbackGiven: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_document_id", ["documentId"]),

  // ─── Workflow Runs (Persistent state for Draft/Learn mode workflows) ───
  workflowRuns: defineTable({
    userId: v.id("users"),
    documentId: v.id("documents"),
    workflowType: v.union(
      v.literal("draft_guided"),
      v.literal("draft_handsoff"),
      v.literal("learn")
    ),
    status: v.union(
      v.literal("running"),
      v.literal("suspended"),
      v.literal("completed"),
      v.literal("failed")
    ),
    currentStep: v.optional(v.string()),
    stepData: v.optional(v.any()),
    runObject: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user_and_document", ["userId", "documentId"])
    .index("by_status", ["status"])
    .index("by_expires_at", ["expiresAt"]),

  // ─── Search Cache (persistent, survives cold starts) ───
  searchCache: defineTable({
    queryHash: v.string(),
    results: v.any(),
    totalResults: v.number(),
    sourceStatus: v.optional(v.any()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_query_hash", ["queryHash"])
    .index("by_expires_at", ["expiresAt"]),

  // ─── Session Presence (concurrent session limit) ───
  sessionPresence: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    lastActive: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_session_id", ["sessionId"]),

  // ─── Subscriptions ───
  subscriptions: defineTable({
    userId: v.id("users"),
    razorpaySubscriptionId: v.string(),
    planType: v.union(v.literal("basic"), v.literal("pro")),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_razorpay_id", ["razorpaySubscriptionId"]),
});
