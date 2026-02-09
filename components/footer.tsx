import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          &copy; 2026 V1 Drafts. All rights reserved.
        </p>

        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-1 sm:gap-2">
            <li>
              <Link
                href="/privacy"
                className="inline-flex min-h-[44px] items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </li>
            <li aria-hidden="true">
              <span className="text-border">|</span>
            </li>
            <li>
              <Link
                href="/terms"
                className="inline-flex min-h-[44px] items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
            </li>
            <li aria-hidden="true">
              <span className="text-border">|</span>
            </li>
            <li>
              <a
                href="mailto:support@v1drafts.com"
                className="inline-flex min-h-[44px] items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
