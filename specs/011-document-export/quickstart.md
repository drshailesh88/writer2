# Quickstart: Document Export (DOCX + PDF)

**Feature**: 011-document-export
**Date**: 2026-02-07

## Prerequisites

- Node.js 20+
- `npm install docx jspdf` (new dependencies)
- Existing editor, bibliography, and subscription systems working

## Files to Create

| File | Purpose |
|------|---------|
| `lib/export/tiptap-to-blocks.ts` | Shared Tiptap JSON → ExportBlock[] converter |
| `lib/export/docx-exporter.ts` | ExportBlock[] → DOCX file generation + download |
| `lib/export/pdf-exporter.ts` | ExportBlock[] → PDF file generation + download |
| `tests/e2e/export.spec.ts` | Playwright E2E tests |

## Files to Modify

| File | Change |
|------|--------|
| `components/editor/editor-toolbar.tsx` | Add Export dropdown after AI Detection section |
| `app/(protected)/editor/[id]/page.tsx` | Wire export handlers, pass document data |
| `components/editor/tiptap-editor.tsx` | Add onExportDocx/onExportPdf props, pass to toolbar |
| `convex/lib/subscriptionLimits.ts` | Add "export" feature to limits (Free=0, Basic/Pro=-1) |
| `components/modals/upgrade-modal.tsx` | Extend to support "export" feature type |

## Existing Code to Reuse

| File | Functions/Patterns |
|------|-------------------|
| `lib/bibliography.ts` | `generateBibliography()`, `convertPaperToCSL()`, `formatInTextCitation()` |
| `convex/citations.ts` | `listWithPapers` query (already used by BibliographySection) |
| `convex/lib/subscriptionLimits.ts` | `checkUsageLimit()` function pattern |
| `components/modals/upgrade-modal.tsx` | Upgrade modal pattern |
| `components/editor/bibliography-section.tsx` | Paper extraction from citations pattern |

## Quick Test

1. Open editor with a document that has citations
2. Click Export dropdown → Export as DOCX → verify download
3. Click Export dropdown → Export as PDF → verify download
4. Switch to free account → attempt export → verify upgrade modal
