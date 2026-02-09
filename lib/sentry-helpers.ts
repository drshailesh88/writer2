import * as Sentry from "@sentry/nextjs";

/** Set Sentry user context from Clerk auth data. */
export function setSentryUser(clerkUserId: string | null) {
  if (clerkUserId) {
    Sentry.setUser({ id: clerkUserId });
  } else {
    Sentry.setUser(null);
  }
}

/** Capture API route error with context. Strips sensitive fields from extra. */
export function captureApiError(
  error: unknown,
  route: string,
  extra?: Record<string, unknown>
) {
  // Redact fields that could contain PHI or user content
  const safeExtra = extra ? { ...extra } : undefined;
  if (safeExtra) {
    for (const key of ["topic", "inputText", "content", "body", "query"]) {
      if (key in safeExtra) {
        safeExtra[key] = "[Redacted]";
      }
    }
  }

  Sentry.captureException(error, {
    tags: { route },
    extra: safeExtra,
  });
}
