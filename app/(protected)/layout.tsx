"use client";

import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";
import { NavShell } from "@/components/nav-shell";
import { Footer } from "@/components/footer";

const SESSION_HEARTBEAT_MS = 60_000; // 60 seconds

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const heartbeat = useMutation(api.sessionPresence.heartbeat);
  const removeSession = useMutation(api.sessionPresence.removeSession);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      getOrCreateUser().catch(console.error);
    }
  }, [isAuthenticated, getOrCreateUser]);

  // Session presence heartbeat
  useEffect(() => {
    if (!isAuthenticated) return;

    // Generate a stable session ID for this tab
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID();
    }
    const sessionId = sessionIdRef.current;

    // Initial heartbeat
    heartbeat({ sessionId }).catch((err) => {
      console.warn("Session heartbeat failed:", err);
    });

    // Periodic heartbeat
    const interval = setInterval(() => {
      heartbeat({ sessionId }).catch((err) => {
        console.warn("Session heartbeat failed:", err);
      });
    }, SESSION_HEARTBEAT_MS);

    // Cleanup on unmount or tab close
    const handleUnload = () => {
      removeSession({ sessionId }).catch(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      removeSession({ sessionId }).catch(() => {});
    };
  }, [isAuthenticated, heartbeat, removeSession]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavShell />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
