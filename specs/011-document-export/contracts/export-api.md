# Export API Contracts

**Feature**: 011-document-export
**Date**: 2026-02-07

## No Server-Side API Required

Document export is entirely client-side. No API routes, no server endpoints.

## Client-Side Function Contracts

### tiptapToBlocks(content: TiptapJSON): ExportBlock[]

Converts Tiptap JSON tree into intermediate ExportBlock array.

**Input**: Tiptap editor JSON (ProseMirror document schema)
**Output**: Array of ExportBlock objects

**Node type mapping**:
| Tiptap Node | ExportBlock Type | Notes |
|-------------|-----------------|-------|
| `doc` | (container) | Walk children only |
| `heading` | `heading` | `attrs.level` → 1, 2, or 3 |
| `paragraph` | `paragraph` | Walk text content |
| `bulletList` | `bulletList` | Walk `listItem` children |
| `orderedList` | `orderedList` | Walk `listItem` children |
| `blockquote` | `blockquote` | Walk paragraph children |
| `citation` | (inline) | Rendered as TextSpan within parent paragraph |
| `text` | (inline) | Converted to TextSpan with mark processing |

**Mark mapping**:
| Tiptap Mark | TextSpan Property |
|-------------|------------------|
| `bold` | `bold: true` |
| `italic` | `italic: true` |
| `underline` | `underline: true` |

### exportAsDocx(data: ExportData): Promise<void>

Generates and triggers download of a .docx file.

**Input**: ExportData (title, blocks, bibliography, citationStyle)
**Output**: Browser download of `{title}.docx`

### exportAsPdf(data: ExportData): Promise<void>

Generates and triggers download of a .pdf file.

**Input**: ExportData (title, blocks, bibliography, citationStyle)
**Output**: Browser download of `{title}.pdf`

### canExport(tier: SubscriptionTier): boolean

Simple tier check — returns true for basic/pro, false for none/free.

**Input**: User's subscription tier
**Output**: boolean
