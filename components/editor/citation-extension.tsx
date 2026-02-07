import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";

// React component that renders the citation in the editor
function CitationView({ node }: ReactNodeViewProps) {
  const { citationNumber, authorYear, style } = node.attrs as {
    paperId: string;
    citationNumber: number;
    authorYear: string;
    style: "vancouver" | "apa" | "ama" | "chicago";
  };

  // Vancouver and AMA use numeric [1], APA and Chicago use (Author, Year)
  const isNumeric = style === "vancouver" || style === "ama";
  const displayText = isNumeric
    ? `[${citationNumber}]`
    : `(${authorYear})`;

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className="inline-flex cursor-default rounded bg-primary/10 px-1 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        contentEditable={false}
        title={authorYear}
        data-citation-paper-id={(node.attrs as Record<string, string>).paperId}
      >
        {displayText}
      </span>
    </NodeViewWrapper>
  );
}

// The Tiptap extension
export const CitationExtension = Node.create({
  name: "citation",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      paperId: { default: "" },
      citationNumber: { default: 1 },
      authorYear: { default: "" },
      style: { default: "vancouver" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="citation"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "citation" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CitationView);
  },
});
