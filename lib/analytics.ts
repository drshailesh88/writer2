import { getPostHogServer } from "./posthog-server";

/**
 * Track a server-side analytics event.
 * Safe to call even if PostHog is not configured — will no-op.
 */
export function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const posthog = getPostHogServer();
  if (!posthog) return;

  const sanitizedProperties = properties
    ? sanitizeProperties(properties)
    : undefined;

  posthog.capture({
    distinctId,
    event,
    properties: sanitizedProperties,
  });
}

function sanitizeProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const redactedKeys =
    /text|content|prompt|topic|message|draft|notes|abstract|question/i;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (redactedKeys.test(key)) {
      if (typeof value === "string") {
        sanitized[key] = "[Redacted]";
        sanitized[`${key}_length`] = value.length;
      } else {
        sanitized[key] = "[Redacted]";
      }
      continue;
    }

    if (typeof value === "string" && value.length > 200) {
      sanitized[key] = "[Redacted]";
      sanitized[`${key}_length`] = value.length;
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}
