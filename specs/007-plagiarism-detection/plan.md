# Implementation Plan: Plagiarism & AI Detection with Payments

**Branch**: `007-plagiarism-detection` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-plagiarism-detection/spec.md`

## Summary

Integrate Copyleaks Node.js SDK for plagiarism detection (similarity %, source matching, text highlighting) and AI content detection (sentence-level probability scores) with white-label UI in the existing Tiptap editor. Implement Razorpay subscription payments with webhook handling for tier-based usage enforcement. Build a free plagiarism funnel for customer acquisition and a subscription management page.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 14+ (App Router), Convex 1.31.7, Clerk, plagiarism-checker (Copyleaks SDK), razorpay, shadcn/ui, Tailwind CSS, Tiptap, lucide-react
**Storage**: Convex (plagiarismChecks, aiDetectionChecks, subscriptions, users tables — all pre-existing)
**Testing**: Playwright (E2E on port 3001)
**Target Platform**: Web (mobile responsive, 375px + 1280px viewports)
**Project Type**: Web application (Next.js)
**Performance Goals**: Scan results displayed within 60 seconds, payment completion within 30 seconds
**Constraints**: White-label (no Copyleaks branding), 44px minimum touch targets, mobile responsive
**Scale/Scope**: ~20 new files, 3 API integrations (Copyleaks plagiarism, Copyleaks AI detection, Razorpay subscriptions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status |
|---------|------|--------|
| Art 2: Tech Stack | Use Copyleaks API (Node.js SDK) for plagiarism + AI detection | PASS |
| Art 2: Tech Stack | Use Razorpay for payments | PASS |
| Art 2: Tech Stack | shadcn/ui + Tailwind CSS for UI | PASS |
| Art 3.1: Zero SQL | All database via Convex TypeScript functions | PASS |
| Art 3.3: Mobile Responsive | 44px touch targets, mobile-first | PASS |
| Art 3.4: No Custom Code | Copyleaks SDK (not custom plagiarism), Razorpay SDK (not custom payments) | PASS |
| Art 4: Two Modes | Feature is mode-independent (available in both Learn + Draft) | PASS |
| Art 5.2: AI Detection Disclaimer | Mandatory disclaimer always displayed | PASS |
| Art 6: Pricing Limits | Tiered limits enforced (none/free/basic/pro) | PASS |
| Art 7.1: Testing | Playwright E2E tests for every user story | PASS |
| Art 7.4: Error Handling | Graceful degradation for Copyleaks/Razorpay API failures | PASS |
| Art 7.5: Security | API keys in env vars, webhook signature verification | PASS |
| Art 9.5: Frontend Design Skill | Opus model mandatory for all UI work | PASS |

**Gate Result**: ALL PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/007-plagiarism-detection/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Data model documentation
├── quickstart.md        # Implementation quickstart
├── contracts/           # API contracts
│   └── api-contracts.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── plagiarism/
│   │   ├── check/route.ts          # POST: submit text for plagiarism scan
│   │   └── status/route.ts         # GET: poll for scan results
│   ├── ai-detection/
│   │   ├── check/route.ts          # POST: submit text for AI detection
│   │   └── status/route.ts         # GET: poll for results
│   ├── copyleaks/
│   │   └── webhook/
│   │       └── [status]/route.ts   # Copyleaks scan result webhooks
│   └── razorpay/
│       ├── create-subscription/route.ts
│       ├── cancel-subscription/route.ts
│       └── webhook/route.ts        # Payment lifecycle webhooks
├── plagiarism-free/
│   └── page.tsx                    # Anonymous free plagiarism check
├── (protected)/
│   ├── pricing/
│   │   └── page.tsx                # Pricing page with feature table
│   └── account/
│       └── subscription/
│           └── page.tsx            # Subscription management

components/
├── plagiarism/
│   ├── plagiarism-panel.tsx        # Results side panel
│   └── source-detail-modal.tsx     # Source matched text modal
├── ai-detection/
│   └── ai-detection-panel.tsx      # Results side panel with disclaimer
└── modals/
    └── upgrade-modal.tsx           # Usage limit exceeded

lib/
├── copyleaks.ts                    # SDK wrapper (auth, submit, parse)
└── razorpay.ts                     # SDK wrapper (plans, subscriptions)

convex/
├── crons.ts                        # Monthly usage counter reset (NEW)
├── plagiarismChecks.ts             # Extended with decrement mutation
├── aiDetectionChecks.ts            # Extended with decrement mutation
├── users.ts                        # Extended with getUsage query
└── lib/subscriptionLimits.ts       # Already complete

hooks/
├── use-plagiarism-check.ts         # React hook: submit + poll + results
└── use-ai-detection.ts             # React hook: submit + poll + results

tests/
└── e2e/
    ├── plagiarism.spec.ts
    ├── ai-detection.spec.ts
    ├── subscription.spec.ts
    └── free-funnel.spec.ts
```

**Structure Decision**: Extends the existing Next.js App Router structure with new API routes under `app/api/`, new pages under `app/`, and new components under `components/`. Follows the established project patterns from Tasks 1-9.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
