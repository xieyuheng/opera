import type { Blockquote } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderBlockquote: MarkdownNodeRenderer<Blockquote> = (
  ctx,
  node,
) => {
  return h(
    "blockquote",
    { class: "my-3 border-l-3 border-ink/60 pl-4 text-ink" },
    ctx.renderChildren(node.children),
  )
}
