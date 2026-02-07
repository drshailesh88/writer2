# V1 Drafts — Project Context

## What Is This Project?

V1 Drafts is an AI-powered SaaS web app that teaches medical students how to write research papers (Learn Mode) while providing tools to do it faster (Draft Mode) — paper search, citations, bibliography, plagiarism check, AI detection, all under one roof.

**Positioning**: "KhanMigo meets SciSpace"
**Tagline**: "All research needs met under one single roof."
**Target user**: 3rd-year MD student in India writing a thesis for the first time.
**Pricing**: INR 1,000/month via Razorpay (UPI + cards). No free tier except plagiarism funnel.

## Critical Files to Read First

| File | What It Contains |
|---|---|
| `.specify/memory/constitution.md` | Non-negotiable project principles — tech stack, architecture rules, mode specifications |
| `.taskmaster/docs/prd.txt` | Complete Product Requirements Document (1099 lines) — every feature specified in detail |
| `.taskmaster/tasks/tasks.json` | Task breakdown with status — what's done, what's next |
| `.specify/specs/` | Per-feature specifications (spec → plan → tasks → implement) |

## Tech Stack (Quick Reference)

- **Frontend**: Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui
- **Database**: Convex (no SQL — TypeScript functions only)
- **Auth**: Clerk (Google + email/password)
- **AI Agents**: Mastra (Apache 2.0, built on Vercel AI SDK)
- **LLM**: GLM-4.7 (Zhipu AI) — $0.07/1M in, $0.40/1M out
- **Paper Search**: PubMed + Semantic Scholar + OpenAlex (all free APIs)
- **Deep Research**: GPT Researcher (Python microservice)
- **Editor**: Tiptap (MIT)
- **Citations**: Citation.js (Vancouver, APA, AMA, Chicago)
- **Plagiarism + AI Detection**: Copyleaks API (Node.js SDK)
- **Payments**: Razorpay
- **Hosting**: Vercel (frontend) + Google Cloud Run (Python)
- **Testing**: Playwright (E2E) — every feature must pass tests before done

## Build Methodology

### Spec Kit (Source of Truth)
Every feature follows: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`
Specs live in `.specify/specs/NNN-feature-name/`

### Task Master
Run `task-master list` to see all tasks. Run `task-master next` to find what to work on.
Run `task-master show <id>` for details. Mark done with `task-master set-status --id=<id> --status=done`.

### Multi-Terminal Coordination
All terminals share task list via `CLAUDE_CODE_TASK_LIST_ID="v1-drafts"` in `.claude/settings.json`.
Check what others are working on with `task-master list` before starting.

### Ralph Wiggum Principle
- Small scope per session (1 feature or sub-feature)
- Fresh context each time (read specs, don't rely on conversation)
- Git as memory (commit after each completed task)
- Tests as backpressure (Playwright must pass before marking done)

### Frontend Design (MANDATORY)
**ALL frontend work MUST use Anthropic's Frontend Design Skill with Opus model.** This is non-negotiable.
- Any page, layout, component, or screen that touches UI → use Frontend Design Skill + Opus
- This includes: landing page, dashboard, search UI, editor, results panels, modals, navigation, mobile layouts, pricing page — everything visual
- Design philosophy: Clean, non-overwhelming, Google Docs simplicity, professional academic feel
- After generating UI with Frontend Design Skill, implement using shadcn/ui + Tailwind CSS
- Mobile responsive from day one (test on 375px and 1280px viewports)

## Git Workflow

- **Repo**: https://github.com/drshailesh88/writer2
- **Main branch**: `main`
- **Commit format**: `feat: implement [feature] (task [ID])`
- **Rule**: Commit after every completed task. Push to remote regularly.

## What NOT To Build (V2 — Parked)

- Real-time collaboration
- Chat with PDF
- Paraphrasing tool
- LaTeX export
- Chrome extension
- Multi-LLM user selection
- PDF annotation
- Native mobile app

## Task Master AI Instructions
@./.taskmaster/CLAUDE.md

## Active Technologies
- TypeScript 5.x (strict mode), Node.js 20+ + Next.js 14+ (App Router), Convex, @clerk/nextjs, shadcn/ui, Tailwind CSS 3.x (001-foundation-auth)
- Convex (serverless database — TypeScript functions only, zero SQL) (001-foundation-auth)
- TypeScript 5.x (strict mode) + Convex 1.31.7 (defineSchema, defineTable, v validators, mutation, query, internalMutation) (002-convex-database-schema)
- Convex (serverless document database with built-in file storage) (002-convex-database-schema)
- TypeScript 5.x, Next.js 16.1.6 (App Router) + Next.js API routes (search aggregation), Convex (persistence), Clerk (auth), shadcn/ui + Tailwind CSS (UI), lucide-react (icons) (004-paper-search)
- Convex (papers, collections tables — already exist) (004-paper-search)

## Recent Changes
- 001-foundation-auth: Added TypeScript 5.x (strict mode), Node.js 20+ + Next.js 14+ (App Router), Convex, @clerk/nextjs, shadcn/ui, Tailwind CSS 3.x
