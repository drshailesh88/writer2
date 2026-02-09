import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy — V1 Drafts",
  description:
    "Privacy Policy for V1 Drafts, the AI-powered research writing assistant for medical students.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal header */}
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective Date: February 1, 2026
        </p>

        <Separator className="my-8" />

        <div className="space-y-10">
          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              1. Information We Collect
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              When you use V1 Drafts, we collect the following types of
              information:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                <strong className="text-foreground">Account information</strong>{" "}
                — your name and email address, collected through Clerk
                authentication (via Google sign-in or email/password
                registration).
              </li>
              <li>
                <strong className="text-foreground">
                  Documents and drafts
                </strong>{" "}
                — manuscripts, research papers, and other content you create or
                upload, stored in our Convex database.
              </li>
              <li>
                <strong className="text-foreground">Search history</strong> —
                your paper search queries across PubMed, Semantic Scholar, and
                OpenAlex.
              </li>
              <li>
                <strong className="text-foreground">Payment information</strong>{" "}
                — billing details processed securely by Razorpay. We do not
                store your full card number or UPI credentials on our servers.
              </li>
              <li>
                <strong className="text-foreground">Usage data</strong> —
                feature usage statistics, session duration, and interaction
                patterns to improve the service.
              </li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              2. How We Use Your Information
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                Provide, maintain, and improve V1 Drafts and its features.
              </li>
              <li>
                Process your subscription payments and manage your account.
              </li>
              <li>
                Deliver AI-powered writing assistance, including document
                generation, coaching, and research reports.
              </li>
              <li>
                Run plagiarism checks and AI detection scans via Copyleaks.
              </li>
              <li>Communicate with you about your account or the service.</li>
            </ul>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                <strong>AI Processing Disclosure:</strong> Your text may be
                processed by AI services (GLM-4.7 by Zhipu AI, GPT Researcher
                by OpenAI) for document generation and research purposes. Text
                is sent to these services only when you explicitly use AI
                features (Learn Mode coaching, Draft Mode writing, or Deep
                Research). We do not use your content to train AI models.
              </p>
            </div>
          </section>

          {/* 3. Data Storage & Security */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              3. Data Storage and Security
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              Your data is stored and protected by industry-standard services:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                <strong className="text-foreground">Convex</strong> — serverless
                database for your documents, drafts, library, and usage data.
                All data is encrypted at rest and in transit.
              </li>
              <li>
                <strong className="text-foreground">Clerk</strong> —
                authentication and session management. Passwords are hashed and
                never stored in plaintext.
              </li>
              <li>
                <strong className="text-foreground">Razorpay</strong> — payment
                processing with PCI-DSS Level 1 compliance. We do not store
                payment credentials.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              While we implement reasonable security measures, no method of
              electronic storage or transmission over the internet is 100%
              secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          {/* 4. Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              4. Third-Party Services
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              V1 Drafts integrates with the following third-party services, each
              governed by their own privacy policies:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                <strong className="text-foreground">Clerk</strong> —
                authentication and user management
              </li>
              <li>
                <strong className="text-foreground">Convex</strong> — database
                and backend infrastructure
              </li>
              <li>
                <strong className="text-foreground">Razorpay</strong> — payment
                processing (UPI, cards, net banking)
              </li>
              <li>
                <strong className="text-foreground">Copyleaks</strong> —
                plagiarism detection and AI content detection
              </li>
              <li>
                <strong className="text-foreground">Zhipu AI (GLM-4.7)</strong>{" "}
                — AI-powered writing assistance and coaching
              </li>
              <li>
                <strong className="text-foreground">
                  OpenAI (GPT Researcher)
                </strong>{" "}
                — deep research report generation
              </li>
              <li>
                <strong className="text-foreground">
                  PubMed, Semantic Scholar, OpenAlex
                </strong>{" "}
                — academic paper search APIs (public, no personal data shared)
              </li>
            </ul>
          </section>

          {/* 5. Patient Data Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              5. Patient Data Disclaimer
            </h2>
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium leading-relaxed text-red-800 dark:text-red-200">
                Do not upload patient-identifiable medical data without proper
                consent and IRB/Ethics Committee approval. V1 Drafts is not a
                HIPAA-compliant platform.
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              V1 Drafts is designed for writing and managing research
              manuscripts. It is not intended for storing or processing
              protected health information (PHI). Users are solely responsible
              for ensuring that any data uploaded complies with applicable
              regulations, including but not limited to HIPAA (United States),
              DPDP Act 2023 (India), and institutional IRB guidelines.
            </p>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              6. Your Rights
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              You have the following rights regarding your personal data:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                <strong className="text-foreground">Access</strong> — request a
                copy of your personal data that we hold.
              </li>
              <li>
                <strong className="text-foreground">Correction</strong> —
                request correction of inaccurate or incomplete personal data.
              </li>
              <li>
                <strong className="text-foreground">Deletion</strong> — request
                deletion of your account and associated data. We will process
                deletion requests within 30 days.
              </li>
              <li>
                <strong className="text-foreground">Data portability</strong> —
                request your data in a commonly used, machine-readable format.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              We comply with India&apos;s Digital Personal Data Protection Act
              (DPDP) 2023 and the General Data Protection Regulation (GDPR)
              where applicable. To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:privacy@v1drafts.com"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                privacy@v1drafts.com
              </a>
              .
            </p>
          </section>

          {/* 7. Cookies */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              7. Cookies
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              V1 Drafts uses essential cookies only. These are strictly
              necessary for authentication and session management and cannot be
              disabled. We do not use advertising cookies, tracking cookies, or
              analytics cookies that identify individual users.
            </p>
          </section>

          {/* 8. Contact */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              8. Contact
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              If you have questions or concerns about this Privacy Policy or
              your data, please contact us at:
            </p>
            <p className="mt-2 text-sm sm:text-base">
              <a
                href="mailto:privacy@v1drafts.com"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                privacy@v1drafts.com
              </a>
            </p>
          </section>

          {/* 9. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              9. Changes to This Policy
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, legal requirements, or other
              factors. When we make changes, we will update the &ldquo;Effective
              Date&rdquo; at the top of this page. Your continued use of V1
              Drafts after any changes constitutes your acceptance of the
              updated policy.
            </p>
          </section>
        </div>

        <Separator className="my-10" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; 2026 V1 Drafts. All rights reserved.
        </p>
      </main>
    </div>
  );
}
