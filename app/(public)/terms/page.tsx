import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Terms of Service — V1 Drafts",
  description:
    "Terms of Service for V1 Drafts, the AI-powered research writing assistant for medical students.",
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective Date: February 1, 2026
        </p>

        <Separator className="my-8" />

        <div className="space-y-10">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              1. Acceptance of Terms
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              By accessing or using V1 Drafts (&ldquo;the Service&rdquo;), you
              agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
              If you do not agree to these Terms, you must not use the Service.
              These Terms constitute a legally binding agreement between you and
              V1 Drafts.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              2. Description of Service
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              V1 Drafts is an AI-powered research writing assistant designed for
              medical students and academic professionals. The Service provides
              tools for learning research writing methodology (Learn Mode),
              AI-assisted manuscript drafting (Draft Mode), academic paper
              search, citation management, bibliography generation, plagiarism
              detection, AI content detection, deep research reports, and
              document export.
            </p>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              3. User Accounts
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              To use V1 Drafts, you must create an account via Clerk
              authentication (Google sign-in or email/password registration).
              You agree to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>Provide accurate and complete registration information.</li>
              <li>
                Maintain the security and confidentiality of your account
                credentials.
              </li>
              <li>
                Accept responsibility for all activities that occur under your
                account.
              </li>
              <li>
                Maintain only one account per person. Creating multiple accounts
                to circumvent usage limits is prohibited.
              </li>
              <li>
                Notify us immediately if you suspect unauthorized use of your
                account.
              </li>
            </ul>
          </section>

          {/* 4. Subscription & Payments */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              4. Subscription and Payments
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              V1 Drafts offers paid subscription plans:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                <strong className="text-foreground">Basic Plan</strong> — INR
                1,000 per month.
              </li>
              <li>
                <strong className="text-foreground">Pro Plan</strong> — INR
                2,000 per month (when available).
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              All payments are processed securely through Razorpay, supporting
              UPI, credit/debit cards, and net banking. Subscriptions are billed
              monthly and auto-renew at the end of each billing cycle unless
              cancelled. You may cancel your subscription at any time from your
              account settings; cancellation takes effect at the end of the
              current billing period.
            </p>
          </section>

          {/* 5. Refund Policy */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              5. Refund Policy
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              We offer a full refund within 7 days of your first subscription
              payment, no questions asked. After the 7-day window, no refunds
              will be issued for the current or any prior billing period. To
              request a refund, contact us at{" "}
              <a
                href="mailto:legal@v1drafts.com"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                legal@v1drafts.com
              </a>{" "}
              with your account email and payment details.
            </p>
          </section>

          {/* 6. Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              6. Acceptable Use
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              You agree not to use V1 Drafts to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                Commit or facilitate plagiarism, including submitting
                AI-generated content as entirely your own work without proper
                disclosure.
              </li>
              <li>
                Misrepresent AI-generated content as solely human-authored in
                academic submissions where such disclosure is required.
              </li>
              <li>
                Upload patient-identifiable medical data without proper consent
                and IRB/Ethics Committee approval.
              </li>
              <li>
                Reverse-engineer, decompile, or attempt to extract the source
                code of the Service.
              </li>
              <li>
                Use automated tools, bots, or scripts to access the Service
                beyond normal usage.
              </li>
              <li>
                Violate any applicable laws, regulations, or institutional
                policies.
              </li>
              <li>
                Share your account credentials or allow third parties to access
                your account.
              </li>
            </ul>
          </section>

          {/* 7. Academic Integrity */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              7. Academic Integrity
            </h2>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm font-medium leading-relaxed text-amber-800 dark:text-amber-200">
                Users are responsible for ensuring proper attribution and
                avoiding plagiarism. AI-generated content must be reviewed,
                verified, and properly cited before academic submission. Always
                follow your institution&apos;s guidelines on AI-assisted
                writing.
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              V1 Drafts provides tools to assist with research writing, not to
              replace the intellectual work of the researcher. The plagiarism
              checker and AI detection tools are provided as aids, not
              guarantees. You remain solely responsible for the academic
              integrity of your work.
            </p>
          </section>

          {/* 8. Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              8. Intellectual Property
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <strong className="text-foreground">Your content:</strong> You
              retain full ownership of all documents, manuscripts, drafts, and
              other content you create using V1 Drafts. We do not claim any
              intellectual property rights over your content.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <strong className="text-foreground">Our platform:</strong> V1
              Drafts and its underlying technology, including but not limited to
              the software, design, features, AI prompts, and branding, are the
              intellectual property of V1 Drafts and are protected by applicable
              intellectual property laws. You may not copy, modify, or
              distribute any part of the Service without our express written
              permission.
            </p>
          </section>

          {/* 9. AI-Generated Content */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              9. AI-Generated Content
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              V1 Drafts uses artificial intelligence to assist with writing,
              coaching, and research. You acknowledge and agree that:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                AI-generated content may contain errors, inaccuracies, or
                outdated information. You must independently verify all facts,
                citations, and claims.
              </li>
              <li>
                AI output should not be treated as medical advice, clinical
                guidance, or a substitute for professional judgment.
              </li>
              <li>
                You are solely responsible for reviewing, editing, and approving
                all AI-generated content before use.
              </li>
              <li>
                The quality and accuracy of AI output may vary depending on the
                input provided.
              </li>
            </ul>
          </section>

          {/* 10. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              10. Limitation of Liability
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              To the maximum extent permitted by law, V1 Drafts and its
              founders, employees, and affiliates shall not be liable for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                Academic consequences resulting from the use of the Service,
                including but not limited to plagiarism allegations, grade
                penalties, or academic disciplinary action.
              </li>
              <li>
                Publication rejections, journal disputes, or peer review
                outcomes.
              </li>
              <li>
                Errors or inaccuracies in AI-generated content, citations, or
                research reports.
              </li>
              <li>
                Loss of data due to service interruptions, technical failures,
                or third-party service outages.
              </li>
              <li>
                Any indirect, incidental, special, consequential, or punitive
                damages arising from your use of the Service.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              Our total liability to you for any claim arising from or related
              to the Service shall not exceed the amount you paid to V1 Drafts
              in the 3 months preceding the claim.
            </p>
          </section>

          {/* 11. Termination */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              11. Termination
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              Either party may terminate the use of the Service:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <li>
                <strong className="text-foreground">By you:</strong> You may
                delete your account at any time from your account settings.
              </li>
              <li>
                <strong className="text-foreground">By us:</strong> We may
                suspend or terminate your account if you violate these Terms,
                with or without notice depending on the severity of the
                violation.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              Upon account deletion, your data will be retained for 30 days
              (during which you may request account restoration), after which it
              will be permanently deleted from our systems. This does not affect
              data already processed by third-party services prior to deletion.
            </p>
          </section>

          {/* 12. Governing Law */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              12. Governing Law
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of India. Any disputes arising from or relating to the
              Service or these Terms shall be subject to the exclusive
              jurisdiction of the courts of Bengaluru, Karnataka, India.
            </p>
          </section>

          {/* 13. Contact */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              13. Contact
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              If you have questions or concerns about these Terms of Service,
              please contact us at:
            </p>
            <p className="mt-2 text-sm sm:text-base">
              <a
                href="mailto:legal@v1drafts.com"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                legal@v1drafts.com
              </a>
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
