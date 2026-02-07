import { Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("citationRenumber"),
        appendTransaction(transactions, _oldState, newState) {
          // Only run when the document actually changed
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          // Collect all citation nodes and their positions
          const citations: { pos: number; paperId: string; currentNumber: number }[] = [];
          newState.doc.descendants((node, pos) => {
            if (node.type.name === "citation") {
              citations.push({
                pos,
                paperId: node.attrs.paperId,
                currentNumber: node.attrs.citationNumber,
              });
            }
          });

          // Build unique paper order (first appearance = citation 1, etc.)
          const paperOrder: string[] = [];
          for (const c of citations) {
            if (!paperOrder.includes(c.paperId)) {
              paperOrder.push(c.paperId);
            }
          }

          // Check if any numbering is wrong
          let needsRenumber = false;
          for (const c of citations) {
            const expectedNumber = paperOrder.indexOf(c.paperId) + 1;
            if (c.currentNumber !== expectedNumber) {
              needsRenumber = true;
              break;
            }
          }

          if (!needsRenumber) return null;

          // Create transaction to fix numbering
          const tr = newState.tr;
          for (const c of citations) {
            const expectedNumber = paperOrder.indexOf(c.paperId) + 1;
            if (c.currentNumber !== expectedNumber) {
              const node = newState.doc.nodeAt(c.pos);
              if (node) {
                tr.setNodeMarkup(c.pos, undefined, {
                  ...node.attrs,
                  citationNumber: expectedNumber,
                });
              }
            }
          }

          return tr;
        },
      }),
    ];
  },
});
