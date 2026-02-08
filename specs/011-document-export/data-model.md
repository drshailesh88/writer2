# Data Model: Document Export (DOCX + PDF)

**Feature**: 011-document-export
**Date**: 2026-02-07

## Existing Entities (No Schema Changes Required)

This feature operates entirely on existing data. No new Convex tables or schema modifications are needed.

### Document (existing: `documents` table)
- `content`: Tiptap JSON tree (type `any`) — the source content for export
- `title`: string — used as the export filename
- `citationStyle`: "vancouver" | "apa" | "ama" | "chicago" — determines citation formatting in export

### Citation (existing: `citations` table)
- `documentId`: reference to documents table
- `paperId`: reference to papers table
- `position`: number — citation order in document
- `citationText`: string — display text for inline citation

### Paper (existing: `papers` table)
- Full metadata for bibliography generation: title, authors, journal, year, doi, url, metadata (volume, issue, pages, pmid)

### User (existing: `users` table)
- `subscriptionTier`: "none" | "free" | "basic" | "pro" — determines export access

## New Types (Client-Side Only)

### ExportBlock (intermediate representation)

```typescript
type ExportBlockType = "heading" | "paragraph" | "bulletList" | "orderedList" | "blockquote" | "citation";

interface TextSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

interface ExportBlock {
  type: ExportBlockType;
  level?: number;          // For headings: 1, 2, or 3
  spans: TextSpan[];       // Formatted text content
  children?: ExportBlock[]; // For list items
}
```

### ExportData (input to exporters)

```typescript
interface ExportData {
  title: string;
  blocks: ExportBlock[];
  bibliography: string[];  // Formatted reference strings
  citationStyle: CitationStyle;
}
```

## Subscription Limits Extension

Add `"export"` to the existing `Feature` type in `convex/lib/subscriptionLimits.ts`:

| Tier | Export Limit |
|------|-------------|
| none | 0 (blocked) |
| free | 0 (blocked) |
| basic | -1 (unlimited) |
| pro | -1 (unlimited) |
