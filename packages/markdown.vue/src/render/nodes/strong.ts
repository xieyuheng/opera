import { h } from "vue"
import type { Strong } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderStrong: MarkdownNodeRenderer<Strong> = (ctx, node) => {
  return h(
    "strong",
    { class: "font-semibold" },
    ctx.renderChildren(node.children),
  )
}
