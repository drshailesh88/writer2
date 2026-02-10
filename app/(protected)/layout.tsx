"use client";

import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { NavShell } from "@/components/nav-shell";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";

const SESSION_HEARTBEAT_MS = 60_000; // 60 seconds

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useClerk();
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const heartbeat = useMutation(api.sessionPresence.heartbeat);
  const removeSession = useMutation(api.sessionPresence.removeSession);
  const sessionIdRef = useRef<string | null>(null);
  const [sessionBlocked, setSessionBlocked] = useState(false);
  const [sessionBlockMessage, setSessionBlockMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (isAuthenticated) {
      getOrCreateUser().catch(console.error);
    }
  }, [isAuthenticated, getOrCreateUser]);

  // Session presence heartbeat
  useEffect(() => {
    if (!isAuthenticated || sessionBlocked) return;

    // Stable session ID for this tab — persists across HMR and page refreshes
    if (!sessionIdRef.current) {
      const stored = typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("v1d_session_id")
        : null;
      if (stored) {
        sessionIdRef.current = stored;
      } else {
        const id = crypto.randomUUID();
        sessionIdRef.current = id;
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("v1d_session_id", id);
        }
      }
    }
    const sessionId = sessionIdRef.current;

    // Initial heartbeat
    const handleSessionError = (err: unknown) => {
      const message = err instanceof Error ? err.message : "Session limit reached";
      const lowered = message.toLowerCase();
      if (lowered.includes("maximum") || lowered.includes("concurrent sessions")) {
        setSessionBlocked(true);
        setSessionBlockMessage(message);
        return true;
      }
      console.warn("Session heartbeat failed:", err);
      return false;
    };

    heartbeat({ sessionId }).catch(handleSessionError);

    // Periodic heartbeat
    const interval = setInterval(() => {
      heartbeat({ sessionId }).catch((err) => {
        if (handleSessionError(err)) {
          clearInterval(interval);
        }
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
  }, [isAuthenticated, sessionBlocked, heartbeat, removeSession]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (sessionBlocked) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavShell />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <h1 className="text-2xl font-semibold">Session limit reached</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionBlockMessage || "Please close another session and try again."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => {
                setSessionBlocked(false);
                setSessionBlockMessage(null);
              }}
            >
              Retry
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </main>
        <Footer />
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
