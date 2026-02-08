# Tasks: Document Export (DOCX + PDF)

**Input**: Design documents from `/specs/011-document-export/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Playwright E2E tests required per Constitution Article 7.1 and spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies and create shared infrastructure

- [x] T001 Install `docx` and `jspdf` npm packages: `npm install docx jspdf`
- [x] T002 Create shared export types and Tiptap JSON → ExportBlock[] converter in `lib/export/tiptap-to-blocks.ts`. Define `ExportBlockType`, `TextSpan`, `ExportBlock`, and `ExportData` types. Implement `tiptapToBlocks(content)` that walks the Tiptap JSON tree and maps: `doc` → walk children, `heading` → HeadingBlock with `attrs.level`, `paragraph` → ParagraphBlock, `bulletList`/`orderedList` → ListBlock with `listItem` children, `blockquote` → QuoteBlock, `text` → TextSpan with `bold`/`italic`/`underline` marks, `citation` → TextSpan using `citationNumber`/`authorYear`/`style` attrs (Vancouver/AMA → `[N]`, APA/Chicago → `(authorYear)`). Export `ExportData` interface with `title`, `blocks`, `bibliography`, `citationStyle`.

**Checkpoint**: Shared converter ready — DOCX and PDF exporters can now be built in parallel

---

## Phase 2: Foundational (Subscription Gating)

**Purpose**: Extend existing subscription system for export gating — MUST complete before UI work

- [x] T003 Add `"export"` to the `Feature` union type in `convex/lib/subscriptionLimits.ts`. Add export limits to `SUBSCRIPTION_LIMITS` constant: `none: 0`, `free: 0`, `basic: -1`, `pro: -1`. No other changes needed — `checkUsageLimit()` already handles `0` (blocked) and `-1` (unlimited).
- [x] T004 Extend `UpgradeModal` in `components/modals/upgrade-modal.tsx`: add `"export"` to the `feature` prop union type, add `"export": "Document Export"` to `FEATURE_LABELS`, add export limits to `TIER_LIMITS` (free: `"N/A"`, basic: `"Unlimited"`, pro: `"Unlimited"`). Update the modal body text to say "Export is available on Basic and Pro plans" when feature is "export".

**Checkpoint**: Subscription gating ready — export UI can check tier and show upgrade modal

---

## Phase 3: User Story 1 — Export Document as DOCX (Priority: P1) MVP

**Goal**: User with Basic/Pro subscription can export their document as a .docx file with formatting, inline citations, and bibliography.

**Independent Test**: Open editor with a document that has content and citations → click Export → DOCX → verify downloaded .docx opens in Word with formatting + citations + bibliography.

### Implementation for User Story 1

- [x] T005 [US1] Create DOCX exporter in `lib/export/docx-exporter.ts`. Import `Document`, `Paragraph`, `TextRun`, `HeadingLevel`, `AlignmentType`, `Packer`, `NumberFormat` from `docx`. Implement `exportAsDocx(data: ExportData): Promise<void>` that: (1) Maps `ExportBlock[]` to docx elements — `heading` → `Paragraph` with `HeadingLevel.HEADING_1/2/3`, `paragraph` → `Paragraph` with `TextRun` children (bold/italic/underline mapped to `TextRun` options), `bulletList`/`orderedList` → `Paragraph` with `bullet`/`numbering` references, `blockquote` → `Paragraph` with indent and italic, (2) Appends a "References" heading + bibliography entries as numbered/hanging-indent paragraphs, (3) Creates `Document` with sections, (4) Calls `Packer.toBlob()` and triggers download via blob URL + anchor click pattern (reuse download pattern from `bibliography-section.tsx`). Filename: `{title}.docx`.
- [x] T006 [US1] Add Export dropdown to `components/editor/editor-toolbar.tsx`. Import `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from shadcn/ui and `FileDown`, `FileText`, `File` from lucide-react. Add new props: `onExportDocx?: () => void`, `onExportPdf?: () => void`, `isExportLoading?: boolean`. After the AI Detection section (after the closing `</>` of the plagiarism/AI detection block), add a new separator + DropdownMenu with trigger button showing `FileDown` icon + "Export" text, and two menu items: "Export as DOCX" (calls `onExportDocx`) and "Export as PDF" (calls `onExportPdf`). Show `Loader2` spinner when `isExportLoading` is true. Use `min-h-[44px]` for mobile touch targets. Use ui-designer agent for the visual design.
- [x] T007 [US1] Wire DOCX export in `components/editor/tiptap-editor.tsx`. Add new props to `TiptapEditorProps`: `onExportDocx?: () => void`, `onExportPdf?: () => void`, `isExportLoading?: boolean`. Pass them through to `EditorToolbar`.
- [x] T008 [US1] Wire DOCX export handler in `app/(protected)/editor/[id]/page.tsx`. Import `tiptapToBlocks` from `lib/export/tiptap-to-blocks`, `exportAsDocx` from `lib/export/docx-exporter`, `generateBibliography` from `lib/bibliography`, and `useQuery(api.users.getCurrent)` for tier check. Add `isExportLoading` state. Create `handleExportDocx` callback that: (1) Gets user tier from Convex user query, (2) If free/none tier → set upgrade modal with feature "export" and return, (3) If no content → show toast/alert "Nothing to export" and return, (4) Set loading, (5) Get document content JSON from editor, (6) Convert to blocks via `tiptapToBlocks`, (7) Get bibliography from citations + papers via existing `generateBibliography` (reuse paper extraction pattern from `bibliography-section.tsx`), (8) Call `exportAsDocx({ title, blocks, bibliography, citationStyle })`, (9) Clear loading. Pass `onExportDocx={handleExportDocx}` and `isExportLoading` to `TiptapEditor`. Update `upgradeModal` state type to include `"export"`.

**Checkpoint**: DOCX export fully functional for paid users. Can test independently.

---

## Phase 4: User Story 2 — Export Document as PDF (Priority: P1)

**Goal**: User with Basic/Pro subscription can export their document as a .pdf file with formatting, inline citations, and bibliography.

**Independent Test**: Open editor with a document → click Export → PDF → verify downloaded .pdf opens correctly with formatting + citations + bibliography.

### Implementation for User Story 2

- [x] T009 [US2] Create PDF exporter in `lib/export/pdf-exporter.ts`. Import `jsPDF` from `jspdf`. Implement `exportAsPdf(data: ExportData): Promise<void>` that: (1) Creates new `jsPDF` instance (A4, portrait, mm units), (2) Sets margins (20mm left/right, 25mm top, 20mm bottom), (3) Walks `ExportBlock[]` — `heading` → set font size (H1=18pt, H2=15pt, H3=13pt) + bold, `paragraph` → 12pt normal with TextSpan styling (bold/italic), `bulletList` → indented paragraphs with bullet character, `orderedList` → indented paragraphs with numbers, `blockquote` → indented + italic, (4) Handles page breaks: check remaining page height before each block, call `addPage()` when needed, (5) Appends "References" heading + bibliography entries, (6) Triggers download via `doc.save('{title}.pdf')`. Handle text wrapping with `splitTextToSize()`.
- [x] T010 [US2] Wire PDF export handler in `app/(protected)/editor/[id]/page.tsx`. Create `handleExportPdf` callback following same pattern as `handleExportDocx` (tier check → content check → convert blocks → generate bibliography → call `exportAsPdf`). Pass `onExportPdf={handleExportPdf}` to `TiptapEditor`.

**Checkpoint**: Both DOCX and PDF export working for paid users.

---

## Phase 5: User Story 3 — Subscription Gating for Export (Priority: P2)

**Goal**: Free-tier users see an upgrade modal when attempting export; Basic/Pro users export without restriction.

**Independent Test**: Log in as free-tier user → attempt export → verify upgrade modal appears with "Document Export" as feature name and correct tier comparison.

### Implementation for User Story 3

- [x] T011 [US3] Verify and polish export gating in `app/(protected)/editor/[id]/page.tsx`. Ensure the upgrade modal state correctly passes `feature: "export"`, `currentUsage: 0`, `limit: 0`, and `tier` from user query. Test that Basic/Pro users bypass the modal entirely. Ensure the empty-content edge case shows a brief alert/toast ("Nothing to export") instead of triggering export with empty data.

**Checkpoint**: Subscription gating working — free users blocked, paid users unrestricted.

---

## Phase 6: User Story 4 — Citation Style Respected in Export (Priority: P2)

**Goal**: Exported documents format inline citations and bibliography per the document's selected citation style (Vancouver, APA, AMA, Chicago).

**Independent Test**: Set citation style to APA → export DOCX → verify inline citations show "(Author, Year)" and bibliography uses APA format. Switch to Vancouver → export → verify "[1]" format.

### Implementation for User Story 4

- [x] T012 [US4] Verify citation style handling in `lib/export/tiptap-to-blocks.ts`. Ensure the converter reads `citation` node attrs (`style`, `citationNumber`, `authorYear`) and produces the correct TextSpan text: Vancouver/AMA → `[N]`, APA/Chicago → `(authorYear)`. Test with all four styles.
- [x] T013 [US4] Verify bibliography formatting in both exporters. The `generateBibliography(papers, citationStyle)` call in the export handler already produces style-specific output. Ensure the DOCX exporter formats numbered references (Vancouver/AMA) vs hanging-indent references (APA/Chicago) correctly. Ensure the PDF exporter renders the same distinction.

**Checkpoint**: All four citation styles produce correct output in both DOCX and PDF exports.

---

## Phase 7: Playwright E2E Tests

**Purpose**: Playwright tests required per Constitution Article 7.1

- [x] T014 Create Playwright E2E tests in `tests/e2e/export.spec.ts`. Write test suites: (1) **Unauthenticated**: verify redirect to sign-in when accessing editor. (2) **Authenticated (skip-gated)**: verify export dropdown is visible in toolbar with "Export" label and FileDown icon; verify dropdown contains "Export as DOCX" and "Export as PDF" menu items; verify export dropdown is keyboard-accessible; verify export button has minimum 44px touch target on 375px viewport. (3) **Export flow (skip-gated)**: verify clicking "Export as DOCX" triggers a file download with `.docx` extension; verify clicking "Export as PDF" triggers a file download with `.pdf` extension. (4) **Subscription gating (skip-gated)**: verify free-tier user sees upgrade modal when clicking export; verify upgrade modal shows "Document Export" as feature name. Follow existing test patterns from `tests/e2e/editor.spec.ts` — use `test.describe.skip` for authenticated tests that require Clerk testing tokens.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T015 Run `npm run build` to verify zero TypeScript errors with all new code
- [x] T016 Run `npx playwright test tests/e2e/export.spec.ts` and fix any failures
- [x] T017 Run full test suite `npx playwright test` to verify no regressions in existing tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001 must complete for imports)
- **Phase 3 (US1 DOCX)**: Depends on Phase 1 (T002 converter) + Phase 2 (T003/T004 gating)
- **Phase 4 (US2 PDF)**: Depends on Phase 1 (T002 converter) + Phase 2 (T003/T004 gating). Can run in parallel with Phase 3.
- **Phase 5 (US3 Gating)**: Depends on Phase 2 + Phase 3 or 4 (needs export handlers wired)
- **Phase 6 (US4 Citations)**: Depends on Phase 3 + Phase 4 (needs both exporters)
- **Phase 7 (Tests)**: Depends on Phase 3-6 (needs all functionality)
- **Phase 8 (Polish)**: Depends on Phase 7

### User Story Dependencies

- **US1 (DOCX export)**: Depends on setup only — MVP story
- **US2 (PDF export)**: Independent of US1 — can be built in parallel (different file: `pdf-exporter.ts`)
- **US3 (Subscription gating)**: Depends on US1 or US2 being wired (needs export handlers in editor page)
- **US4 (Citation styles)**: Depends on US1 + US2 (verifies both exporters handle all styles)

### Parallel Opportunities

- **T005 and T009**: DOCX and PDF exporters can be built in parallel (different files, same input interface)
- **T003 and T004**: Subscription limits and upgrade modal can be updated in parallel (different files)
- **T012 and T013**: Citation style verification for converter and exporters can be checked in parallel

---

## Parallel Example: Phase 3 + Phase 4

```bash
# After Phase 2 completes, these can run in parallel:
Task T005: "Create DOCX exporter in lib/export/docx-exporter.ts"
Task T009: "Create PDF exporter in lib/export/pdf-exporter.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Install deps + build shared converter
2. Complete Phase 2: Extend subscription limits + upgrade modal
3. Complete Phase 3: DOCX exporter + toolbar UI + editor wiring
4. **STOP and VALIDATE**: Test DOCX export independently
5. Commit: `feat: add DOCX export to editor (task 11 phase 3)`

### Incremental Delivery

1. Phase 1 + 2 → Infrastructure ready
2. Add US1 (DOCX) → Test → Commit (MVP!)
3. Add US2 (PDF) → Test → Commit
4. Add US3 (Gating) → Test → Commit
5. Add US4 (Citations) → Test → Commit
6. E2E tests → Build check → Final commit

---

## Notes

- All export processing is client-side — no API routes needed
- Reuse download pattern from `components/editor/bibliography-section.tsx` (blob URL + anchor click)
- Reuse paper extraction pattern from `components/editor/bibliography-section.tsx` for bibliography generation
- Reuse `generateBibliography()` from `lib/bibliography.ts` — already handles all 4 citation styles
- Reuse `checkUsageLimit()` from `convex/lib/subscriptionLimits.ts` — just extend the Feature type
- UI design for export dropdown MUST use ui-designer agent per Constitution Article 9.5
- Commit after each completed phase: format `feat: description (task 11)`
