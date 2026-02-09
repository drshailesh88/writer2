import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance sampling — 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only send errors in production (or when DSN is set)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Scrub potentially sensitive data from error events
  beforeSend(event) {
    if (event.request?.data) {
      event.request.data = "[Redacted]";
    }
    if (event.request?.query_string) {
      event.request.query_string = "[Redacted]";
    }
    return event;
  },
});
