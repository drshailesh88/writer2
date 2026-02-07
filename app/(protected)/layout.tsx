"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { NavShell } from "@/components/nav-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreate);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getOrCreateUser().catch(console.error);
    }
  }, [isLoaded, isSignedIn, getOrCreateUser]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavShell />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
