"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PaperCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        {/* Title */}
        <Skeleton className="mb-3 h-5 w-4/5" />
        {/* Authors + Journal */}
        <Skeleton className="mb-2 h-4 w-3/5" />
        {/* Badges */}
        <div className="mb-3 flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        {/* Abstract */}
        <Skeleton className="mb-1 h-3 w-full" />
        <Skeleton className="mb-1 h-3 w-full" />
        <Skeleton className="mb-3 h-3 w-2/3" />
        {/* Actions */}
        <div className="flex gap-2 border-t pt-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
