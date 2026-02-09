# Feature Specification: Document Export (DOCX + PDF)

**Feature Branch**: `011-document-export`
**Created**: 2026-02-07
**Status**: Draft
**Input**: User description: "Add DOCX and PDF export to the writing editor. PRD Section 4.10."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export Document as DOCX (Priority: P1)

A medical student has finished writing their thesis in the editor. They need to download it as a Word document (.docx) for university thesis submission. They click the Export button in the toolbar, select "Export as DOCX", and receive a downloaded file containing their complete document with formatting, inline citations, and a bibliography section appended at the end.

**Why this priority**: DOCX is the primary format for university thesis submission — the core use case for V1 Drafts' target user (3rd-year MD student).

**Independent Test**: Can be tested by opening any document in the editor, clicking Export > DOCX, and verifying the downloaded file opens correctly in Microsoft Word with formatting preserved.

**Acceptance Scenarios**:

1. **Given** a user with Basic/Pro subscription has a document with content and citations, **When** they click "Export as DOCX", **Then** a .docx file downloads containing the full document with headings, bold/italic/underline formatting, lists, blockquotes, inline citations, and a "References" section at the end.
2. **Given** a user with Basic/Pro subscription has a document with no citations, **When** they click "Export as DOCX", **Then** a .docx file downloads containing the document content without a references section.
3. **Given** the export process is in progress, **When** the user waits, **Then** a loading indicator is shown on the export button until the download starts.

---

### User Story 2 - Export Document as PDF (Priority: P1)

A researcher needs to submit their paper to a journal as a PDF. They click the Export button, select "Export as PDF", and receive a formatted PDF document with their content, citations, and bibliography.

**Why this priority**: PDF is the primary format for journal submission — equally critical to the DOCX export for the target user.

**Independent Test**: Can be tested by opening any document in the editor, clicking Export > PDF, and verifying the downloaded PDF renders correctly with formatting and bibliography.

**Acceptance Scenarios**:

1. **Given** a user with Basic/Pro subscription has a document with content and citations, **When** they click "Export as PDF", **Then** a .pdf file downloads containing the full document with formatting, citations, and references.
2. **Given** a document has multiple pages of content, **When** exported as PDF, **Then** the PDF handles page breaks correctly with proper margins and line spacing.

---

### User Story 3 - Subscription Gating for Export (Priority: P2)

A free-tier user attempts to export their document. Instead of downloading, they see an upgrade modal explaining that export is available on Basic and Pro plans, with a clear call-to-action to upgrade.

**Why this priority**: Subscription gating is essential for the business model but is secondary to the core export functionality itself.

**Independent Test**: Can be tested by logging in as a free-tier user, attempting export, and verifying the upgrade modal appears instead of a download.

**Acceptance Scenarios**:

1. **Given** a user on the Free plan, **When** they click "Export as DOCX" or "Export as PDF", **Then** an upgrade modal appears explaining export requires a paid plan.
2. **Given** a user on the Basic plan, **When** they click export, **Then** the document downloads without any restriction.
3. **Given** a user on the Pro plan, **When** they click export, **Then** the document downloads without any restriction.

---

### User Story 4 - Citation Style Respected in Export (Priority: P2)

A user has selected APA as their citation style in the editor. When they export, the inline citations and bibliography in the exported document are formatted in APA style, matching what they see in the editor.

**Why this priority**: Correct citation formatting is critical for academic submissions but depends on the core export pipeline working first.

**Independent Test**: Can be tested by setting different citation styles (Vancouver, APA, AMA, Chicago) and verifying each export reflects the selected style.

**Acceptance Scenarios**:

1. **Given** a document using Vancouver style, **When** exported, **Then** inline citations appear as [1], [2] etc. and the bibliography uses numbered Vancouver format.
2. **Given** a document using APA style, **When** exported, **Then** inline citations appear as (Author, Year) and the bibliography uses APA format.

---

### Edge Cases

- What happens when the document has no content (empty editor)? The system should show a brief message that there is nothing to export.
- What happens when the document has citations but the cited papers have incomplete metadata (missing journal, year, etc.)? The export should still succeed, with available fields formatted and missing fields omitted gracefully.
- What happens if the browser blocks the download (popup blocker)? The system should use standard browser download mechanisms (blob URL + anchor click) that are not affected by popup blockers.
- What happens when the document contains very long content (50+ pages)? The export should handle large documents without crashing, though performance may be slower.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an Export dropdown button in the editor toolbar, positioned after the AI Detection section.
- **FR-002**: The Export dropdown MUST offer exactly two options: "Export as DOCX" and "Export as PDF".
- **FR-003**: DOCX export MUST preserve document formatting: headings (H1-H3), bold, italic, underline, bullet lists, ordered lists, and blockquotes.
- **FR-004**: PDF export MUST preserve document formatting: headings (H1-H3), bold, italic, underline, bullet lists, ordered lists, and blockquotes.
- **FR-005**: Both export formats MUST include inline citations formatted per the document's selected citation style (Vancouver, APA, AMA, or Chicago).
- **FR-006**: Both export formats MUST append a "References" section at the end of the document containing the formatted bibliography.
- **FR-007**: Free-tier users MUST be blocked from exporting, with an upgrade modal displayed instead.
- **FR-008**: Basic and Pro tier users MUST have unlimited export access (no monthly cap).
- **FR-009**: The exported DOCX file MUST be a valid .docx file that opens in Microsoft Word and Google Docs.
- **FR-010**: The exported PDF file MUST be a valid .pdf file that opens in standard PDF readers.
- **FR-011**: A loading indicator MUST be shown while the export is being generated.
- **FR-012**: The export button and dropdown MUST be accessible via keyboard navigation and include appropriate ARIA labels.
- **FR-013**: The export button MUST be responsive and maintain a minimum 44px touch target on mobile viewports.

### Key Entities

- **Document**: The Tiptap editor content stored as JSON, with a title, content tree, citation style, and associated citations.
- **Citation**: An inline reference in the document body that links to a paper in the user's library, with a position number and display text.
- **Bibliography Entry**: A formatted reference string generated from paper metadata in the selected citation style.
- **Exported File**: The output file (DOCX or PDF) containing the rendered document, inline citations, and appended references section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can export a document as DOCX within 5 seconds for documents up to 10,000 words.
- **SC-002**: Users can export a document as PDF within 5 seconds for documents up to 10,000 words.
- **SC-003**: Exported DOCX files open correctly in Microsoft Word with formatting preserved.
- **SC-004**: Exported PDF files render correctly in standard PDF readers with proper page layout.
- **SC-005**: Free-tier users see an upgrade prompt 100% of the time when attempting export.
- **SC-006**: Inline citations and bibliography in exported files match the selected citation style.
- **SC-007**: Export dropdown is fully accessible via keyboard and screen readers.
- **SC-008**: Export button meets 44px minimum touch target on mobile (375px viewport).

## Assumptions

- The Tiptap editor stores content as a JSON tree with standard node types (doc, heading, paragraph, bulletList, orderedList, blockquote, text with marks).
- Citation nodes in the Tiptap JSON contain a paper ID and citation number that can be used to look up paper metadata.
- The existing bibliography generation functions (`generateBibliography`, `convertPaperToCSL`) from `lib/bibliography.ts` correctly format references in all four citation styles.
- The existing subscription limits system can be extended to gate export without a separate usage counter (export is unlimited for paid users, blocked for free users — a simple tier check, not a usage counter).
- All export processing happens client-side in the browser (no server-side rendering needed).

## Scope Boundaries

**In scope**: DOCX export, PDF export, subscription gating, citation style formatting, bibliography generation, toolbar UI.

**Out of scope**: LaTeX export (V2), collaborative export, export templates/themes, export history tracking, server-side rendering of exports.
