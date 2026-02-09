"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useUser } from "@clerk/nextjs";
import { ReactNode, useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Initialize PostHog (client-side only, when key is available)
if (typeof window !== "undefined" && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    loaded: (ph) => {
      // Disable in development unless explicitly enabled
      if (process.env.NODE_ENV === "development") {
        ph.opt_out_capturing();
      }
    },
  });
}

/** Identifies the user in PostHog after Clerk auth. */
function PostHogIdentify() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !POSTHOG_KEY) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      });
    } else {
      posthog.reset();
    }
  }, [user, isLoaded]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY) {
    // No PostHog key — render children without tracking
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}
