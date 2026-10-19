import { h } from "vue"
import type { TableCell } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderTableCell: MarkdownNodeRenderer<TableCell> = (ctx, node) => {
  return h(
    "td",
    { class: "border border-ink px-2 py-1 align-top" },
    ctx.renderChildren(node.children),
  )
}
