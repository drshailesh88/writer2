import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
  LevelFormat,
  convertInchesToTwip,
} from "docx";
import type { ExportData, ExportBlock, TextSpan } from "./tiptap-to-blocks";

// ─── Helpers ───

function spansToTextRuns(spans: TextSpan[]): TextRun[] {
  if (spans.length === 0) {
    return [new TextRun({ text: "" })];
  }
  return spans.map(
    (span) =>
      new TextRun({
        text: span.text,
        bold: span.bold,
        italics: span.italic,
        underline: span.underline ? {} : undefined,
      })
  );
}

function headingLevelFromNumber(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    default:
      return HeadingLevel.HEADING_2;
  }
}

// ─── Block → Paragraph conversion ───

function blockToParagraphs(block: ExportBlock): Paragraph[] {
  switch (block.type) {
    case "heading":
      return [
        new Paragraph({
          children: spansToTextRuns(block.spans),
          heading: headingLevelFromNumber(block.level ?? 2),
          spacing: { before: 240, after: 120 },
        }),
      ];

    case "paragraph":
      return [
        new Paragraph({
          children: spansToTextRuns(block.spans),
          spacing: { after: 120 },
        }),
      ];

    case "bulletList": {
      const paragraphs: Paragraph[] = [];
      for (const child of block.children ?? []) {
        paragraphs.push(
          new Paragraph({
            children: spansToTextRuns(child.spans),
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      }
      return paragraphs;
    }

    case "orderedList": {
      const paragraphs: Paragraph[] = [];
      for (const child of block.children ?? []) {
        paragraphs.push(
          new Paragraph({
            children: spansToTextRuns(child.spans),
            numbering: { reference: "ordered-list", level: 0 },
            spacing: { after: 60 },
          })
        );
      }
      return paragraphs;
    }

    case "blockquote":
      return [
        new Paragraph({
          children: spansToTextRuns(
            block.spans.map((s) => ({ ...s, italic: true }))
          ),
          indent: { left: convertInchesToTwip(0.5) },
          spacing: { before: 120, after: 120 },
        }),
      ];

    default:
      return [];
  }
}

// ─── Main export function ───

export async function exportAsDocx(data: ExportData): Promise<void> {
  const { title, blocks, bibliography, citationStyle } = data;

  // Convert all content blocks to docx paragraphs
  const contentParagraphs: Paragraph[] = [];
  for (const block of blocks) {
    contentParagraphs.push(...blockToParagraphs(block));
  }

  // Append bibliography if citations exist
  const biblioParagraphs: Paragraph[] = [];
  if (bibliography.length > 0) {
    // Add spacing before references
    biblioParagraphs.push(new Paragraph({ spacing: { before: 480 } }));

    // References heading
    biblioParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: "References", bold: true })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 200 },
      })
    );

    const isNumbered =
      citationStyle === "vancouver" || citationStyle === "ama";

    for (let i = 0; i < bibliography.length; i++) {
      const entry = bibliography[i];
      if (isNumbered) {
        biblioParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: `${i + 1}. ${entry}` })],
            spacing: { after: 80 },
          })
        );
      } else {
        // APA/Chicago: hanging indent
        biblioParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: entry })],
            indent: {
              left: convertInchesToTwip(0.5),
              hanging: convertInchesToTwip(0.5),
            },
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.5),
                    hanging: convertInchesToTwip(0.25),
                  },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [
          // Document title
          new Paragraph({
            children: [
              new TextRun({ text: title, bold: true, size: 32 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...contentParagraphs,
          ...biblioParagraphs,
        ],
      },
    ],
  });

  // Generate blob and trigger download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title || "document"}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
