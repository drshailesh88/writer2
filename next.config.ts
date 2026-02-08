import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core"],
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs in build output
  silent: true,

  // Upload source maps only when Sentry auth token is available
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Widen client file upload scope for better stack traces
  widenClientFileUpload: true,

  // Remove Sentry logger to reduce bundle size
  disableLogger: true,

  // Only upload source maps in production builds with auth token
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source map handling
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
