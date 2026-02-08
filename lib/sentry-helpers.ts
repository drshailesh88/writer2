import * as Sentry from "@sentry/nextjs";

/** Set Sentry user context from Clerk auth data. */
export function setSentryUser(clerkUserId: string | null) {
  if (clerkUserId) {
    Sentry.setUser({ id: clerkUserId });
  } else {
    Sentry.setUser(null);
  }
}

/** Capture API route error with context. */
export function captureApiError(
  error: unknown,
  route: string,
  extra?: Record<string, unknown>
) {
  Sentry.captureException(error, {
    tags: { route },
    extra,
  });
}
