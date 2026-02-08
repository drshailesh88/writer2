import { describe, it, expect } from "vitest";
import {
  checkUsageLimit,
  SUBSCRIPTION_LIMITS,
  TOKEN_ALLOCATIONS,
  getTokenLimit,
  type SubscriptionTier,
} from "@/convex/lib/subscriptionLimits";

const tiers: SubscriptionTier[] = ["none", "free", "basic", "pro"];
const features = [
  "plagiarism",
  "aiDetection",
  "deepResearch",
  "draftMode",
  "learnMode",
  "export",
] as const;

describe("SUBSCRIPTION_LIMITS", () => {
  it("has entries for all 4 tiers", () => {
    for (const tier of tiers) {
      expect(SUBSCRIPTION_LIMITS[tier]).toBeDefined();
    }
  });

  it("has entries for all 6 features per tier", () => {
    for (const tier of tiers) {
      for (const feature of features) {
        expect(typeof SUBSCRIPTION_LIMITS[tier][feature]).toBe("number");
      }
    }
  });

  it("none tier has only plagiarism=1, rest=0", () => {
    expect(SUBSCRIPTION_LIMITS.none.plagiarism).toBe(1);
    expect(SUBSCRIPTION_LIMITS.none.aiDetection).toBe(0);
    expect(SUBSCRIPTION_LIMITS.none.deepResearch).toBe(0);
    expect(SUBSCRIPTION_LIMITS.none.draftMode).toBe(0);
    expect(SUBSCRIPTION_LIMITS.none.learnMode).toBe(0);
    expect(SUBSCRIPTION_LIMITS.none.export).toBe(0);
  });

  it("pro tier has unlimited draftMode, learnMode, export", () => {
    expect(SUBSCRIPTION_LIMITS.pro.draftMode).toBe(-1);
    expect(SUBSCRIPTION_LIMITS.pro.learnMode).toBe(-1);
    expect(SUBSCRIPTION_LIMITS.pro.export).toBe(-1);
  });
});

describe("checkUsageLimit", () => {
  it("returns allowed=false with reason for features with limit=0", () => {
    const result = checkUsageLimit("none", "aiDetection", 0);
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(0);
    expect(result.reason).toContain("not available");
    expect(result.reason).toContain("none");
  });

  it("returns allowed=true for unlimited features (limit=-1)", () => {
    const result = checkUsageLimit("basic", "draftMode", 999);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
    expect(result.reason).toBeUndefined();
  });

  it("returns allowed=true when usage < limit", () => {
    const result = checkUsageLimit("free", "plagiarism", 1);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(2);
  });

  it("returns allowed=false when usage >= limit", () => {
    const result = checkUsageLimit("free", "plagiarism", 2);
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(2);
    expect(result.reason).toContain("Monthly limit reached");
  });

  it("returns allowed=false when usage > limit", () => {
    const result = checkUsageLimit("free", "plagiarism", 5);
    expect(result.allowed).toBe(false);
  });

  it("treats undefined currentUsage as 0", () => {
    const result = checkUsageLimit("free", "plagiarism", undefined);
    expect(result.allowed).toBe(true);
  });

  it("works for all tier × feature combinations without throwing", () => {
    for (const tier of tiers) {
      for (const feature of features) {
        expect(() => checkUsageLimit(tier, feature, 0)).not.toThrow();
        expect(() => checkUsageLimit(tier, feature, 100)).not.toThrow();
        expect(() => checkUsageLimit(tier, feature, undefined)).not.toThrow();
      }
    }
  });
});

describe("TOKEN_ALLOCATIONS", () => {
  it("has allocations for all tiers", () => {
    expect(TOKEN_ALLOCATIONS.none).toBe(0);
    expect(TOKEN_ALLOCATIONS.free).toBe(200);
    expect(TOKEN_ALLOCATIONS.basic).toBe(5000);
    expect(TOKEN_ALLOCATIONS.pro).toBe(15000);
  });
});

describe("getTokenLimit", () => {
  it("returns correct token limit per tier", () => {
    expect(getTokenLimit("none")).toBe(0);
    expect(getTokenLimit("free")).toBe(200);
    expect(getTokenLimit("basic")).toBe(5000);
    expect(getTokenLimit("pro")).toBe(15000);
  });
});
