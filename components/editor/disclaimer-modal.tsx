"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function DisclaimerModal({ open, onAccept, onDecline }: DisclaimerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Hands-Off Mode Disclaimer</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Important disclaimer about AI-generated content
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm leading-relaxed text-foreground">
            V1 Drafts provides AI-assisted research and writing tools to
            accelerate your academic workflow. The hands-off mode generates a
            complete first draft autonomously.
          </p>
          <p className="text-sm leading-relaxed font-medium text-foreground">
            This draft is a starting point and MUST be reviewed, verified, and
            edited by you before submission.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            V1 Drafts is not responsible for the accuracy, originality, or
            academic integrity of content submitted to journals or universities.
            You are solely responsible for your submissions.
          </p>
          <p className="text-sm leading-relaxed font-medium text-amber-700 dark:text-amber-400">
            Do not upload patient-identifiable medical data without proper
            consent and IRB/Ethics Committee approval.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDecline} className="min-h-[44px]">
            Cancel
          </Button>
          <Button onClick={onAccept} className="min-h-[44px]">
            I Understand & Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
