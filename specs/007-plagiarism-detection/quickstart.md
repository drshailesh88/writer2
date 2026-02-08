# Quickstart: Plagiarism & AI Detection with Payments

**Feature Branch**: `007-plagiarism-detection`
**Date**: 2026-02-07

## Prerequisites

1. Existing project with Next.js 14+, Convex, Clerk, Tiptap editor (Tasks 1-9 complete)
2. Copyleaks account with API credentials (email + API key)
3. Razorpay account with API credentials (key ID + key secret)

## Environment Variables Needed

```env
# Copyleaks
COPYLEAKS_EMAIL=your-copyleaks-email
COPYLEAKS_API_KEY=your-copyleaks-api-key
COPYLEAKS_WEBHOOK_BASE_URL=https://your-domain.com

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Razorpay Plan IDs (created in Razorpay dashboard or via API)
RAZORPAY_BASIC_PLAN_ID=plan_xxxxx
RAZORPAY_PRO_PLAN_ID=plan_xxxxx
```

## Install Dependencies

```bash
npm install plagiarism-checker razorpay
```

## New Files to Create

```
app/
├── api/
│   ├── plagiarism/
│   │   ├── check/route.ts        # Submit text for plagiarism check
│   │   └── status/route.ts       # Poll for results
│   ├── ai-detection/
│   │   ├── check/route.ts        # Submit text for AI detection
│   │   └── status/route.ts       # Poll for results
│   ├── copyleaks/
│   │   └── webhook/
│   │       └── [status]/route.ts # Webhook handler (completed/error)
│   └── razorpay/
│       ├── create-subscription/route.ts
│       ├── cancel-subscription/route.ts
│       └── webhook/route.ts      # Payment lifecycle webhooks
├── plagiarism-free/
│   └── page.tsx                  # Anonymous free check page
├── (protected)/
│   ├── pricing/
│   │   └── page.tsx              # Pricing & subscribe page
│   └── account/
│       └── subscription/
│           └── page.tsx          # Subscription management

components/
├── plagiarism/
│   ├── plagiarism-panel.tsx      # Side panel with results
│   └── source-detail-modal.tsx   # Matched text comparison modal
├── ai-detection/
│   └── ai-detection-panel.tsx    # Side panel with sentence scores
└── modals/
    └── upgrade-modal.tsx         # Usage limit exceeded modal

lib/
├── copyleaks.ts                  # Copyleaks SDK wrapper
└── razorpay.ts                   # Razorpay SDK wrapper

convex/
├── crons.ts                      # Monthly usage counter reset
└── (existing files updated)

hooks/
├── use-plagiarism-check.ts       # Hook for plagiarism check flow
└── use-ai-detection.ts           # Hook for AI detection flow
```

## Implementation Order

1. **Copyleaks SDK setup** (`lib/copyleaks.ts`) — auth, submit, result parsing
2. **API routes** for plagiarism + AI detection (check + status + webhooks)
3. **Convex updates** — new queries/mutations, cron job
4. **Plagiarism UI** — panel, highlights, source modal (use Frontend Design Skill + Opus)
5. **AI Detection UI** — panel, sentence highlights, disclaimer (use Frontend Design Skill + Opus)
6. **Usage limits** — upgrade modal, client-side checks
7. **Free funnel page** — `/plagiarism-free` (use Frontend Design Skill + Opus)
8. **Razorpay integration** — SDK setup, create subscription, webhooks
9. **Pricing page** — feature comparison table (use Frontend Design Skill + Opus)
10. **Subscription management** — account page (use Frontend Design Skill + Opus)
11. **Playwright E2E tests** — all user stories
