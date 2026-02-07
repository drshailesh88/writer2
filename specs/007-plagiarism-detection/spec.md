# Feature Specification: Plagiarism & AI Detection with Payments

**Feature Branch**: `007-plagiarism-detection`
**Created**: 2026-02-07
**Status**: Draft
**Input**: Integrate Copyleaks API for plagiarism detection and AI content detection with white-label UI. Usage limits per subscription tier. Free plagiarism funnel for acquisition. Razorpay subscription payments with webhook handling.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Free Plagiarism Funnel (Priority: P1)

A visitor lands on the V1 Drafts website from a Google search for "free plagiarism checker." Without creating an account, they paste up to 1,000 words of their thesis text and receive a plagiarism report showing similarity percentage and matching sources. After seeing the results, they are prompted to sign up for a free account to get 2 checks per month plus access to AI detection, paper search, and other features.

**Why this priority**: This is the primary customer acquisition funnel. Organic search for "free plagiarism checker" drives the highest volume of potential users. Converting anonymous visitors to signed-up users is the top business priority.

**Independent Test**: Can be fully tested by visiting the free check page, pasting text, and verifying results appear with a sign-up call-to-action.

**Acceptance Scenarios**:

1. **Given** an anonymous visitor on the free plagiarism page, **When** they paste 800 words and click "Check for Plagiarism," **Then** they see an overall similarity percentage, a list of matching sources, and a sign-up prompt.
2. **Given** an anonymous visitor, **When** they paste 1,200 words (exceeding the 1,000-word limit), **Then** the system shows a message that the free check is limited to 1,000 words and prompts them to sign up.
3. **Given** an anonymous visitor who has already used their one free check (tracked by browser session/cookie), **When** they try to run another check, **Then** the system prompts them to sign up for a free account.

---

### User Story 2 - Authenticated Plagiarism Check from Editor (Priority: P1)

A signed-in user is writing their thesis in the Tiptap editor. They click the "Check Plagiarism" button in the editor toolbar. The system submits their document text to the plagiarism service and displays results in a side panel: overall similarity percentage (color-coded green/yellow/red), a source-by-source breakdown, and highlighted matching text in the editor. The user clicks on a source to see details and jumps to the matching text to revise it.

**Why this priority**: Core feature that directly delivers value to paying users. Plagiarism checking from within the editor is the main workflow.

**Independent Test**: Can be tested by writing text in the editor, clicking "Check Plagiarism," and verifying the results panel with source highlights.

**Acceptance Scenarios**:

1. **Given** a signed-in user with remaining plagiarism checks, **When** they click "Check Plagiarism" in the editor toolbar, **Then** a loading indicator appears, and results display in a side panel within 60 seconds.
2. **Given** plagiarism results showing 18% similarity, **When** the user views the results panel, **Then** they see a yellow-colored similarity badge (10-25% range), a list of matching sources with URLs and similarity percentages, and matching text highlighted in the editor.
3. **Given** plagiarism results with 3 matching sources, **When** the user clicks on a source, **Then** a detail modal opens showing the full matched text, the source URL, and the similarity percentage for that source.
4. **Given** a user with 0 remaining plagiarism checks, **When** they click "Check Plagiarism," **Then** an upgrade modal appears showing their current usage (e.g., "5/5 checks used this month") and options to upgrade their plan.

---

### User Story 3 - AI Content Detection (Priority: P2)

A signed-in user wants to verify that their thesis text does not appear AI-generated before submission. They click the "AI Detection" button (separate from plagiarism) in the editor toolbar. Results appear in a dedicated panel showing an overall AI probability score (0-100%) with a color-coded progress bar, and sentence-level highlighting in the editor showing which sentences are flagged. A mandatory disclaimer is always visible explaining the limitations of AI detection for scientific and medical writing.

**Why this priority**: Important but secondary to plagiarism. AI detection is an advisory tool that adds trust and value for academic users preparing submissions.

**Independent Test**: Can be tested by writing text in the editor, clicking "AI Detection," and verifying the score, sentence highlights, and disclaimer.

**Acceptance Scenarios**:

1. **Given** a signed-in user with remaining AI detection checks, **When** they click "AI Detection," **Then** results display with an overall AI probability score and a color-coded progress bar (green <30%, yellow 30-70%, red >70%).
2. **Given** AI detection results with sentence-level data, **When** the user views the editor, **Then** each sentence is highlighted with a color matching its individual AI probability (green/yellow/red).
3. **Given** any AI detection results panel, **When** the user views the panel, **Then** the disclaimer about scientific writing, non-native writers, and limitations is always visible at the top and cannot be dismissed.
4. **Given** a free-tier user with 0 remaining AI detection checks, **When** they click "AI Detection," **Then** an upgrade modal appears with plan comparison.

---

### User Story 4 - Subscription Purchase (Priority: P2)

A free-tier user who has exhausted their monthly plagiarism checks sees an upgrade modal. They click "Upgrade to Basic" and are taken to the pricing page. They see a feature comparison table (Free vs Basic vs Pro) and click "Subscribe to Basic (INR 1,000/month)." A payment modal opens supporting UPI and card payments. After successful payment, their account is immediately upgraded, and they can use the increased check limits right away.

**Why this priority**: Revenue generation is critical. Smooth payment flow directly impacts conversion from free to paid users.

**Independent Test**: Can be tested by navigating to the pricing page, initiating a payment (test mode), and verifying the subscription is created and usage limits are updated.

**Acceptance Scenarios**:

1. **Given** a free-tier user on the pricing page, **When** they click "Subscribe to Basic," **Then** a payment modal opens with UPI and card options.
2. **Given** a successful payment, **When** the payment confirmation is received, **Then** the user's subscription tier is updated to "basic," their usage limits reflect the new tier, and they see a success confirmation.
3. **Given** a failed payment, **When** the payment fails, **Then** the user sees a clear error message and can retry or choose a different payment method.

---

### User Story 5 - Subscription Management (Priority: P3)

A paying subscriber wants to view their subscription status, see remaining checks for the month, view payment history, or cancel their subscription. They navigate to Account Settings where they can see their current plan, renewal date, usage dashboard, and manage their subscription.

**Why this priority**: Important for user retention and trust but not the primary workflow. Users need to feel in control of their subscription.

**Independent Test**: Can be tested by navigating to the account page and verifying plan details, usage stats, and cancel functionality.

**Acceptance Scenarios**:

1. **Given** a Basic subscriber, **When** they visit the subscription management page, **Then** they see their current plan (Basic), renewal date, plagiarism checks remaining (e.g., "3/5 used"), and AI detection checks remaining (e.g., "7/10 used").
2. **Given** a paying subscriber, **When** they click "Cancel Subscription," **Then** a confirmation dialog appears, and upon confirming, their subscription is cancelled at the end of the current billing period (not immediately).
3. **Given** a subscriber whose payment failed, **When** they visit the subscription page, **Then** they see a warning that their payment failed, a 3-day grace period countdown, and a prompt to update their payment method.

---

### User Story 6 - Monthly Usage Counter Reset (Priority: P3)

At the start of each calendar month, all users' plagiarism check and AI detection check counters reset to zero, giving them a fresh allocation for the new month. Users are not notified of the reset but see their updated usage when they next use the feature.

**Why this priority**: Infrastructure requirement that supports the tiered usage model. Silent but essential.

**Independent Test**: Can be tested by verifying counter reset occurs on the 1st of each month and usage reflects the fresh allocation.

**Acceptance Scenarios**:

1. **Given** a Basic subscriber who used 4/5 plagiarism checks in January, **When** February 1st arrives, **Then** their plagiarism checks used resets to 0/5.
2. **Given** a free-tier user who used 2/2 AI detection checks, **When** the new month starts, **Then** their counter resets to 0/2 and they can run checks again.

---

### Edge Cases

- What happens when the plagiarism/AI detection service is temporarily unavailable? System shows "Service temporarily unavailable, please try again in a few minutes" and does NOT decrement the user's check counter.
- What happens when a user upgrades mid-month from Free to Basic? Their existing usage count carries over but the new higher limits apply immediately (e.g., used 2/2 on Free, now 2/5 on Basic — 3 checks remaining).
- What happens when a user's payment fails and grace period expires? Their account downgrades to "free" tier. Any pending checks complete but new checks follow free-tier limits.
- What happens when an anonymous user clears cookies and tries another free check? The system allows it (cookie-based tracking is best-effort for anonymous users; server-side rate limiting by IP is an optional future enhancement).
- What happens when plagiarism results return 0% similarity? The system shows a green "No plagiarism detected" badge with a reassuring message.
- What happens when a document is very long (10,000+ words)? The system submits the full text (no client-side truncation for authenticated users). The service handles large documents.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow anonymous visitors to perform one plagiarism check of up to 1,000 words without signing up.
- **FR-002**: System MUST display plagiarism results showing overall similarity percentage, source-by-source breakdown with URLs, and highlighted matching text.
- **FR-003**: System MUST color-code plagiarism similarity scores: green (<10%), yellow (10-25%), red (>25%).
- **FR-004**: System MUST provide an "AI Detection" feature separate from plagiarism, showing overall AI probability (0-100%) and sentence-level scores.
- **FR-005**: System MUST display a mandatory, non-dismissible disclaimer on all AI detection results about limitations for scientific writing and non-native English writers.
- **FR-006**: System MUST enforce usage limits per subscription tier: Free (2 plagiarism/2 AI detection per month), Basic (5/10), Pro (20/unlimited).
- **FR-007**: System MUST show an upgrade modal when a user exceeds their tier's check limit, displaying current usage and plan comparison.
- **FR-008**: System MUST support subscription payments via UPI and card through an embedded payment modal (no redirect).
- **FR-009**: System MUST process payment lifecycle events (activation, cancellation, payment failure) via webhooks and update user tier accordingly.
- **FR-010**: System MUST provide a subscription management page showing current plan, renewal date, usage dashboard, and cancel option.
- **FR-011**: System MUST implement a 3-day grace period for failed payments before downgrading the account.
- **FR-012**: System MUST reset all users' monthly usage counters (plagiarism and AI detection) on the 1st of each month.
- **FR-013**: System MUST NOT decrement usage counters when the external plagiarism/AI detection service fails.
- **FR-014**: System MUST use white-label branding (V1 Drafts) on all plagiarism and AI detection results — no third-party provider branding visible.
- **FR-015**: System MUST allow users to click on a plagiarism source to see detailed matched text comparison in a modal.
- **FR-016**: System MUST highlight flagged sentences in the editor with color coding matching their AI detection score.
- **FR-017**: System MUST show a sign-up call-to-action after anonymous plagiarism check results.
- **FR-018**: System MUST display a pricing page with feature comparison table across Free, Basic, and Pro tiers.

### Key Entities

- **Plagiarism Check**: A record of a plagiarism scan including input text, word count, overall similarity percentage, matching sources (URL, matched text, similarity), scan status, and optional association with a user and document.
- **AI Detection Check**: A record of an AI detection scan including input text, word count, overall AI probability score (0-100%), per-sentence AI scores, scan status, and association with a user and document.
- **Subscription**: A record of a user's payment subscription including plan type (Basic/Pro), status (active/paused/cancelled/expired), billing period dates, and payment provider reference.
- **User Usage Counters**: Monthly counters on the user record tracking plagiarism checks used, AI detection checks used, and deep research reports used. Reset monthly.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Anonymous visitors can complete a free plagiarism check and see results within 60 seconds of submission.
- **SC-002**: Authenticated users can run a plagiarism check from the editor and view highlighted results within 60 seconds.
- **SC-003**: AI detection results display sentence-level scores with color-coded highlights within 60 seconds of submission.
- **SC-004**: 100% of upgrade modal impressions include accurate current usage count and correct tier limits.
- **SC-005**: Subscription purchases complete end-to-end (payment to account upgrade) within 30 seconds of payment confirmation.
- **SC-006**: Monthly usage counters reset correctly for all users on the 1st of each month with zero manual intervention.
- **SC-007**: Failed external service calls never decrement user check counters (zero false decrements).
- **SC-008**: All plagiarism and AI detection screens are fully functional on mobile (375px viewport) with touch targets meeting 44px minimum.
- **SC-009**: The free plagiarism funnel displays a sign-up prompt after 100% of anonymous check completions.
- **SC-010**: Subscription cancellation takes effect at end of billing period, not immediately, preserving access until then.

## Assumptions

- The plagiarism and AI detection service provider supports both plagiarism detection (similarity checking against web pages, journals, and repositories) and AI content detection (sentence-level probability scores) through a single integration.
- The service provider delivers results via webhook callbacks or polling, and results are typically available within 30-60 seconds.
- Razorpay is the sole payment provider. UPI and card payments are both supported through an embedded checkout experience.
- The database schema for plagiarism checks, AI detection checks, subscriptions, and user usage counters already exists from prior work.
- The text editor with toolbar is already implemented and can be extended with new toolbar buttons for plagiarism and AI detection.
- Pro tier is defined in the system but marked as "future" — the pricing page shows it but the subscribe button displays "Coming Soon."
- Anonymous plagiarism checks are limited to 1 per session via browser cookies (not server-side IP tracking).
- Payment receipts are handled by the payment provider (automated email receipts) and are not built into the V1 Drafts UI.
- The 3-day grace period for failed payments is tracked by setting subscription status to "paused" and a scheduled check after 3 days to downgrade to "free" if not resolved.
