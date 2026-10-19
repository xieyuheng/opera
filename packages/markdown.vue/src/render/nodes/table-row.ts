import type { TableRow } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderTableRow: MarkdownNodeRenderer<TableRow> = (ctx, node) => {
  return h(
    "tr",
    { class: "border-b border-ink/30" },
    ctx.renderChildren(node.children),
  )
}
