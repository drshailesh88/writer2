"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "28rem" }}>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "1.5rem",
              }}
            >
              An unexpected error occurred. Please try again or return to the
              dashboard.
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                Try Again
              </button>
              <a
                href="/dashboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#111827",
                  textDecoration: "none",
                  minHeight: "44px",
                }}
              >
                Go to Dashboard
              </a>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                marginTop: "1rem",
              }}
            >
              If this keeps happening,{" "}
              <a
                href="mailto:support@v1drafts.com"
                style={{ textDecoration: "underline", color: "#6b7280" }}
              >
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
