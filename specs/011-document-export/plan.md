# Implementation Plan: Document Export (DOCX + PDF)

**Branch**: `011-document-export` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-document-export/spec.md`

## Summary

Add DOCX and PDF export to the Tiptap writing editor. Build a shared Tiptap JSON → intermediate block converter, then format-specific exporters using `docx` (MIT) and `jspdf` (MIT). Export is client-side only. Free users are blocked (upgrade modal), Basic/Pro get unlimited exports. An Export dropdown is added to the editor toolbar after the AI Detection section.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 14+ (App Router), docx (npm, MIT), jspdf (npm, MIT), shadcn/ui, Tailwind CSS, Tiptap
**Storage**: Convex (existing documents, citations, papers, users tables — no schema changes)
**Testing**: Playwright (E2E)
**Target Platform**: Web (Vercel), client-side export generation
**Project Type**: Web application (Next.js monolith)
**Performance Goals**: Export within 5 seconds for documents up to 10,000 words
**Constraints**: Client-side only (no server-side rendering), mobile responsive (44px touch targets)
**Scale/Scope**: 2 export formats, 4 citation styles, 3 subscription tiers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Requirement | Status | Notes |
|---------|------------|--------|-------|
| Art. 2: Tech Stack | docx npm (MIT) for DOCX, jspdf npm (MIT) for PDF | PASS | Both explicitly listed in constitution |
| Art. 3.1: Zero SQL | No database changes | PASS | Reads existing Convex data only |
| Art. 3.3: Mobile Responsive | 44px touch targets, Tailwind breakpoints | PASS | Export dropdown follows existing toolbar patterns |
| Art. 3.4: No Custom Code | Using open-source libraries (docx, jspdf) | PASS | No custom document format generation |
| Art. 3.6: Git as Memory | Commit after each completed task | PASS | Standard workflow |
| Art. 6: Pricing Limits | Free=blocked, Basic/Pro=unlimited | PASS | Matches constitution pricing table |
| Art. 7.1: Testing | Playwright E2E tests required | PASS | tests/e2e/export.spec.ts planned |
| Art. 7.2: Types | TypeScript strict mode, no `any` | PASS | All types defined in data-model.md |
| Art. 7.3: Components | shadcn/ui components (DropdownMenu) | PASS | Uses existing shadcn/ui |
| Art. 7.6: Accessibility | ARIA labels, keyboard navigation | PASS | DropdownMenu provides this natively |
| Art. 9.5: Frontend Design | Must use Frontend Design Skill + Opus | PASS | Export dropdown UI via ui-designer agent |
| Art. 10: V2 Scope | LaTeX export is V2 | PASS | Explicitly out of scope |

**Gate Result**: ALL PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/011-document-export/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technology decisions
├── data-model.md        # Data model (no schema changes)
├── quickstart.md        # Quick reference
├── contracts/           # API contracts
│   └── export-api.md    # Client-side function contracts
├── checklists/          # Quality checklists
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
lib/export/
├── tiptap-to-blocks.ts    # Shared: Tiptap JSON → ExportBlock[] converter
├── docx-exporter.ts       # ExportBlock[] → DOCX generation + download
└── pdf-exporter.ts        # ExportBlock[] → PDF generation + download

components/editor/
├── editor-toolbar.tsx     # MODIFY: Add export dropdown after AI Detection
└── tiptap-editor.tsx      # MODIFY: Add export callback props

app/(protected)/editor/[id]/
└── page.tsx               # MODIFY: Wire export handlers

convex/lib/
└── subscriptionLimits.ts  # MODIFY: Add "export" feature

components/modals/
└── upgrade-modal.tsx      # MODIFY: Support "export" feature type

tests/e2e/
└── export.spec.ts         # NEW: Playwright E2E tests
```

**Structure Decision**: Follows existing project layout. New `lib/export/` directory for export logic. All modifications to existing files follow established patterns.

## Complexity Tracking

> No constitution violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |
