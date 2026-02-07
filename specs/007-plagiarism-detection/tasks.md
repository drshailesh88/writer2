# Tasks: Plagiarism & AI Detection with Payments

**Input**: Design documents from `/specs/007-plagiarism-detection/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Playwright E2E tests are included as required by the constitution (Article 7.1). Tests are written after implementation per user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, create SDK wrappers, and extend Convex backend

- [x] T001 Install Copyleaks and Razorpay npm packages: `npm install plagiarism-checker razorpay`
- [x] T002 Add environment variables to `.env.local`: COPYLEAKS_EMAIL, COPYLEAKS_API_KEY, COPYLEAKS_WEBHOOK_BASE_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_BASIC_PLAN_ID, RAZORPAY_PRO_PLAN_ID
- [x] T003 [P] Create Copyleaks SDK wrapper in `lib/copyleaks.ts` — auth token caching (48h TTL), `submitPlagiarismScan(text, scanId, webhookUrl)`, `submitAiDetection(text, scanId)`, `parsePlagiarismResult(payload)`, `parseAiDetectionResult(payload)` helper functions
- [x] T004 [P] Create Razorpay SDK wrapper in `lib/razorpay.ts` — instance initialization, `createSubscription(planId, userId)`, `cancelSubscription(subscriptionId, cancelAtCycleEnd)`, `verifyWebhookSignature(body, signature, secret)` helper functions
- [x] T005 [P] Add `getUsage` query to `convex/users.ts` — returns `{ tier, plagiarismUsed, plagiarismLimit, aiDetectionUsed, aiDetectionLimit }` for the authenticated user
- [x] T006 [P] Add `decrementPlagiarismUsage` and `decrementAiDetectionUsage` mutations to `convex/users.ts` — called when external service fails to reverse the counter increment
- [x] T007 Create monthly usage counter reset cron in `convex/crons.ts` — uses Convex `cronJobs()` to reset `plagiarismChecksUsed`, `aiDetectionChecksUsed`, `deepResearchUsed` to 0 for all users on the 1st of each month at 00:00 UTC

**Checkpoint**: SDK wrappers ready, Convex backend extended, dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core API routes that ALL user stories depend on

**Warning**: No user story work can begin until this phase is complete

- [x] T008 Create plagiarism check API route `app/api/plagiarism/check/route.ts` — POST handler: validate input, call Convex `plagiarismChecks.create` (handles auth + usage limits), call `submitPlagiarismScan()` from `lib/copyleaks.ts` with webhook URL, return `{ checkId, status: "pending" }`. On Copyleaks error, call `decrementPlagiarismUsage` to reverse counter. Support anonymous (no auth, 1000 word limit) and authenticated flows.
- [x] T009 Create plagiarism status API route `app/api/plagiarism/status/route.ts` — GET handler: accept `checkId` query param, call Convex `plagiarismChecks.get`, return status + results if completed
- [x] T010 Create AI detection check API route `app/api/ai-detection/check/route.ts` — POST handler: require auth, call Convex `aiDetectionChecks.create` (handles usage limits), call `submitAiDetection()` from `lib/copyleaks.ts`, return `{ checkId, status: "pending" }`. On Copyleaks error, call `decrementAiDetectionUsage`.
- [x] T011 Create AI detection status API route `app/api/ai-detection/status/route.ts` — GET handler: accept `checkId` query param, call Convex `aiDetectionChecks.get`, return status + results if completed
- [x] T012 Create Copyleaks webhook handler `app/api/copyleaks/webhook/[status]/route.ts` — POST handler for `completed` and `error` statuses. On `completed`: parse results using `parsePlagiarismResult()` or `parseAiDetectionResult()`, call Convex `updateResult` mutation. On `error`: mark check as "failed", call decrement mutation to reverse usage counter. Must respond with 200 within 70 seconds. Idempotent (check `copyleaksScanId` to avoid duplicate processing).
- [x] T013 [P] Create `hooks/use-plagiarism-check.ts` — React hook: `usePlagiarismCheck()` returns `{ submitCheck, status, result, error, isLoading }`. Calls `/api/plagiarism/check`, then polls `/api/plagiarism/status` every 3 seconds until completed/failed. Uses Convex `useQuery` for real-time status updates as alternative to polling.
- [x] T014 [P] Create `hooks/use-ai-detection.ts` — React hook: `useAiDetection()` returns `{ submitCheck, status, result, error, isLoading }`. Same pattern as plagiarism hook but calls AI detection endpoints.

**Checkpoint**: Foundation ready — all API routes and hooks operational, user story implementation can begin

---

## Phase 3: User Story 1 — Free Plagiarism Funnel (Priority: P1) MVP

**Goal**: Anonymous visitors can paste up to 1,000 words, run a plagiarism check, and see results with a sign-up CTA.

**Independent Test**: Visit `/plagiarism-free`, paste text, click "Check for Plagiarism," verify results panel shows similarity % and sources, verify sign-up CTA appears.

### Implementation for User Story 1

- [x] T015 [US1] Design the free plagiarism check page using **Frontend Design Skill + Opus model** — clean, professional layout with textarea (word counter showing X/1000), "Check for Plagiarism" button, results area, and sign-up CTA section. Mobile responsive (375px + 1280px). Use Google Docs simplicity aesthetic.
- [x] T016 [US1] Implement free plagiarism check page `app/plagiarism-free/page.tsx` — textarea with live word count (max 1000), "Check for Plagiarism" button, cookie-based check tracking (`v1d_free_check_used`), word limit validation with helpful error message. No Clerk auth required (public page).
- [x] T017 [US1] Add results display section to `app/plagiarism-free/page.tsx` — overall similarity badge (color-coded: green <10%, yellow 10-25%, red >25%), source list with title/URL/similarity%, loading skeleton during scan, "No plagiarism detected" green state for 0%.
- [x] T018 [US1] Add sign-up CTA section after results in `app/plagiarism-free/page.tsx` — "Sign up for 2 free checks per month + AI Detection, Paper Search, Draft Mode" with Clerk sign-up link. Display only after results are shown.
- [ ] T019 [US1] Write Playwright E2E test `tests/e2e/free-funnel.spec.ts` — test: page loads, paste 800 words, click check, verify loading state, verify results panel shows similarity % and sources (mock API), verify CTA appears. Test: paste 1200 words, verify word limit error. Test: mobile viewport (375px).

**Checkpoint**: Free plagiarism funnel is fully functional and independently testable

---

## Phase 4: User Story 2 — Authenticated Plagiarism Check from Editor (Priority: P1)

**Goal**: Signed-in users can run plagiarism checks from the editor toolbar, see results in a side panel with highlighted matching text, and click sources for details.

**Independent Test**: Open editor with text, click "Check Plagiarism" button, verify side panel shows results, click source to see detail modal.

### Implementation for User Story 2

- [x] T020 [US2] Design the plagiarism results panel using **Frontend Design Skill + Opus model** — side panel (right, ~350px wide) with: large similarity % badge (color-coded), source list cards (title, URL, matched words, similarity %), loading skeleton, empty/success states. Mobile: bottom sheet on <768px. White-label V1 Drafts branding.
- [x] T021 [US2] Implement `components/plagiarism/plagiarism-panel.tsx` — side panel component using shadcn/ui Card, Badge, Skeleton. Props: `results`, `isLoading`, `onSourceClick`, `onClose`. Color coding: green (<10%), yellow (10-25%), red (>25%). Source list with click handler. "No plagiarism detected" state with green checkmark.
- [x] T022 [US2] Implement `components/plagiarism/source-detail-modal.tsx` — shadcn/ui Dialog showing: source title, URL (clickable), matched text snippet, similarity %, "View Source" external link button. Props: `source`, `open`, `onClose`.
- [x] T023 [US2] Add "Check Plagiarism" button to `components/editor/editor-toolbar.tsx` — add `FileCheck2` icon button after citation section (with Separator), new props: `onCheckPlagiarism`, `isPlagiarismLoading`. Button disabled during loading, shows Loader2 spinner.
- [x] T024 [US2] Integrate plagiarism panel into editor page `app/(protected)/editor/[id]/page.tsx` — wire up `usePlagiarismCheck` hook, toggle plagiarism panel visibility, pass results to `PlagiarismPanel`, connect source click to `SourceDetailModal`. Extract editor text content via `editor.getText()`.
- [ ] T025 [US2] Write Playwright E2E test `tests/e2e/plagiarism.spec.ts` — test: sign in, open editor, type text, click "Check Plagiarism", verify loading state, verify results panel appears with similarity % (mock API). Test: click source, verify detail modal opens. Test: user with 0 checks remaining, verify upgrade modal. Test: mobile viewport.

**Checkpoint**: Editor plagiarism checking is fully functional and independently testable

---

## Phase 5: User Story 3 — AI Content Detection (Priority: P2)

**Goal**: Signed-in users can run AI detection from the editor, see overall AI score with sentence-level highlights, and always see the mandatory disclaimer.

**Independent Test**: Open editor with text, click "AI Detection" button, verify panel shows score + sentence list + disclaimer.

### Implementation for User Story 3

- [x] T026 [US3] Design the AI detection results panel using **Frontend Design Skill + Opus model** — side panel with: mandatory disclaimer banner at top (amber/yellow background, non-dismissible), overall AI score with large progress bar (green <30%, yellow 30-70%, red >70%), sentence-level list (each sentence with colored dot + probability %). Mobile: bottom sheet on <768px.
- [x] T027 [US3] Implement `components/ai-detection/ai-detection-panel.tsx` — side panel component using shadcn/ui Progress, Badge, Alert. Props: `results`, `isLoading`, `onClose`. Mandatory disclaimer Alert at top (variant: warning, no close button): "AI detection provides an estimate, not a definitive conclusion. Scientific and medical writing may show elevated scores due to standardized structure and specialized vocabulary. Non-native English writers may also see higher scores. Results should not be used as sole evidence of AI use." Sentence list with color-coded dots.
- [x] T028 [US3] Add "AI Detection" button to `components/editor/editor-toolbar.tsx` — add `ShieldCheck` icon button next to plagiarism button, new props: `onCheckAiDetection`, `isAiDetectionLoading`. Separate from plagiarism button (with Separator).
- [x] T029 [US3] Integrate AI detection panel into editor page — wire up `useAiDetection` hook, toggle AI detection panel visibility, pass results to `AiDetectionPanel`. Extract editor text via `editor.getText()`. Only one panel open at a time (close plagiarism panel when opening AI detection and vice versa).
- [ ] T030 [US3] Write Playwright E2E test `tests/e2e/ai-detection.spec.ts` — test: sign in, open editor, type text, click "AI Detection", verify loading, verify panel shows score + progress bar (mock API). Test: verify disclaimer is always visible and cannot be dismissed. Test: verify sentence list. Test: user with 0 checks, verify upgrade modal. Test: mobile viewport.

**Checkpoint**: AI detection is fully functional with mandatory disclaimer, independently testable

---

## Phase 6: User Story 4 — Subscription Purchase (Priority: P2)

**Goal**: Users can view pricing, subscribe to Basic plan via Razorpay Checkout (UPI + cards), and get immediate access upgrade.

**Independent Test**: Visit pricing page, click "Subscribe to Basic," complete payment (test mode), verify account tier updated.

### Implementation for User Story 4

- [ ] T031 [US4] Create Razorpay subscription API route `app/api/razorpay/create-subscription/route.ts` — POST handler: require auth, accept `{ planType }`, look up plan ID from env vars, call `razorpay.subscriptions.create()`, return `{ subscriptionId, razorpayKeyId }`.
- [ ] T032 [US4] Create Razorpay webhook handler `app/api/razorpay/webhook/route.ts` — POST handler: verify webhook signature using HMAC SHA256 (raw body + RAZORPAY_WEBHOOK_SECRET), handle events: `subscription.activated` (call Convex `subscriptions.create` + update user tier), `subscription.charged` (update billing period), `subscription.cancelled` (call Convex `subscriptions.updateStatus` to "cancelled"), `payment.failed` (set subscription to "paused" for 3-day grace). Always respond 200. Idempotent via `razorpaySubscriptionId`.
- [ ] T033 [US4] Design the pricing page using **Frontend Design Skill + Opus model** — 3-column feature comparison table (Free / Basic INR 1,000/mo / Pro INR 2,000/mo), check/cross marks for features, "Subscribe to Basic" primary CTA, "Coming Soon" for Pro, sign-up prompt for anonymous visitors. Professional, clean layout. Mobile: stack columns vertically.
- [ ] T034 [US4] Implement pricing page `app/(protected)/pricing/page.tsx` — feature comparison table using shadcn/ui Table or Cards, load Razorpay Checkout script via Next.js `<Script>`, "Subscribe to Basic" button calls `/api/razorpay/create-subscription`, opens Razorpay Checkout modal with returned subscription ID. On success: show success toast, redirect to dashboard. On failure: show error message. Pro button disabled with "Coming Soon" badge.
- [x] T035 [US4] Implement `components/modals/upgrade-modal.tsx` — shadcn/ui Dialog triggered when usage limit exceeded. Shows: current tier, usage (e.g., "5/5 plagiarism checks used this month"), tier comparison mini-table, "Upgrade to Basic" button linking to `/pricing`, "Upgrade to Pro" button (disabled, "Coming Soon"). Props: `feature`, `currentUsage`, `limit`, `tier`, `open`, `onClose`.
- [x] T036 [US4] Wire upgrade modal into plagiarism and AI detection hooks — in `hooks/use-plagiarism-check.ts` and `hooks/use-ai-detection.ts`, when API returns `limitExceeded`, set state. Upgrade modal wired in editor page with usage data from `getUsage` query.
- [ ] T037 [US4] Write Playwright E2E test `tests/e2e/subscription.spec.ts` — test: visit pricing page, verify 3 tiers displayed, click "Subscribe to Basic", verify Razorpay modal opens (mock). Test: mock payment success webhook, verify user tier updated to "basic". Test: verify Pro button shows "Coming Soon". Test: mobile viewport.

**Checkpoint**: Subscription purchase flow is fully functional, upgrade modal triggers correctly

---

## Phase 7: User Story 5 — Subscription Management (Priority: P3)

**Goal**: Subscribers can view their plan, usage dashboard, and cancel their subscription.

**Independent Test**: Visit account page, verify plan details and usage stats, click cancel and verify cancellation.

### Implementation for User Story 5

- [ ] T038 [US5] Create cancel subscription API route `app/api/razorpay/cancel-subscription/route.ts` — POST handler: require auth, get user's active subscription from Convex, call `razorpay.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: true })`, return `{ status, effectiveDate }`.
- [ ] T039 [US5] Design the subscription management page using **Frontend Design Skill + Opus model** — card layout: current plan badge, renewal date, usage progress bars (plagiarism X/Y, AI detection X/Y), "Cancel Subscription" danger button with confirmation dialog, grace period warning banner (if payment failed). Clean, trustworthy design.
- [ ] T040 [US5] Implement subscription management page `app/(protected)/account/subscription/page.tsx` — query Convex `subscriptions.getByUser` and `users.getUsage` for data. Show: plan name badge, renewal date (formatted), usage progress bars using shadcn/ui Progress, "Cancel Subscription" button → shadcn/ui AlertDialog confirmation ("Your subscription will remain active until [date]"). Grace period warning using shadcn/ui Alert (variant: destructive) if subscription status is "paused".
- [ ] T041 [US5] Add "Subscription" link to navigation in `components/nav-shell.tsx` — add link to `/account/subscription` in the user menu dropdown (visible only when signed in).

**Checkpoint**: Subscription management is fully functional, users can view status and cancel

---

## Phase 8: User Story 6 — Monthly Usage Counter Reset (Priority: P3)

**Goal**: Usage counters reset automatically on the 1st of each month.

**Independent Test**: Verify cron job resets all counters; verify user sees fresh allocation.

### Implementation for User Story 6

- [ ] T042 [US6] Verify and test the cron job created in T007 (`convex/crons.ts`) — ensure it resets `plagiarismChecksUsed`, `aiDetectionChecksUsed`, and `deepResearchUsed` to 0 for ALL users. Add the internal mutation `resetAllUsageCounters` to `convex/users.ts` that the cron calls. Test by manually triggering the mutation in Convex dashboard and verifying counters reset.

**Checkpoint**: Monthly reset is operational

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, edge cases, and cleanup

- [x] T043 Ensure only one results panel is open at a time in editor — when opening plagiarism panel, close AI detection panel and vice versa. Implemented in `handleCheckPlagiarism` and `handleCheckAiDetection` handlers in editor page.
- [ ] T044 Handle Copyleaks service unavailability gracefully — in plagiarism and AI detection hooks, catch network/timeout errors and show "Service temporarily unavailable, please try again in a few minutes" toast. Do NOT show error details to user. Ensure counter is decremented on failure.
- [ ] T045 Add loading and empty states to all new pages — `plagiarism-free` (skeleton loader), pricing (loading), subscription management (skeleton for usage stats). Verify all states render correctly.
- [ ] T046 Mobile responsive verification — test all new pages and panels on 375px and 1280px viewports. Verify 44px touch targets on all interactive elements. Verify side panels convert to bottom sheets on mobile.
- [ ] T047 Run full Playwright E2E test suite — execute all tests from Phase 3-7 (`free-funnel.spec.ts`, `plagiarism.spec.ts`, `ai-detection.spec.ts`, `subscription.spec.ts`). Fix any failures.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (US1 - Free Funnel)**: Depends on Phase 2
- **Phase 4 (US2 - Editor Plagiarism)**: Depends on Phase 2. Independent of US1.
- **Phase 5 (US3 - AI Detection)**: Depends on Phase 2. Independent of US1/US2.
- **Phase 6 (US4 - Subscription)**: Depends on Phase 2. Independent of US1/US2/US3. (But upgrade modal in T035-T036 integrates with US2/US3 hooks)
- **Phase 7 (US5 - Subscription Mgmt)**: Depends on Phase 6 (needs subscription records to exist)
- **Phase 8 (US6 - Monthly Reset)**: Depends on Phase 1 (cron created in T007)
- **Phase 9 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Free Funnel)**: Independent — can start after Phase 2
- **US2 (Editor Plagiarism)**: Independent — can start after Phase 2
- **US3 (AI Detection)**: Independent — can start after Phase 2
- **US4 (Subscription)**: Independent for core flow — upgrade modal integrates with US2/US3 but can be wired later
- **US5 (Subscription Mgmt)**: Depends on US4 (needs Razorpay cancel API + subscription data)
- **US6 (Monthly Reset)**: Independent — just the cron from T007

### Within Each User Story

- Design with Frontend Design Skill + Opus FIRST
- Then implement components
- Then integrate into pages
- Then write Playwright E2E tests
- Commit after each completed task

### Parallel Opportunities

**Phase 1 parallel tasks** (all different files):
- T003 (lib/copyleaks.ts) + T004 (lib/razorpay.ts) + T005 (convex/users.ts getUsage) + T006 (convex/users.ts decrements)

**Phase 2 parallel tasks**:
- T013 (use-plagiarism-check.ts) + T014 (use-ai-detection.ts)

**After Phase 2, these stories can run in parallel**:
- US1 (Free Funnel) + US2 (Editor Plagiarism) + US3 (AI Detection)

---

## Parallel Example: Phase 1

```bash
# These 4 tasks touch different files and can run simultaneously:
T003: Create lib/copyleaks.ts
T004: Create lib/razorpay.ts
T005: Add getUsage query to convex/users.ts
T006: Add decrement mutations to convex/users.ts
```

## Parallel Example: After Phase 2

```bash
# These 3 user stories are independent and can run in parallel:
US1 (Phase 3): Free Funnel — app/plagiarism-free/page.tsx
US2 (Phase 4): Editor Plagiarism — components/plagiarism/*.tsx + editor integration
US3 (Phase 5): AI Detection — components/ai-detection/*.tsx + editor integration
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T014)
3. Complete Phase 3: User Story 1 - Free Funnel (T015-T019)
4. **STOP and VALIDATE**: Test free funnel independently
5. Deploy/demo — anonymous visitors can check plagiarism

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Free Funnel) → Test → Deploy (MVP!)
3. Add US2 (Editor Plagiarism) → Test → Deploy
4. Add US3 (AI Detection) → Test → Deploy
5. Add US4 (Subscription Purchase) → Test → Deploy
6. Add US5 (Subscription Management) → Test → Deploy
7. Add US6 (Monthly Reset) → Verify cron
8. Polish phase → Final E2E suite → Ship

---

## Notes

- [P] tasks = different files, no dependencies between them
- [USn] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All UI work MUST use Frontend Design Skill + Opus model (Constitution Article 9.5)
- Commit after each task: `feat: implement [description] (task 10.X)`
- White-label: NO Copyleaks or Razorpay branding in user-facing UI
- Total tasks: 47
