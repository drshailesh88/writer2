"use client";

import { AlertTriangle, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorAlertProps {
  /** User-friendly error message to display */
  error: string;
  /** Callback invoked when the user clicks the retry button */
  onRetry: () => void;
  /** Label for the retry button (default: "Try Again") */
  retryLabel?: string;
  /** Whether to show a "Contact Support" mailto link (default: false) */
  contactSupport?: boolean;
  /** Shows a loading spinner on the retry button when true (default: false) */
  isRetrying?: boolean;
}

export function ErrorAlert({
  error,
  onRetry,
  retryLabel = "Try Again",
  contactSupport = false,
  isRetrying = false,
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        <p className="mb-3 leading-relaxed">{error}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="min-h-[44px] min-w-[44px] border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 sm:min-h-[36px]"
          >
            {isRetrying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Retrying...</span>
              </>
            ) : (
              retryLabel
            )}
          </Button>

          {contactSupport && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground sm:min-h-[36px]"
            >
              <a href="mailto:support@v1drafts.com">
                <Mail className="h-3.5 w-3.5" />
                <span>Contact Support</span>
              </a>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
