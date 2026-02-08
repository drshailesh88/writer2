import { jsPDF } from "jspdf";
import type { ExportData, ExportBlock, TextSpan } from "./tiptap-to-blocks";

// ─── Constants ───

const PAGE_WIDTH = 210; // A4 width in mm
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 25;
const MARGIN_BOTTOM = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const FONT_SIZES = {
  h1: 18,
  h2: 15,
  h3: 13,
  body: 12,
  small: 10,
};

const LINE_HEIGHT_FACTOR = 1.4;

// ─── Helpers ───

function getPageHeight(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

function checkPageBreak(doc: jsPDF, y: number, neededHeight: number): number {
  const maxY = getPageHeight(doc) - MARGIN_BOTTOM;
  if (y + neededHeight > maxY) {
    doc.addPage();
    return MARGIN_TOP;
  }
  return y;
}

/**
 * Render spans with mixed bold/italic formatting.
 * jsPDF doesn't support inline style mixing natively, so we render span by span.
 */
function renderSpans(
  doc: jsPDF,
  spans: TextSpan[],
  x: number,
  y: number,
  fontSize: number,
  maxWidth: number
): number {
  // Concatenate all text for wrapping calculation
  const fullText = spans.map((s) => s.text).join("");
  if (!fullText.trim()) {
    return y + fontSize * 0.3528 * LINE_HEIGHT_FACTOR; // Empty line
  }

  // Use splitTextToSize for the full text to determine line breaks
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  const lines: string[] = doc.splitTextToSize(fullText, maxWidth);

  let currentY = y;
  const lineHeight = fontSize * 0.3528 * LINE_HEIGHT_FACTOR; // pt to mm conversion

  for (const line of lines) {
    currentY = checkPageBreak(doc, currentY, lineHeight);

    // For simplicity with mixed formatting: find which spans cover this line
    // and render with the dominant style. For fully accurate mixed-style rendering,
    // we'd need character-level tracking, but this covers the common case.
    let currentX = x;
    let remainingLine = line;

    for (const span of spans) {
      if (remainingLine.length === 0) break;
      const spanText = span.text;
      // Find how much of this span appears in the remaining line
      let matchLen = 0;
      for (let i = 0; i < spanText.length && i < remainingLine.length; i++) {
        if (spanText[i] === remainingLine[i]) {
          matchLen = i + 1;
        } else {
          break;
        }
      }

      if (matchLen > 0) {
        const segment = remainingLine.substring(0, matchLen);
        remainingLine = remainingLine.substring(matchLen);
        // Strip consumed characters from span for next line
        span.text = spanText.substring(matchLen);

        // Set font style
        let fontStyle = "normal";
        if (span.bold && span.italic) fontStyle = "bolditalic";
        else if (span.bold) fontStyle = "bold";
        else if (span.italic) fontStyle = "italic";

        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fontSize);
        doc.text(segment, currentX, currentY);
        currentX += doc.getTextWidth(segment);
      }
    }

    currentY += lineHeight;
  }

  return currentY;
}

/**
 * Render a simple text line (no mixed formatting).
 */
function renderText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontStyle: string,
  maxWidth: number
): number {
  if (!text.trim()) {
    return y + fontSize * 0.3528 * LINE_HEIGHT_FACTOR;
  }

  doc.setFontSize(fontSize);
  doc.setFont("helvetica", fontStyle);
  const lines: string[] = doc.splitTextToSize(text, maxWidth);
  const lineHeight = fontSize * 0.3528 * LINE_HEIGHT_FACTOR;

  let currentY = y;
  for (const line of lines) {
    currentY = checkPageBreak(doc, currentY, lineHeight);
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

// ─── Block rendering ───

function renderBlock(doc: jsPDF, block: ExportBlock, y: number): number {
  let currentY = y;

  switch (block.type) {
    case "heading": {
      const level = block.level ?? 2;
      const fontSize =
        level === 1
          ? FONT_SIZES.h1
          : level === 2
            ? FONT_SIZES.h2
            : FONT_SIZES.h3;
      currentY += 3; // spacing before heading
      const text = block.spans.map((s) => s.text).join("");
      currentY = renderText(
        doc,
        text,
        MARGIN_LEFT,
        currentY,
        fontSize,
        "bold",
        CONTENT_WIDTH
      );
      currentY += 2; // spacing after heading
      break;
    }

    case "paragraph": {
      if (block.spans.length === 0 || block.spans.every((s) => !s.text.trim())) {
        currentY += FONT_SIZES.body * 0.3528 * LINE_HEIGHT_FACTOR * 0.5;
        break;
      }
      // Clone spans so rendering doesn't mutate originals
      const clonedSpans = block.spans.map((s) => ({ ...s }));
      currentY = renderSpans(
        doc,
        clonedSpans,
        MARGIN_LEFT,
        currentY,
        FONT_SIZES.body,
        CONTENT_WIDTH
      );
      currentY += 1.5; // paragraph spacing
      break;
    }

    case "bulletList": {
      for (const child of block.children ?? []) {
        const text = child.spans.map((s) => s.text).join("");
        currentY = renderText(
          doc,
          `\u2022  ${text}`,
          MARGIN_LEFT + 5,
          currentY,
          FONT_SIZES.body,
          "normal",
          CONTENT_WIDTH - 5
        );
        currentY += 0.5;
      }
      currentY += 1;
      break;
    }

    case "orderedList": {
      let num = 1;
      for (const child of block.children ?? []) {
        const text = child.spans.map((s) => s.text).join("");
        currentY = renderText(
          doc,
          `${num}. ${text}`,
          MARGIN_LEFT + 5,
          currentY,
          FONT_SIZES.body,
          "normal",
          CONTENT_WIDTH - 5
        );
        currentY += 0.5;
        num++;
      }
      currentY += 1;
      break;
    }

    case "blockquote": {
      const text = block.spans.map((s) => s.text).join("");
      currentY = renderText(
        doc,
        text,
        MARGIN_LEFT + 10,
        currentY,
        FONT_SIZES.body,
        "italic",
        CONTENT_WIDTH - 10
      );
      currentY += 2;
      break;
    }
  }

  return currentY;
}

// ─── Main export function ───

export async function exportAsPdf(data: ExportData): Promise<void> {
  const { title, blocks, bibliography, citationStyle } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = MARGIN_TOP;

  // Document title — centered, bold, larger font
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const titleLines: string[] = doc.splitTextToSize(title, CONTENT_WIDTH);
  const titleLineHeight = 20 * 0.3528 * LINE_HEIGHT_FACTOR;
  for (const line of titleLines) {
    const textWidth = doc.getTextWidth(line);
    const xCenter = (PAGE_WIDTH - textWidth) / 2;
    doc.text(line, xCenter, y);
    y += titleLineHeight;
  }
  y += 8; // spacing after title

  // Render content blocks
  for (const block of blocks) {
    y = renderBlock(doc, block, y);
  }

  // Append bibliography if citations exist
  if (bibliography.length > 0) {
    y += 8; // spacing before references
    y = checkPageBreak(doc, y, 20);

    // References heading
    y = renderText(doc, "References", MARGIN_LEFT, y, FONT_SIZES.h2, "bold", CONTENT_WIDTH);
    y += 3;

    const isNumbered = citationStyle === "vancouver" || citationStyle === "ama";

    for (let i = 0; i < bibliography.length; i++) {
      const entry = bibliography[i];
      const text = isNumbered ? `${i + 1}. ${entry}` : entry;
      const indent = isNumbered ? 0 : 5;
      y = renderText(
        doc,
        text,
        MARGIN_LEFT + indent,
        y,
        FONT_SIZES.small,
        "normal",
        CONTENT_WIDTH - indent
      );
      y += 1;
    }
  }

  // Trigger download
  doc.save(`${title || "document"}.pdf`);
}
