# V1 Drafts — Project Constitution
# Established: February 6, 2026
# Status: IMMUTABLE — Do not modify unless versioned

---

## Article 1: Product Identity

- **Name**: V1 Drafts
- **Positioning**: "KhanMigo meets SciSpace" — educational hand-holding of Khan Academy's Writing Coach combined with the research power of SciSpace, purpose-built for medical and academic researchers.
- **Tagline**: "All research needs met under one single roof."
- **Primary Avatar**: 3rd-year MD postgraduate student in India writing thesis for the first time.

---

## Article 2: Technology Stack (Non-Negotiable)

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | Standard React framework |
| Database | Convex | No SQL required — all TypeScript functions |
| Authentication | Clerk | Managed auth, native Convex integration |
| Agent Framework | Mastra (Apache 2.0) | Built on Vercel AI SDK, supports 53+ LLM providers, no vendor lock-in |
| LLM (V1) | GLM-4.7 (Zhipu AI) | Cost-effective: $0.07/1M input, $0.40/1M output |
| UI Components | shadcn/ui + Tailwind CSS | Clean, accessible, mobile-first |
| Text Editor | Tiptap (MIT) | Headless rich text editor |
| Citations | Citation.js (MIT) | CSL engine — same as Zotero/Mendeley |
| Paper Search | PubMed + Semantic Scholar + OpenAlex APIs | All free, combined 200M+ papers |
| Deep Research | GPT Researcher (Apache 2.0) | Python microservice, self-hosted |
| Plagiarism + AI Detection | Copyleaks API (Node.js SDK) | White-label, one integration, two features |
| Payments | Razorpay | UPI + cards, India-focused |
| Hosting | Vercel (frontend) + Google Cloud (Python services) | |
| PDF Viewer | PDF.js (Apache 2.0) | |
| DOCX Export | docx npm (MIT) | |
| PDF Export | jspdf npm (MIT) | |

---

## Article 3: Architecture Principles

1. **ZERO SQL**: All database operations via Convex TypeScript functions. No raw SQL, no ORMs, no PostgreSQL.
2. **NO VENDOR LOCK-IN**: Mastra abstracts the LLM layer. Switching from GLM-4.7 to Claude or GPT-4o must require only a config change.
3. **MOBILE RESPONSIVE FROM DAY ONE**: Every screen must work on mobile. Minimum 44px touch targets. Tailwind breakpoints enforced.
4. **NO CUSTOM CODE WHERE OPEN-SOURCE EXISTS**: Use Tiptap not a custom editor. Use Citation.js not custom citation logic. Use Copyleaks not custom plagiarism detection.
5. **FILE-BASED PERSISTENCE FOR AI STATE**: Mastra workflows use suspend/resume. Workflow state persists across sessions.
6. **GIT AS MEMORY**: Every feature gets a commit. Commits reference task IDs. Git history is the project's memory.

---

## Article 4: Two Modes — The Core Differentiator

### 4.1 LEARN MODE (KhanMigo-Inspired)
- The AI is a WRITING COACH, not a writer
- Uses Socratic questioning — asks probing questions, never gives direct answers
- Enforces sequential 5-stage process (Understand → Literature → Outline → Draft → Feedback)
- **ALLOWED**: Sentence starters, examples from published papers, templates on request, feedback
- **NEVER ALLOWED**: Writing complete sentences, completing student's sentences, generating paragraphs
- Default structure: IMRAD (flexible if student specifies journal guidelines)
- Feedback delivered ONE CATEGORY at a time, ONE SUGGESTION at a time

### 4.2 DRAFT MODE (SciSpace-Inspired)
- The AI is a WRITING ASSISTANT that does the heavy lifting
- **Guided sub-mode**: Human-in-the-loop at every stage (outline → papers → write)
- **Hands-off sub-mode**: Fully autonomous with disclaimer
- Always cites from approved papers only
- Disclaimer MUST be displayed for hands-off mode

---

## Article 5: Disclaimers (Mandatory)

### 5.1 Hands-Off Mode Disclaimer
"V1 Drafts provides AI-assisted research and writing tools to accelerate your academic workflow. The hands-off mode generates a complete first draft autonomously. This draft is a starting point and MUST be reviewed, verified, and edited by you before submission. V1 Drafts is not responsible for the accuracy, originality, or academic integrity of content submitted to journals or universities. You are solely responsible for your submissions."

### 5.2 AI Detection Disclaimer
"AI detection provides an estimate, not a definitive conclusion. Scientific and medical writing may show elevated scores due to standardized structure and specialized vocabulary. Non-native English writers may also see higher scores. Results should not be used as sole evidence of AI use."

---

## Article 6: Pricing and Usage Limits

| Tier | Price | Plagiarism | AI Detection | Deep Research | Draft Mode |
|---|---|---|---|---|---|
| No signup | Free | 1 check (1000 words) | None | None | None |
| Free account | Free | 2/month | 2/month | None | None |
| Basic | INR 1,000/month | 5/month | 10/month | 5/month | Unlimited |
| Pro (future) | INR 2,000/month | 20/month | Unlimited | 15/month | Unlimited |

---

## Article 7: Code Quality Standards

1. **TESTING**: Every feature must have Playwright E2E tests before being marked done.
2. **TYPES**: TypeScript strict mode. No `any` types unless absolutely unavoidable.
3. **COMPONENTS**: All UI components from shadcn/ui. Custom components only when shadcn doesn't cover the use case.
4. **ERROR HANDLING**: Graceful degradation for all external API failures (PubMed, Semantic Scholar, Copyleaks, GLM-4.7). User always sees a meaningful message.
5. **SECURITY**: No secrets in code. All API keys in environment variables. Clerk handles all auth. Input sanitization on all user-facing inputs.
6. **ACCESSIBILITY**: Semantic HTML. Keyboard navigation. ARIA labels on interactive elements.

---

## Article 8: Citation Styles (V1)

Supported styles in V1:
- Vancouver (most common in medical journals)
- APA (American Psychological Association)
- AMA (American Medical Association)
- Chicago

Target journals: NEJM, Lancet, JAMA, JACC, Nature — formatted correctly for these.

---

## Article 9: Build Methodology

1. **Spec Kit** is the source of truth for specifications. Every feature goes through: specify → plan → tasks → implement.
2. **Task Master** manages task breakdown and progress tracking.
3. **Claude Code Tasks** coordinates across parallel terminal sessions via shared task list.
4. **Ralph Wiggum principle**: Small tasks, fresh context per session, git as memory, tests as backpressure.
5. **Frontend Design Skill (Opus) — MANDATORY**: ALL frontend work — every page, component, layout, screen, modal, and navigation element — MUST be designed using Anthropic's Frontend Design Skill with the Opus model. No exceptions. Generate the design first with Frontend Design Skill + Opus, then implement with shadcn/ui + Tailwind CSS.
6. **Playwright**: E2E tests gate every feature. Nothing ships without passing tests.

---

## Article 10: What Is NOT in V1

These features are explicitly parked for V2:
- Real-time collaboration / co-editing
- Supervisor/guide visibility dashboard
- Chat with PDF / talk to paper
- Paraphrasing tool
- LaTeX export
- Chrome extension
- Multi-LLM model selection for users
- Submission readiness checker
- PDF annotation & highlighting
- Native mobile app (PWA later)

---

## Governance

This constitution supersedes all other practices. Any deviation requires explicit approval from the Product Manager (Shailesh). Amendments must be documented with version number and date.

**Version**: 1.0 | **Ratified**: 2026-02-06 | **Last Amended**: 2026-02-06
