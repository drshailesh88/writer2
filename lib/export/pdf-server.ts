import { jsPDF } from "jspdf";
import type { ExportData, ExportBlock, TextSpan } from "./tiptap-to-blocks";

const PAGE_WIDTH = 210;
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

function renderSpans(
  doc: jsPDF,
  spans: TextSpan[],
  x: number,
  y: number,
  fontSize: number,
  maxWidth: number
): number {
  const fullText = spans.map((s) => s.text).join("");
  if (!fullText.trim()) {
    return y + fontSize * 0.3528 * LINE_HEIGHT_FACTOR;
  }

  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  const lines: string[] = doc.splitTextToSize(fullText, maxWidth);

  let currentY = y;
  const lineHeight = fontSize * 0.3528 * LINE_HEIGHT_FACTOR;

  for (const line of lines) {
    currentY = checkPageBreak(doc, currentY, lineHeight);

    let currentX = x;
    let remainingLine = line;

    for (const span of spans) {
      if (remainingLine.length === 0) break;
      const spanText = span.text;
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
        span.text = spanText.substring(matchLen);

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
      currentY += 3;
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
      currentY += 2;
      break;
    }

    case "paragraph": {
      if (block.spans.length === 0 || block.spans.every((s) => !s.text.trim())) {
        currentY += FONT_SIZES.body * 0.3528 * LINE_HEIGHT_FACTOR * 0.5;
        break;
      }
      const clonedSpans = block.spans.map((s) => ({ ...s }));
      currentY = renderSpans(
        doc,
        clonedSpans,
        MARGIN_LEFT,
        currentY,
        FONT_SIZES.body,
        CONTENT_WIDTH
      );
      currentY += 1.5;
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

export async function buildPdfBuffer(data: ExportData): Promise<Buffer> {
  const { title, blocks, bibliography, citationStyle } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = MARGIN_TOP;

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
  y += 8;

  for (const block of blocks) {
    y = renderBlock(doc, block, y);
  }

  if (bibliography.length > 0) {
    y += 8;
    y = checkPageBreak(doc, y, 20);

    y = renderText(
      doc,
      "References",
      MARGIN_LEFT,
      y,
      FONT_SIZES.h2,
      "bold",
      CONTENT_WIDTH
    );
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

  const buffer = doc.output("arraybuffer");
  return Buffer.from(buffer);
}
