# Research: Document Export (DOCX + PDF)

**Feature**: 011-document-export
**Date**: 2026-02-07

## Decision 1: DOCX Generation Library

- **Decision**: Use `docx` npm package (MIT license)
- **Rationale**: Specified in constitution (Article 2) and PRD (Section 4.10.3). Pure JavaScript, client-side generation, well-maintained (4k+ GitHub stars), provides Document/Paragraph/TextRun/HeadingLevel APIs for structured document creation.
- **Alternatives considered**: officegen (less maintained), mammoth (read-only, not generation), pizzip+docxtemplater (template-based, not suitable for dynamic content).

## Decision 2: PDF Generation Library

- **Decision**: Use `jspdf` npm package (MIT license)
- **Rationale**: Specified in constitution (Article 2) and PRD (Section 4.10.3). Client-side PDF generation, supports text styling (bold/italic/underline), page management, and font control. Most popular JavaScript PDF generation library.
- **Alternatives considered**: pdfkit (Node.js focused, not ideal for browser), html-pdf (server-side), react-pdf/renderer (React component tree, over-complex for this use case).

## Decision 3: Tiptap JSON to Export Pipeline Architecture

- **Decision**: Build a shared intermediate block converter (`tiptap-to-blocks.ts`) that both exporters consume.
- **Rationale**: Tiptap stores content as a JSON tree (ProseMirror schema). Walking this tree is the same logic for both DOCX and PDF — only the output rendering differs. A shared converter avoids duplicating the tree-walking logic and makes adding new export formats trivial.
- **Alternatives considered**: Direct Tiptap JSON → DOCX/PDF (duplicates parsing), HTML-to-DOCX/PDF (lossy, adds HTML serialization step), server-side conversion (adds complexity, latency).

## Decision 4: Subscription Gating Approach

- **Decision**: Simple tier check — Free users are blocked (show upgrade modal), Basic/Pro get unlimited access. No usage counter needed.
- **Rationale**: PRD specifies "Export: Not available (view only)" for Free and "Export: Unlimited (DOCX + PDF)" for Basic/Pro. Unlike plagiarism/AI detection, there's no monthly cap to track. Reuse existing `subscriptionLimits.ts` pattern by adding an "export" feature type with Free=0, Basic=-1, Pro=-1.
- **Alternatives considered**: Adding a usage counter (unnecessary per PRD), server-side gating (over-complex for a client-side operation).

## Decision 5: Export UI Pattern

- **Decision**: DropdownMenu (shadcn/ui) with FileDown icon, positioned after AI Detection in the toolbar.
- **Rationale**: Follows existing toolbar patterns. DropdownMenu is already available in shadcn/ui. Position after AI Detection matches the user's workflow: write → check plagiarism → check AI → export. Two clear options: "Export as DOCX" and "Export as PDF".
- **Alternatives considered**: Separate buttons for each format (uses more toolbar space), a modal with preview (over-complex for V1, matches V2 scope).

## Decision 6: Client-side vs Server-side Export

- **Decision**: Fully client-side export using browser APIs.
- **Rationale**: Both `docx` and `jspdf` support client-side generation. The document content is already loaded in the editor. No secrets or server resources needed. Avoids adding API routes and server-side dependencies. Uses blob URL + anchor click for download (not affected by popup blockers).
- **Alternatives considered**: Server-side rendering (adds latency, API route complexity, no benefit for this use case).

## Decision 7: Upgrade Modal for Export

- **Decision**: Extend existing `UpgradeModal` component to support an "export" feature type.
- **Rationale**: The modal is already built and styled. It currently supports "plagiarism" and "aiDetection" features. Adding "export" requires extending the FEATURE_LABELS and TIER_LIMITS constants and the TypeScript union type.
- **Alternatives considered**: Building a separate export upgrade modal (code duplication, inconsistent UX).
