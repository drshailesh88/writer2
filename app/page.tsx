import Link from "next/link";
import {
  GraduationCap,
  PenTool,
  Search,
  BookMarked,
  ShieldCheck,
  FileCheck2,
  FlaskConical,
  ListChecks,
  Check,
  ArrowRight,
  Sparkles,
  MousePointerClick,
  FileEdit,
  Send,
  Star,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: Search,
    title: "Paper Search",
    description:
      "Search PubMed, Semantic Scholar, and OpenAlex. Find relevant papers in seconds, not hours.",
    accent: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  },
  {
    icon: BookMarked,
    title: "Smart Citations",
    description:
      "Auto-generate and insert citations in Vancouver, APA, AMA, or Chicago format.",
    accent:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  },
  {
    icon: FileCheck2,
    title: "Plagiarism Check",
    description:
      "Check your manuscript against published literature before you submit.",
    accent:
      "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  },
  {
    icon: ShieldCheck,
    title: "AI Detection",
    description:
      "Scan your drafts for AI-generated content. Ensure authentic academic voice.",
    accent: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  },
  {
    icon: FlaskConical,
    title: "Deep Research",
    description:
      "Get comprehensive research reports on any topic with properly cited sources.",
    accent:
      "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  },
  {
    icon: ListChecks,
    title: "Bibliography",
    description:
      "Auto-generate formatted reference lists. Export-ready for any journal.",
    accent: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for learning research writing",
    features: [
      "Learn Mode — unlimited access",
      "2 plagiarism checks per month",
      "Paper search & library",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "₹299",
    period: "per month",
    description: "For students actively writing their thesis",
    features: [
      "Everything in Free",
      "Draft Mode — AI-assisted writing",
      "5 plagiarism checks per month",
      "10 AI detection checks per month",
      "5 deep research reports per month",
      "Smart citations & bibliography",
    ],
    cta: "Start Basic",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "₹599",
    period: "per month",
    description: "For serious researchers who want it all",
    features: [
      "Everything in Basic",
      "Unlimited plagiarism checks",
      "Unlimited AI detection",
      "15 deep research reports per month",
      "Priority support",
      "Early access to new features",
    ],
    cta: "Start Pro",
    highlighted: false,
  },
];

const steps = [
  {
    num: "01",
    icon: MousePointerClick,
    title: "Choose your mode",
    description:
      "Pick Learn Mode to master research writing, or Draft Mode for AI-assisted drafting.",
  },
  {
    num: "02",
    icon: FileEdit,
    title: "Research & write",
    description:
      "Search papers, build outlines, draft sections — everything in one workspace.",
  },
  {
    num: "03",
    icon: Send,
    title: "Check & submit",
    description:
      "Run plagiarism and AI detection checks. Export your polished manuscript.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-mono text-sm font-bold text-primary-foreground">
                V1
              </span>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Drafts
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="min-h-[44px] text-sm font-medium"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="min-h-[44px] text-sm font-medium">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Subtle dot-grid pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.55 0.02 265) 0.75px, transparent 0.75px)",
            backgroundSize: "20px 20px",
            opacity: 0.06,
          }}
        />
        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24">
          <Badge
            variant="secondary"
            className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs tracking-wide"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Built for Medical Students
          </Badge>

          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Your research thesis,{" "}
            <span className="relative inline-block">
              from blank page to submission
              <span
                className="absolute inset-x-0 -bottom-0.5 h-3 -z-10 rounded-sm opacity-30"
                aria-hidden="true"
                style={{ background: "oklch(0.82 0.17 80)" }}
              />
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
            Learn the craft of academic writing with AI coaching, or let AI
            draft alongside you. Paper search, citations, plagiarism checks
            &mdash; all under one roof.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="min-h-[48px] min-w-[200px] text-base font-medium"
              >
                Start Writing for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                variant="outline"
                size="lg"
                className="min-h-[48px] min-w-[200px] text-base font-medium"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <p className="mt-4 font-mono text-xs text-muted-foreground">
            No credit card required &middot; Free plan available
          </p>
        </div>
      </section>

      {/* ─── Two Modes ─── */}
      <section className="border-t bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Two Ways to Write
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Choose your path
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Whether you want to learn the process or speed through it, V1
              Drafts adapts to your needs.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {/* Learn Mode Card */}
            <Card className="relative overflow-hidden border-l-4 border-l-amber-500 transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="pb-4">
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "oklch(0.96 0.05 80)" }}
                >
                  <GraduationCap
                    className="h-6 w-6"
                    style={{ color: "oklch(0.65 0.16 55)" }}
                  />
                </div>
                <CardTitle className="text-xl font-bold">Learn Mode</CardTitle>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Guided, step-by-step coaching that teaches you how to write a
                  research paper &mdash; from understanding methodology to
                  crafting your discussion.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {[
                    "Interactive coaching by AI mentor",
                    "Stage-by-stage guidance (5 stages)",
                    "Detailed feedback on every section",
                    "Learn at your own pace",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Badge
                  variant="secondary"
                  className="mt-5 font-mono text-xs tracking-wide"
                >
                  Like having a mentor by your side
                </Badge>
              </CardContent>
            </Card>

            {/* Draft Mode Card */}
            <Card className="relative overflow-hidden border-l-4 border-l-sky-500 transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="pb-4">
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "oklch(0.95 0.04 240)" }}
                >
                  <PenTool
                    className="h-6 w-6"
                    style={{ color: "oklch(0.55 0.18 240)" }}
                  />
                </div>
                <CardTitle className="text-xl font-bold">Draft Mode</CardTitle>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  AI-assisted drafting that handles the heavy lifting while you
                  stay in control. Search papers, generate outlines, and draft
                  sections effortlessly.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {[
                    "AI-powered section drafting",
                    "Automatic paper search & retrieval",
                    "Smart citation management",
                    "One-click bibliography generation",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Badge
                  variant="secondary"
                  className="mt-5 font-mono text-xs tracking-wide"
                >
                  Guided or hands-off &mdash; you choose
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="border-t py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Everything You Need
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One platform, every research tool
            </h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="pt-6">
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${feature.accent}`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="border-t bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to your manuscript
            </h2>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                {/* Connector line between steps (desktop only) */}
                {i < steps.length - 1 && (
                  <div
                    className="pointer-events-none absolute left-[calc(50%+48px)] right-[calc(-50%+48px)] top-10 hidden border-t border-dashed border-border md:block"
                    aria-hidden="true"
                  />
                )}
                <div className="mx-auto mb-5 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border bg-background shadow-sm">
                  <span className="font-mono text-[11px] font-medium text-muted-foreground">
                    {step.num}
                  </span>
                  <step.icon className="mt-1 h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="border-t py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Simple Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Start free, upgrade when ready
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              No hidden fees. Cancel anytime. All plans include paper search and
              library management.
            </p>
          </div>

          <div className="mt-14 grid items-start gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                  tier.highlighted
                    ? "border-2 border-primary shadow-md md:scale-[1.03]"
                    : ""
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 px-3 py-1 font-mono text-xs">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold tracking-tight">
                      {tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{tier.period}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <Separator className="mb-5" />
                  <ul className="space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="px-6 pb-6">
                  <Link href="/sign-up" className="block">
                    <Button
                      variant={tier.highlighted ? "default" : "outline"}
                      className="min-h-[44px] w-full font-medium"
                    >
                      {tier.cta}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to start your research thesis?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
            Join medical students across India who are writing better research
            papers with V1 Drafts.
          </p>
          <div className="mt-8">
            <Link href="/sign-up">
              <Button
                size="lg"
                variant="secondary"
                className="min-h-[48px] min-w-[200px] text-base font-medium"
              >
                Get Started &mdash; It&apos;s Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative">
        <div
          className="h-px bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden="true"
        />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span className="font-mono text-[10px] font-bold text-primary-foreground">
                V1
              </span>
            </div>
            <span className="text-sm font-medium">Drafts</span>
          </div>
          <p className="text-center font-mono text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} V1 Drafts. All research needs met
            under one single roof.
          </p>
          <div className="flex gap-4">
            <Link
              href="/sign-in"
              className="flex min-h-[44px] items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="flex min-h-[44px] items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
