import type { FootnoteReference } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderFootnoteReference: MarkdownNodeRenderer<
  FootnoteReference
> = (ctx, node) => {
  const number = ctx.state.footnoteNumbers.get(node.identifier)

  return h(
    "sup",
    null,
    h(
      "a",
      {
        id: `markdown-footnote-ref-${node.identifier}`,
        href: `#markdown-footnote-${node.identifier}`,
        class: "underline underline-offset-2",
      },
      number ?? "?",
    ),
  )
}
