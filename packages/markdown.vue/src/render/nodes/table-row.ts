import { h } from "vue"
import type { TableRow } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderTableRow: MarkdownNodeRenderer<TableRow> = (ctx, node) => {
  return h(
    "tr",
    { class: "border-b border-ink" },
    ctx.renderChildren(node.children),
  )
}
