import { describe, it, expect } from "vitest";
import { tiptapToBlocks } from "@/lib/export/tiptap-to-blocks";
import type { ExportBlock } from "@/lib/export/tiptap-to-blocks";

function makeDoc(...nodes: Record<string, unknown>[]) {
  return { type: "doc", content: nodes };
}

function makeHeading(level: number, text: string) {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function makeParagraph(...inlines: Record<string, unknown>[]) {
  return { type: "paragraph", content: inlines };
}

function makeText(text: string, marks?: string[]) {
  return {
    type: "text",
    text,
    marks: marks?.map((m) => ({ type: m })),
  };
}

function makeBulletList(...items: string[]) {
  return {
    type: "bulletList",
    content: items.map((text) => ({
      type: "listItem",
      content: [makeParagraph(makeText(text))],
    })),
  };
}

function makeOrderedList(...items: string[]) {
  return {
    type: "orderedList",
    content: items.map((text) => ({
      type: "listItem",
      content: [makeParagraph(makeText(text))],
    })),
  };
}

function makeBlockquote(...inlines: Record<string, unknown>[]) {
  return {
    type: "blockquote",
    content: [makeParagraph(...inlines)],
  };
}

function makeCitation(style: string, citationNumber: number, authorYear?: string) {
  return {
    type: "citation",
    attrs: { style, citationNumber, authorYear },
  };
}

describe("tiptapToBlocks", () => {
  it("returns empty array for empty document", () => {
    expect(tiptapToBlocks({ type: "doc" })).toEqual([]);
    expect(tiptapToBlocks({ type: "doc", content: [] })).toEqual([]);
  });

  // ─── Headings ───

  it("converts heading level 1", () => {
    const blocks = tiptapToBlocks(makeDoc(makeHeading(1, "Introduction")));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("heading");
    expect(blocks[0].level).toBe(1);
    expect(blocks[0].spans[0].text).toBe("Introduction");
  });

  it("converts heading level 2", () => {
    const blocks = tiptapToBlocks(makeDoc(makeHeading(2, "Methods")));
    expect(blocks[0].level).toBe(2);
  });

  it("converts heading level 3", () => {
    const blocks = tiptapToBlocks(makeDoc(makeHeading(3, "Sub-section")));
    expect(blocks[0].level).toBe(3);
  });

  it("defaults heading level to 2 when not specified", () => {
    const doc = makeDoc({
      type: "heading",
      content: [{ type: "text", text: "No Level" }],
    });
    const blocks = tiptapToBlocks(doc);
    expect(blocks[0].level).toBe(2);
  });

  // ─── Paragraphs ───

  it("converts plain paragraph", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeParagraph(makeText("Hello world.")))
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].spans[0].text).toBe("Hello world.");
  });

  it("converts empty paragraph (no content)", () => {
    const blocks = tiptapToBlocks(makeDoc({ type: "paragraph" }));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].spans).toEqual([]);
  });

  // ─── Text marks ───

  it("converts bold text", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeParagraph(makeText("bold text", ["bold"])))
    );
    expect(blocks[0].spans[0]).toEqual({ text: "bold text", bold: true });
  });

  it("converts italic text", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeParagraph(makeText("italic text", ["italic"])))
    );
    expect(blocks[0].spans[0]).toEqual({ text: "italic text", italic: true });
  });

  it("converts underline text", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeParagraph(makeText("underline text", ["underline"])))
    );
    expect(blocks[0].spans[0]).toEqual({
      text: "underline text",
      underline: true,
    });
  });

  it("converts text with multiple marks", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeParagraph(makeText("all marks", ["bold", "italic", "underline"])))
    );
    expect(blocks[0].spans[0]).toEqual({
      text: "all marks",
      bold: true,
      italic: true,
      underline: true,
    });
  });

  it("handles mixed formatted and plain spans in same paragraph", () => {
    const blocks = tiptapToBlocks(
      makeDoc(
        makeParagraph(
          makeText("normal "),
          makeText("bold", ["bold"]),
          makeText(" normal again")
        )
      )
    );
    expect(blocks[0].spans).toHaveLength(3);
    expect(blocks[0].spans[0].bold).toBeUndefined();
    expect(blocks[0].spans[1].bold).toBe(true);
    expect(blocks[0].spans[2].bold).toBeUndefined();
  });

  // ─── Citations ───

  it("converts vancouver citation to [number]", () => {
    const blocks = tiptapToBlocks(
      makeDoc(
        makeParagraph(
          makeText("Evidence shows "),
          makeCitation("vancouver", 3)
        )
      )
    );
    expect(blocks[0].spans).toHaveLength(2);
    expect(blocks[0].spans[1].text).toBe("[3]");
  });

  it("converts AMA citation to [number]", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeParagraph(makeCitation("ama", 5)))
    );
    expect(blocks[0].spans[0].text).toBe("[5]");
  });

  it("converts APA citation to (authorYear)", () => {
    const blocks = tiptapToBlocks(
      makeDoc(
        makeParagraph(makeCitation("apa", 1, "Smith, 2020"))
      )
    );
    expect(blocks[0].spans[0].text).toBe("(Smith, 2020)");
  });

  it("converts Chicago citation to (authorYear)", () => {
    const blocks = tiptapToBlocks(
      makeDoc(
        makeParagraph(makeCitation("chicago", 1, "Doe et al., 2019"))
      )
    );
    expect(blocks[0].spans[0].text).toBe("(Doe et al., 2019)");
  });

  // ─── Lists ───

  it("converts bullet list", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeBulletList("Item one", "Item two", "Item three"))
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("bulletList");
    expect(blocks[0].children).toHaveLength(3);
    expect(blocks[0].children![0].spans[0].text).toBe("Item one");
    expect(blocks[0].children![2].spans[0].text).toBe("Item three");
  });

  it("converts ordered list", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeOrderedList("First", "Second"))
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("orderedList");
    expect(blocks[0].children).toHaveLength(2);
    expect(blocks[0].children![0].spans[0].text).toBe("First");
    expect(blocks[0].children![1].spans[0].text).toBe("Second");
  });

  it("handles empty bullet list", () => {
    const blocks = tiptapToBlocks(
      makeDoc({ type: "bulletList", content: [] })
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].children).toEqual([]);
  });

  // ─── Blockquote ───

  it("converts blockquote", () => {
    const blocks = tiptapToBlocks(
      makeDoc(makeBlockquote(makeText("Quoted text here.")))
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("blockquote");
    expect(blocks[0].spans[0].text).toBe("Quoted text here.");
  });

  // ─── Unknown/unsupported nodes ───

  it("skips unknown node types", () => {
    const doc = makeDoc(
      makeParagraph(makeText("keep")),
      { type: "horizontalRule" },
      { type: "codeBlock", content: [{ type: "text", text: "code" }] },
      makeParagraph(makeText("also keep"))
    );
    const blocks = tiptapToBlocks(doc);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].spans[0].text).toBe("keep");
    expect(blocks[1].spans[0].text).toBe("also keep");
  });

  // ─── Full document ───

  it("converts a full IMRAD document structure", () => {
    const doc = makeDoc(
      makeHeading(1, "Title of Paper"),
      makeParagraph(makeText("Abstract text here.")),
      makeHeading(2, "Introduction"),
      makeParagraph(
        makeText("Research shows "),
        makeCitation("vancouver", 1),
        makeText(" that...")
      ),
      makeHeading(2, "Methods"),
      makeBulletList("Step 1", "Step 2"),
      makeHeading(2, "Results"),
      makeParagraph(makeText("p < 0.05", ["italic"])),
      makeHeading(2, "Discussion"),
      makeBlockquote(makeText("Important finding.")),
      makeHeading(2, "References")
    );

    const blocks = tiptapToBlocks(doc);
    expect(blocks.length).toBeGreaterThanOrEqual(9);

    const headings = blocks.filter((b: ExportBlock) => b.type === "heading");
    expect(headings).toHaveLength(6); // Title + Intro + Methods + Results + Discussion + References

    const lists = blocks.filter((b: ExportBlock) => b.type === "bulletList");
    expect(lists).toHaveLength(1);

    const quotes = blocks.filter((b: ExportBlock) => b.type === "blockquote");
    expect(quotes).toHaveLength(1);
  });
});
