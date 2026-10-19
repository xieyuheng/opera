import type { Paragraph } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderParagraph: MarkdownNodeRenderer<Paragraph> = (ctx, node) => {
  return h(
    "p",
    { class: "markdown-paragraph my-3 first:mt-0 last:mb-0" },
    ctx.renderChildren(node.children),
  )
}
