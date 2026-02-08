# Research: Plagiarism & AI Detection with Payments

**Feature Branch**: `007-plagiarism-detection`
**Date**: 2026-02-07

## R-001: Copyleaks SDK Integration Pattern

**Decision**: Use `plagiarism-checker` npm package (official Copyleaks Node.js SDK) with webhook-based result delivery.

**Rationale**:
- Official SDK maintained by Copyleaks, covering plagiarism detection, AI content detection, and more.
- Webhook-based architecture is more efficient than polling — Copyleaks sends HTTP POST when scans complete.
- Single SDK handles both plagiarism and AI detection (separate endpoints/clients).
- Supports sandbox mode for testing without consuming credits.

**Alternatives Considered**:
- Direct REST API calls: More work, no benefit over SDK.
- Polling-based: Inefficient; webhooks are the recommended approach by Copyleaks.

**Key Technical Details**:
- Authentication: `copyleaks.loginAsync(email, apiKey)` returns a token valid for 48 hours (cache it).
- Plagiarism: `copyleaks.submitFileAsync(authToken, scanId, submission)` — text must be base64 encoded.
- AI Detection: `copyleaks.aiDetectionClient.submitNaturalTextAsync(authToken, scanId, submission)` — plain text.
- Webhook URL format: `https://your-domain.com/api/copyleaks/webhook/{STATUS}` — `{STATUS}` is replaced by Copyleaks.
- Sandbox mode: Set `submission.sandbox = true` for testing.
- Credits: 1 credit = 250 words.
- Rate limit: 10 requests/second per account.
- Webhook retries: Up to 17 attempts with exponential backoff.
- Your webhook endpoint must respond within 70 seconds with HTTP 2xx.

**Result Structures**:
- Plagiarism: `results.internet[]` and `results.database[]` each contain `{ id, title, url, matchedWords, introduction }`.
- AI Detection: `{ summary: { humanContent, aiContent }, sections: [{ position, classification, probability }] }`.

---

## R-002: Webhook Architecture for Next.js

**Decision**: Use Next.js API routes as webhook endpoints. Copyleaks calls our webhook after scan completes; we parse results and update Convex.

**Rationale**:
- Next.js API routes work as standard HTTP endpoints, compatible with webhook delivery.
- Convex mutations can be called from API routes via the Convex HTTP client.
- No need for a separate webhook server.

**Alternatives Considered**:
- Separate Express server for webhooks: Unnecessary complexity for V1.
- Convex HTTP actions for webhooks: Possible but API routes are simpler and already established in the project.

**Key Technical Details**:
- Webhook routes: `app/api/copyleaks/webhook/[status]/route.ts` handles completion/error.
- Must use raw body (not parsed JSON) for signature verification if applicable.
- Idempotent handling: Store `copyleaksScanId` to detect duplicate webhook deliveries.
- Must call Convex mutations via `ConvexHttpClient` since webhooks are external requests (no auth context).

---

## R-003: Razorpay Subscriptions Integration

**Decision**: Use `razorpay` npm package with Razorpay Checkout (embedded modal) for subscription payments.

**Rationale**:
- Official SDK with TypeScript support.
- Razorpay Checkout provides an embedded modal (no redirect), supporting UPI + cards.
- Webhook handling for subscription lifecycle events is well-documented.

**Alternatives Considered**:
- Stripe: Not India-focused, higher fees for UPI.
- PayU: Less developer-friendly SDK.
- Redirect-based payment: Worse UX than embedded modal.

**Key Technical Details**:
- Plans: Created via API (`razorpay.plans.create()`) — INR 1,000/month (Basic), INR 2,000/month (Pro).
- Subscriptions: Created via `razorpay.subscriptions.create({ plan_id, total_count })`.
- Checkout: Load script `https://checkout.razorpay.com/v1/checkout.js` via Next.js `<Script>`.
- Webhook signature: HMAC SHA256 verification using `Razorpay.validateWebhookSignature(body, signature, secret)`.
- Key events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`.
- Cancellation: `razorpay.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: true })` for end-of-period cancellation.
- Test keys start with `rzp_test_`, live keys with `rzp_live_`.
- Test card: `4111 1111 1111 1111` (success), `4000 0000 0000 0002` (failure).

---

## R-004: Usage Counter Reset Strategy

**Decision**: Use Convex scheduled function (cron) to reset all users' counters on the 1st of each month.

**Rationale**:
- Convex supports scheduled functions via `cronJobs()`.
- Simpler than tracking "last reset date" per user and checking on every request.
- Batch operation ensures consistency.

**Alternatives Considered**:
- Per-request check: Compare `lastResetDate` with current month on every check. Adds complexity to every API call.
- External cron (e.g., Vercel cron): Adds infrastructure dependency.

**Key Technical Details**:
- Define in `convex/crons.ts` using `cronJobs()`.
- Schedule: Monthly on the 1st at 00:00 UTC.
- Handler: Query all users, batch-patch `plagiarismChecksUsed = 0, aiDetectionChecksUsed = 0, deepResearchUsed = 0`.

---

## R-005: Grace Period for Failed Payments

**Decision**: On `payment.failed` webhook, set subscription status to "paused". Use a Convex scheduled function to check after 3 days and downgrade to "free" if still paused.

**Rationale**:
- Razorpay retries failed payments automatically. The 3-day grace period gives time for retry success.
- "Paused" status preserves access while alerting the user to update their payment method.

**Alternatives Considered**:
- Immediate downgrade: Too aggressive, poor UX.
- 7-day grace period: Too generous, users might exploit it.

---

## R-006: Anonymous Free Check Implementation

**Decision**: Cookie-based session tracking for anonymous plagiarism checks. Store a `v1d_free_check_used` cookie after the first check.

**Rationale**:
- Simple to implement, no server-side state needed for anonymous users.
- Best-effort enforcement is acceptable for the free funnel (the goal is acquisition, not strict enforcement).
- The 1,000-word limit is enforced server-side.

**Alternatives Considered**:
- IP-based rate limiting: More reliable but requires infrastructure (Redis/rate limiter).
- Fingerprinting: Privacy concerns, overly complex for V1.
