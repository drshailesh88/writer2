# Research: Foundation and Authentication

**Feature**: 001-foundation-auth
**Date**: 2026-02-06

## R1: Next.js 14+ App Router with Clerk Integration

**Decision**: Use Next.js 14+ App Router with `@clerk/nextjs` v5+ for authentication.

**Rationale**: Clerk provides first-class Next.js App Router support including:
- `<ClerkProvider>` wraps the root layout
- `clerkMiddleware()` in `middleware.ts` for route protection
- `<SignIn>` and `<SignUp>` prebuilt components for auth pages
- `auth()` server function for server components
- `useUser()` / `useAuth()` hooks for client components

**Alternatives considered**:
- NextAuth.js: More configuration required, no managed dashboard, would need to build user management from scratch
- Supabase Auth: Not in constitution's tech stack, would add another service dependency
- Custom JWT: Constitution Article 3.4 prohibits custom code where open-source exists

## R2: Convex + Clerk Integration Pattern

**Decision**: Use `@clerk/clerk-react` with Convex's `ConvexProviderWithClerk` for seamless auth-database integration.

**Rationale**: Convex has native Clerk integration:
- `ConvexProviderWithClerk` wraps the app to share auth state between Clerk and Convex
- Convex functions can access `ctx.auth.getUserIdentity()` to get the authenticated user
- User records are synced via Clerk webhooks or on-first-access pattern
- Zero SQL: all operations are Convex TypeScript mutations/queries

**Alternatives considered**:
- Manual JWT verification in Convex: Unnecessary complexity, Convex handles it natively
- Separate auth state management: Would create sync issues between Clerk and Convex

## R3: Route Protection Strategy

**Decision**: Use Clerk's `clerkMiddleware()` with `createRouteMatcher()` to define public vs. protected routes at the middleware level.

**Rationale**:
- Middleware runs before page render, preventing flash of authenticated content
- `createRouteMatcher` allows declarative route patterns: `["/", "/sign-in(.*)", "/sign-up(.*)"]` as public
- Everything else is protected by default (secure by default pattern)
- After-auth redirect handled by Clerk's `afterSignInUrl` and `afterSignUpUrl` config

**Alternatives considered**:
- Per-page auth checks: Error-prone, easy to forget on new pages
- Layout-level auth: Still shows layout before redirect, worse UX

## R4: Convex Schema Design for Users

**Decision**: Create a `users` table in Convex with fields synced from Clerk on first sign-in.

**Rationale**:
- Clerk manages auth identity, but V1 Drafts needs its own user record for app-specific data (subscription tier, usage counts)
- On first authenticated access, a Convex mutation creates/updates the user record
- Fields: `clerkId`, `email`, `name`, `avatarUrl`, `subscriptionTier`, `createdAt`
- This avoids Clerk webhook complexity for the initial setup; webhooks can be added later

**Alternatives considered**:
- Clerk webhooks only: Adds infrastructure complexity (webhook endpoint, verification), overkill for initial setup
- No local user record: Would require Clerk API calls for every user data lookup, slow and costly

## R5: shadcn/ui Setup with Next.js App Router

**Decision**: Initialize shadcn/ui with `npx shadcn@latest init` using the "new-york" style, slate color, and CSS variables.

**Rationale**:
- "new-york" style is cleaner and more professional (Google Docs simplicity per constitution)
- CSS variables enable future theming capability
- Tailwind CSS 3.x is the styling backbone with shadcn/ui components
- Components installed on-demand via `npx shadcn@latest add button` etc.

**Alternatives considered**:
- "default" style: More rounded, less professional for academic tool
- Chakra UI / Mantine: Not in constitution's tech stack (Article 2)

## R6: Vercel Deployment Strategy

**Decision**: Connect GitHub repo to Vercel for automatic preview and production deployments.

**Rationale**:
- Vercel is mandated by constitution (Article 2)
- Automatic preview deployments on every PR
- Production deploys on merge to `main`
- Environment variables configured in Vercel dashboard (Clerk keys, Convex URL)
- `npx convex deploy` runs as part of build for production Convex deployment

**Alternatives considered**:
- Manual deploys: Contradicts CI/CD best practices and constitution's git-as-memory principle
- Docker/Cloud Run for frontend: Constitution specifies Vercel for frontend

## R7: Mobile-First Responsive Approach

**Decision**: Use Tailwind CSS responsive utilities with mobile-first breakpoints. All components designed for 375px first, then enhanced for larger screens.

**Rationale**:
- Constitution Article 3.3 mandates mobile-responsive from day one with 44px touch targets
- Tailwind's mobile-first approach (`sm:`, `md:`, `lg:`) matches this requirement
- shadcn/ui components are already responsive but need touch target enforcement
- Navigation shell uses hamburger menu on mobile, full nav on desktop

**Alternatives considered**:
- Desktop-first with mobile overrides: Harder to maintain, contradicts constitution
- Separate mobile views: Over-engineering, responsive design is sufficient
