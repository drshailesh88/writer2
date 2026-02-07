type SubscriptionTier = "none" | "free" | "basic" | "pro";
type Feature = "plagiarism" | "aiDetection" | "deepResearch" | "draftMode" | "learnMode" | "export";

// -1 means unlimited, 0 means not available
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, Record<Feature, number>> = {
  none: {
    plagiarism: 1,
    aiDetection: 0,
    deepResearch: 0,
    draftMode: 0,
    learnMode: 0,
    export: 0,
  },
  free: {
    plagiarism: 2,
    aiDetection: 2,
    deepResearch: 0,
    draftMode: 0,
    learnMode: 3,
    export: 0,
  },
  basic: {
    plagiarism: 5,
    aiDetection: 10,
    deepResearch: 5,
    draftMode: -1,
    learnMode: -1,
    export: -1,
  },
  pro: {
    plagiarism: 20,
    aiDetection: -1,
    deepResearch: 15,
    draftMode: -1,
    learnMode: -1,
    export: -1,
  },
};

export function checkUsageLimit(
  tier: SubscriptionTier,
  feature: Feature,
  currentUsage: number | undefined
): { allowed: boolean; limit: number; reason?: string } {
  const usage = currentUsage ?? 0;
  const limit = SUBSCRIPTION_LIMITS[tier][feature];

  if (limit === 0) {
    return {
      allowed: false,
      limit: 0,
      reason: `${feature} is not available on the ${tier} plan. Please upgrade.`,
    };
  }

  if (limit === -1) {
    return { allowed: true, limit: -1 };
  }

  if (usage >= limit) {
    return {
      allowed: false,
      limit,
      reason: `Monthly limit reached: ${usage}/${limit} ${feature} checks used. Resets next month.`,
    };
  }

  return { allowed: true, limit };
}
