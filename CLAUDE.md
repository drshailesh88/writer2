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

### Frontend Design
Use Anthropic Frontend Design Skill (Opus) for all UI work. Clean, non-overwhelming, Google Docs simplicity.

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
