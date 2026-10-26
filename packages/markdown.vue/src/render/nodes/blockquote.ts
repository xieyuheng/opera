import type { Blockquote } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderBlockquote: MarkdownNodeRenderer<Blockquote> = (
  ctx,
  node,
) => {
  return h(
    "blockquote",
    { class: "my-6 border-ink/60 px-8 text-ink" },
    ctx.renderChildren(node.children),
  )
}
