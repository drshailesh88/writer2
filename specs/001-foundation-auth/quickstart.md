# Quickstart: Foundation and Authentication

**Feature**: 001-foundation-auth
**Date**: 2026-02-06

## Prerequisites

- Node.js 20+
- npm or pnpm
- Git
- A Clerk account (https://clerk.com) with a project created
- A Convex account (https://convex.dev) with a project created
- A Vercel account (https://vercel.com) linked to the GitHub repo

## Environment Variables

Create `.env.local` at the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud
CONVEX_DEPLOY_KEY=prod:xxxxx
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Clerk

1. Go to Clerk Dashboard > your project
2. Enable "Google" under Social Connections
3. Enable "Email + Password" under Authentication
4. Copy Publishable Key and Secret Key to `.env.local`

### 3. Configure Convex

```bash
npx convex dev
```

This starts the Convex dev server and syncs your schema. Keep this running in a separate terminal during development.

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 5. Verify Setup

1. Landing page loads at `/`
2. Click "Sign In" — redirects to `/sign-in`
3. Sign in with Google — redirects to `/dashboard`
4. Dashboard shows your name and avatar
5. Click "Sign Out" — returns to landing page
6. Navigate to `/dashboard` while signed out — redirects to `/sign-in`

### 6. Run Tests

```bash
npx playwright test
```

### 7. Deploy to Vercel

1. Push to GitHub
2. Vercel auto-deploys preview
3. Set environment variables in Vercel dashboard
4. Verify preview deployment works

## Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers |
| `app/page.tsx` | Public landing page |
| `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Sign-in page |
| `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Sign-up page |
| `app/(protected)/dashboard/page.tsx` | Authenticated dashboard |
| `middleware.ts` | Route protection |
| `convex/schema.ts` | Database schema |
| `convex/users.ts` | User functions |
| `components/providers.tsx` | Clerk + Convex providers |
| `components/nav-shell.tsx` | Navigation component |
