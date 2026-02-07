# Implementation Plan: Foundation and Authentication

**Branch**: `001-foundation-auth` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-foundation-auth/spec.md`

## Summary

Bootstrap the V1 Drafts application with Next.js 14+ App Router, Convex database, Clerk authentication (Google OAuth + email/password), shadcn/ui component library, and Vercel deployment. This establishes the foundational infrastructure that every subsequent feature depends on: authenticated routing, database connectivity, responsive UI shell, and CI/CD pipeline.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20+
**Primary Dependencies**: Next.js 14+ (App Router), Convex, @clerk/nextjs, shadcn/ui, Tailwind CSS 3.x
**Storage**: Convex (serverless database — TypeScript functions only, zero SQL)
**Testing**: Playwright (E2E), TypeScript compiler (type checking)
**Target Platform**: Web (Vercel-hosted), responsive 375px–1920px
**Project Type**: Web application (Next.js full-stack with Convex backend)
**Performance Goals**: First contentful paint < 3s, sign-in redirect < 5s, Google sign-up < 10s
**Constraints**: Mobile-first (44px min touch targets), zero SQL, all API keys in env vars
**Scale/Scope**: Initial bootstrap — landing page, sign-in/sign-up, dashboard shell, navigation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status |
|---------|------|--------|
| Art. 2: Tech Stack | Next.js 14+ (App Router) | PASS |
| Art. 2: Tech Stack | Convex (database) | PASS |
| Art. 2: Tech Stack | Clerk (authentication) | PASS |
| Art. 2: Tech Stack | shadcn/ui + Tailwind CSS | PASS |
| Art. 2: Tech Stack | Vercel (hosting) | PASS |
| Art. 3.1: Zero SQL | All DB ops via Convex TS functions | PASS |
| Art. 3.3: Mobile Responsive | 44px touch targets, Tailwind breakpoints | PASS |
| Art. 3.4: No Custom Code | Using Clerk (not custom auth), shadcn/ui (not custom components) | PASS |
| Art. 3.6: Git as Memory | Commits reference task IDs | PASS |
| Art. 7.1: Testing | Playwright E2E tests required | PASS |
| Art. 7.2: Types | TypeScript strict mode, no `any` | PASS |
| Art. 7.3: Components | All UI from shadcn/ui | PASS |
| Art. 7.5: Security | Secrets in env vars, Clerk handles auth | PASS |
| Art. 7.6: Accessibility | Semantic HTML, keyboard nav, ARIA labels | PASS |
| Art. 9.5: Frontend Design | Opus Frontend Design Skill for all UI | PASS |

**Result**: All gates PASS. No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── convex-functions.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                 # Root layout: Clerk + Convex providers, metadata
├── page.tsx                   # Landing page (public)
├── globals.css                # Tailwind base styles
├── (auth)/
│   ├── sign-in/[[...sign-in]]/
│   │   └── page.tsx           # Clerk sign-in page
│   └── sign-up/[[...sign-up]]/
│       └── page.tsx           # Clerk sign-up page
└── (protected)/
    ├── layout.tsx             # Protected layout with nav shell
    └── dashboard/
        └── page.tsx           # Dashboard (post-login landing)

components/
├── ui/                        # shadcn/ui components (auto-generated)
├── nav-shell.tsx              # Responsive navigation with user menu
└── providers.tsx              # Clerk + Convex provider wrapper

convex/
├── _generated/                # Convex auto-generated files
├── schema.ts                  # Database schema (users table)
├── users.ts                   # User CRUD functions
└── auth.config.ts             # Clerk-Convex auth integration

lib/
└── utils.ts                   # shadcn/ui utility (cn function)

hooks/
└── (empty for now)

types/
└── (empty for now)

tests/
└── e2e/
    └── auth.spec.ts           # Playwright: sign-up, sign-in, sign-out, route protection

middleware.ts                  # Clerk auth middleware for route protection
tailwind.config.ts             # Tailwind configuration
components.json                # shadcn/ui configuration
convex.json                    # Convex project config
```

**Structure Decision**: Next.js App Router with route groups: `(auth)` for public auth pages, `(protected)` for authenticated pages. Convex directory at root for backend functions. Standard shadcn/ui structure with `components/ui/` for generated components.

## Complexity Tracking

No constitution violations to justify. All technology choices align with mandated stack.
