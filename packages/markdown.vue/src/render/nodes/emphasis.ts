import { h } from "vue"
import type { Emphasis } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderEmphasis: MarkdownNodeRenderer<Emphasis> = (ctx, node) => {
  return h("em", null, ctx.renderChildren(node.children))
}
