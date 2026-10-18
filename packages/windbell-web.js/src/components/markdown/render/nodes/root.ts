import { Fragment, h } from "vue"
import type { Root } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderRoot: MarkdownNodeRenderer<Root> = (ctx, node) => {
  return h(Fragment, null, ctx.renderChildren(node.children))
}
