"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DashboardPage() {
  const user = useQuery(api.users.getCurrent);

  if (user === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">
          Setting up your account...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {user.name || "Researcher"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your research workspace is ready.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Your Profile</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-muted-foreground">Name:</span>
            <span>{user.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-muted-foreground">Email:</span>
            <span>{user.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-muted-foreground">Plan:</span>
            <span className="capitalize">{user.subscriptionTier}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
