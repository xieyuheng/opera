import type { Heading } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderHeading: MarkdownNodeRenderer<Heading> = (ctx, node) => {
  const depth = Math.min(Math.max(node.depth, 1), 6)
  const tag = `h${depth}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  const sizeClass =
    node.depth === 1 ? "text-xl" : node.depth === 2 ? "text-lg" : undefined
  const prefix = "#".repeat(depth)

  return h(tag, { class: ["mb-3 mt-6 font-semibold first:mt-0", sizeClass] }, [
    h("span", { class: "text-ink", "aria-hidden": "true" }, ` ${prefix} `),
    ...ctx.renderChildren(node.children),
  ])
}
