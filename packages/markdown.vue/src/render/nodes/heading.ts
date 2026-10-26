import type { Heading } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderHeading: MarkdownNodeRenderer<Heading> = (ctx, node) => {
  const depth = Math.min(Math.max(node.depth, 1), 6)
  const tag = `h${depth}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  const sizeClass =
    node.depth === 1 ? "text-xl" : node.depth === 2 ? "text-lg" : undefined
  const prefix = "#".repeat(depth)
  const headingId = ctx.state.headingIds.get(node)
  const prefixNodes =
    ctx.headingAnchors && headingId !== undefined
      ? [
          " ",
          h(
            "a",
            {
              href: `#${headingId}`,
              class: "text-ink",
              "aria-label": "链接到此标题",
            },
            prefix,
          ),
          " ",
        ]
      : [h("span", { class: "text-ink", "aria-hidden": "true" }, ` ${prefix} `)]

  return h(
    tag,
    {
      id: ctx.headingAnchors ? headingId : undefined,
      class: ["mb-3 mt-6 font-semibold first:mt-0", sizeClass],
    },
    [...prefixNodes, ...ctx.renderChildren(node.children)],
  )
}
