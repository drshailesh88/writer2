# Tasks: Foundation and Authentication

**Input**: Design documents from `/specs/001-foundation-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Playwright E2E tests are included per Constitution Article 7.1 ("Every feature must have Playwright E2E tests before being marked done").

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Next.js App Router (web app, single project)
- `app/` for pages and layouts
- `components/` for React components
- `convex/` for database schema and functions
- `lib/` for utilities
- `tests/e2e/` for Playwright tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js project, install all dependencies, and create the base folder structure.

- [x] T001 Initialize Next.js 14+ project with App Router, TypeScript, Tailwind CSS, and ESLint using `npx create-next-app@latest` in the repository root
- [x] T002 Install core dependencies: `convex`, `@clerk/nextjs`, `@clerk/clerk-react` via npm
- [x] T003 [P] Initialize shadcn/ui with "new-york" style, slate color, CSS variables via `npx shadcn@latest init` and update `components.json`
- [x] T004 [P] Install Playwright and create base config in `playwright.config.ts`
- [x] T005 Create `.env.local` template with all required environment variables (Clerk keys, Convex URL) and add `.env.local` to `.gitignore`
- [x] T006 Configure TypeScript strict mode in `tsconfig.json` (strict: true, no implicit any)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Create Convex schema with `users` table definition (clerkId, email, name, avatarUrl, subscriptionTier, createdAt, updatedAt) with indexes in `convex/schema.ts`
- [x] T008 Implement `users.getOrCreate` mutation in `convex/users.ts` — creates user record on first authenticated access from `ctx.auth.getUserIdentity()`
- [x] T009 [P] Implement `users.getCurrent` query in `convex/users.ts` — returns current user record or null
- [x] T010 Configure Clerk-Convex auth integration in `convex/auth.config.ts`
- [x] T011 Create Clerk + Convex provider wrapper component in `components/providers.tsx` using `ConvexProviderWithClerk`
- [x] T012 Wire providers into root layout in `app/layout.tsx` — wrap children with ClerkProvider and ConvexProviderWithClerk, add metadata (title, description)
- [x] T013 Implement Clerk auth middleware with `clerkMiddleware()` and `createRouteMatcher()` for public routes (`/`, `/sign-in(.*)`, `/sign-up(.*)`) in `middleware.ts`

**Checkpoint**: Foundation ready — Convex connected, Clerk configured, middleware protecting routes, providers wrapping app.

---

## Phase 3: User Story 1 — New User Signs Up with Google (Priority: P1) MVP

**Goal**: A new user clicks "Sign in with Google", authorizes the app, and lands on a dashboard showing their name and avatar.

**Independent Test**: Visit sign-up page, click "Sign in with Google", complete OAuth, verify dashboard shows user identity.

### Implementation for User Story 1

- [x] T014 [US1] Create the Clerk sign-up page at `app/(auth)/sign-up/[[...sign-up]]/page.tsx` using Clerk's `<SignUp>` component with Google OAuth enabled
- [x] T015 [US1] Create the Clerk sign-in page at `app/(auth)/sign-in/[[...sign-in]]/page.tsx` using Clerk's `<SignIn>` component with Google OAuth enabled
- [x] T016 [US1] Create the protected layout at `app/(protected)/layout.tsx` that calls `users.getOrCreate` on mount to sync Clerk identity to Convex user record
- [x] T017 [US1] Create the dashboard page at `app/(protected)/dashboard/page.tsx` that displays the current user's name, email, and avatar using `users.getCurrent` query
- [x] T018 [US1] Create the public landing page at `app/page.tsx` with "Sign In" and "Sign Up" call-to-action buttons linking to `/sign-in` and `/sign-up`

**Checkpoint**: User Story 1 fully functional — new user can sign up with Google, user record created in Convex, dashboard shows identity.

---

## Phase 4: User Story 3 — Returning User Signs In (Priority: P1)

**Goal**: A returning user signs in with Google or email/password and reaches their dashboard with existing data preserved.

**Independent Test**: Sign in with previously created credentials, verify dashboard loads with user data.

### Implementation for User Story 3

- [x] T019 [US3] Verify sign-in flow handles existing Convex user record correctly — `users.getOrCreate` returns existing record without creating duplicate in `convex/users.ts`
- [x] T020 [US3] Configure Clerk `afterSignInUrl` to redirect to `/dashboard` in environment variables and verify redirect works

**Checkpoint**: Returning users can sign in and see their existing dashboard data.

---

## Phase 5: User Story 4 — Protected Routes Enforce Authentication (Priority: P1)

**Goal**: Unauthenticated users are redirected to sign-in when accessing protected pages; after sign-in they land on their requested page.

**Independent Test**: Navigate to `/dashboard` while logged out, verify redirect to `/sign-in`, then sign in and verify redirect back to `/dashboard`.

### Implementation for User Story 4

- [x] T021 [US4] Verify middleware correctly redirects unauthenticated users from all protected routes to `/sign-in` (test with `/dashboard` route)
- [x] T022 [US4] Configure Clerk `redirectUrl` parameter to preserve the originally requested URL after authentication in `middleware.ts`

**Checkpoint**: Route protection working — all protected routes redirect to sign-in, post-auth redirect preserves original URL.

---

## Phase 6: User Story 2 — New User Signs Up with Email and Password (Priority: P2)

**Goal**: A new user creates an account using email and password with email verification.

**Independent Test**: Enter email and password on sign-up, complete email verification, verify dashboard loads.

### Implementation for User Story 2

- [x] T023 [US2] Configure Clerk sign-up component to show email/password fields alongside Google OAuth in `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- [ ] T024 [US2] Verify email verification flow works end-to-end — user receives email, clicks link, account activates, redirects to dashboard (requires live Clerk credentials)

**Checkpoint**: Both auth methods (Google + email/password) work for sign-up.

---

## Phase 7: User Story 5 — User Signs Out (Priority: P2)

**Goal**: Authenticated user clicks "Sign Out", session terminates, returned to landing page.

**Independent Test**: Sign in, click sign out, verify redirect to landing page and session terminated.

### Implementation for User Story 5

- [x] T025 [US5] Create responsive navigation shell component in `components/nav-shell.tsx` with user avatar, name display, and "Sign Out" button using Clerk's `<UserButton>` or `useClerk().signOut()`
- [x] T026 [US5] Integrate navigation shell into protected layout at `app/(protected)/layout.tsx`
- [x] T027 [US5] Install shadcn/ui components needed for nav: `button`, `avatar`, `dropdown-menu`, `sheet` (mobile menu) via `npx shadcn@latest add`

**Checkpoint**: Sign-out works, nav shell displays user identity with sign-out action.

---

## Phase 8: User Story 6 — Application Loads on Mobile (Priority: P2)

**Goal**: All pages (landing, sign-in, sign-up, dashboard) are fully usable on mobile (375px viewport) with 44px touch targets.

**Independent Test**: Load app on 375px viewport, verify all elements tappable and no horizontal scrolling.

### Implementation for User Story 6

- [x] T028 [US6] Apply mobile-first responsive styles to landing page in `app/page.tsx` — 44px min touch targets, readable text at 375px, no horizontal scroll
- [x] T029 [P] [US6] Apply mobile-first responsive styles to auth pages in `app/(auth)/sign-in/` and `app/(auth)/sign-up/` — centered forms, adequate spacing
- [x] T030 [US6] Implement mobile hamburger menu in `components/nav-shell.tsx` using shadcn/ui `Sheet` component — hidden on desktop, visible on mobile
- [x] T031 [US6] Apply mobile-first responsive styles to dashboard in `app/(protected)/dashboard/page.tsx` — readable layout at 375px

**Checkpoint**: All pages usable on mobile with 44px touch targets and no horizontal scrolling.

---

## Phase 9: Playwright E2E Tests

**Purpose**: E2E tests per Constitution Article 7.1 — every feature must have Playwright tests before being marked done.

- [x] T032 Write Playwright E2E test: unauthenticated user visiting `/dashboard` is redirected to sign-in in `tests/e2e/auth.spec.ts`
- [x] T033 Write Playwright E2E test: user can sign in and land on dashboard with name displayed in `tests/e2e/auth.spec.ts`
- [x] T034 Write Playwright E2E test: user can sign out and is returned to landing page in `tests/e2e/auth.spec.ts`
- [x] T035 Write Playwright E2E test: Convex user record is created on first sign-in (verify via dashboard data) in `tests/e2e/auth.spec.ts`
- [ ] T036 Run all Playwright tests and verify they pass: `npx playwright test` (requires live Clerk + Convex credentials)

**Checkpoint**: All E2E tests pass. Feature is complete and verified.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, error handling, and deployment verification.

- [x] T037 [P] Add loading states during authentication transitions in `app/(protected)/layout.tsx` and `app/page.tsx` using Clerk's `<SignedIn>/<SignedOut>` components
- [x] T038 [P] Add error boundary for auth service failures with user-friendly message: "We're having trouble connecting. Please try again in a moment."
- [x] T039 [P] Add `<noscript>` tag in `app/layout.tsx` with message: "JavaScript is required to use V1 Drafts"
- [x] T040 Verify TypeScript compiles with zero errors: `npx tsc --noEmit`
- [ ] T041 Verify Vercel preview deployment succeeds by pushing branch and checking build (requires live credentials)
- [ ] T042 Run quickstart.md validation — follow all setup steps and verify they work (requires live credentials)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 3 (Phase 4)**: Depends on US1 (needs sign-up to test sign-in)
- **User Story 4 (Phase 5)**: Depends on Foundational (Phase 2) — can run parallel with US1
- **User Story 2 (Phase 6)**: Depends on US1 (Phase 3) — extends sign-up page
- **User Story 5 (Phase 7)**: Depends on US1 (Phase 3) — needs authenticated state for sign-out
- **User Story 6 (Phase 8)**: Depends on US5 (Phase 7) — needs nav shell to exist for mobile styling
- **E2E Tests (Phase 9)**: Depends on all user stories
- **Polish (Phase 10)**: Depends on E2E tests passing

### User Story Dependencies

- **US1 (Google Sign-Up)**: Foundation only — MVP entry point
- **US3 (Returning User)**: Depends on US1 (needs existing user)
- **US4 (Route Protection)**: Foundation only — parallel with US1
- **US2 (Email Sign-Up)**: Depends on US1 (extends sign-up page)
- **US5 (Sign Out)**: Depends on US1 (needs auth state)
- **US6 (Mobile)**: Depends on US5 (needs nav shell)

### Parallel Opportunities

- T003 and T004 can run in parallel (different config files)
- T008 and T009 can run in parallel (different Convex functions)
- T014 and T015 can run in parallel (different auth pages)
- T028, T029 can run in parallel (different page files)
- T037, T038, T039 can run in parallel (different concerns)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These can run in parallel (different files):
Task: "Create Convex schema in convex/schema.ts"
Task: "Configure Clerk-Convex auth in convex/auth.config.ts"

# These run after schema (depends on schema):
Task: "Implement users.getOrCreate mutation in convex/users.ts"
Task: "Implement users.getCurrent query in convex/users.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T013)
3. Complete Phase 3: User Story 1 (T014-T018)
4. **STOP and VALIDATE**: Test Google sign-up flow end-to-end
5. Deploy preview to Vercel

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Google Sign-Up) → Test → Deploy (MVP!)
3. Add US3 (Returning User) + US4 (Route Protection) → Test → Deploy
4. Add US2 (Email Sign-Up) + US5 (Sign-Out) → Test → Deploy
5. Add US6 (Mobile) → Test → Deploy
6. E2E Tests + Polish → Final Deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each completed task per Constitution Article 3.6
- Use Frontend Design Skill (Opus) for all UI work per Constitution Article 9.5
- All UI components from shadcn/ui per Constitution Article 7.3
- Zero SQL — all database operations via Convex TypeScript functions per Constitution Article 3.1
