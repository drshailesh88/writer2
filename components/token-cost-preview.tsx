"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertCircle } from "lucide-react";

interface TokenCostPreviewProps {
  operationName: string;
  tokenCost: number;
}

export function TokenCostPreview({ operationName, tokenCost }: TokenCostPreviewProps) {
  const balance = useQuery(api.usageTokens.getTokenBalance);

  if (!balance) return null;

  const hasEnough = balance.tokensRemaining >= tokenCost;

  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
        hasEnough
          ? "border-muted bg-muted/50 text-muted-foreground"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {!hasEnough && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      <span>
        {operationName} uses <strong>{tokenCost}</strong> tokens.{" "}
        You have <strong>{balance.tokensRemaining.toLocaleString()}</strong> remaining.
      </span>
    </div>
  );
}
