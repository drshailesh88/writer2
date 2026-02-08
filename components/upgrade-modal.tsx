"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

export function UpgradeModal({ open, onOpenChange, reason }: UpgradeModalProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="mt-4 text-center">
            Upgrade Required
          </DialogTitle>
          <DialogDescription className="text-center">
            {reason || "You've used all your tokens for this month. Upgrade your plan for more."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-3">
          <Button
            className="min-h-[44px] w-full"
            onClick={() => {
              onOpenChange(false);
              router.push("/pricing");
            }}
            aria-label="View pricing plans"
          >
            View Plans
          </Button>
          <Button
            variant="outline"
            className="min-h-[44px] w-full"
            onClick={() => onOpenChange(false)}
            aria-label="Close upgrade modal"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
