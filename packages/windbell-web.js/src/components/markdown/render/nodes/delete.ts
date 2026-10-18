import { h } from "vue"
import type { Delete } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderDelete: MarkdownNodeRenderer<Delete> = (ctx, node) => {
  return h("del", { class: "text-ink" }, ctx.renderChildren(node.children))
}
