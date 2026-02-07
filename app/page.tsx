import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-xl font-bold">V1 Drafts</div>
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex min-h-[44px] items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex min-h-[44px] items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
          All research needs met under one single roof
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
          Learn to write research papers with guided coaching, or draft them
          faster with AI assistance. Built for medical students.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Writing for Free
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign In
          </Link>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          V1 Drafts &mdash; KhanMigo meets SciSpace
        </div>
      </footer>
    </div>
  );
}
