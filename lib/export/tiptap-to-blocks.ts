import type { CitationStyle } from "@/lib/bibliography";

// ─── Types ───

export type ExportBlockType =
  | "heading"
  | "paragraph"
  | "bulletList"
  | "orderedList"
  | "blockquote";

export interface TextSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ExportBlock {
  type: ExportBlockType;
  level?: number; // For headings: 1, 2, or 3
  spans: TextSpan[];
  children?: ExportBlock[]; // For list items
}

export interface ExportData {
  title: string;
  blocks: ExportBlock[];
  bibliography: string[];
  citationStyle: CitationStyle;
}

// ─── Tiptap JSON types ───

interface TiptapMark {
  type: string;
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
  content?: TiptapNode[];
  text?: string;
}

// ─── Core converter ───

/**
 * Convert inline Tiptap nodes (text, citation) within a parent to TextSpan[].
 */
function convertInlineContent(nodes: TiptapNode[]): TextSpan[] {
  const spans: TextSpan[] = [];

  for (const node of nodes) {
    if (node.type === "text" && node.text) {
      const span: TextSpan = { text: node.text };
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") span.bold = true;
          if (mark.type === "italic") span.italic = true;
          if (mark.type === "underline") span.underline = true;
        }
      }
      spans.push(span);
    } else if (node.type === "citation") {
      const attrs = node.attrs ?? {};
      const style = (attrs.style as string) ?? "vancouver";
      const citationNumber = attrs.citationNumber as number;
      const authorYear = attrs.authorYear as string;
      const isNumeric = style === "vancouver" || style === "ama";
      const displayText = isNumeric
        ? `[${citationNumber}]`
        : `(${authorYear})`;
      spans.push({ text: displayText });
    }
  }

  return spans;
}

/**
 * Convert a single Tiptap block node to an ExportBlock.
 */
function convertNode(node: TiptapNode): ExportBlock | null {
  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const spans = node.content ? convertInlineContent(node.content) : [];
      return { type: "heading", level, spans };
    }

    case "paragraph": {
      const spans = node.content ? convertInlineContent(node.content) : [];
      return { type: "paragraph", spans };
    }

    case "bulletList": {
      const children: ExportBlock[] = [];
      for (const listItem of node.content ?? []) {
        if (listItem.type === "listItem") {
          for (const child of listItem.content ?? []) {
            const block = convertNode(child);
            if (block) children.push(block);
          }
        }
      }
      return { type: "bulletList", spans: [], children };
    }

    case "orderedList": {
      const children: ExportBlock[] = [];
      for (const listItem of node.content ?? []) {
        if (listItem.type === "listItem") {
          for (const child of listItem.content ?? []) {
            const block = convertNode(child);
            if (block) children.push(block);
          }
        }
      }
      return { type: "orderedList", spans: [], children };
    }

    case "blockquote": {
      const children: ExportBlock[] = [];
      for (const child of node.content ?? []) {
        const block = convertNode(child);
        if (block) children.push(block);
      }
      // Flatten blockquote children spans into a single block
      const allSpans: TextSpan[] = [];
      for (const child of children) {
        allSpans.push(...child.spans);
      }
      return { type: "blockquote", spans: allSpans };
    }

    default:
      return null;
  }
}

/**
 * Convert Tiptap editor JSON content to an array of ExportBlocks.
 * This is the shared converter consumed by both DOCX and PDF exporters.
 */
export function tiptapToBlocks(content: Record<string, unknown>): ExportBlock[] {
  const doc = content as unknown as TiptapNode;
  if (!doc.content) return [];

  const blocks: ExportBlock[] = [];
  for (const node of doc.content) {
    const block = convertNode(node);
    if (block) blocks.push(block);
  }

  return blocks;
}
