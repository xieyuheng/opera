import type { Link } from "mdast"
import { h } from "vue"

import { safeUrl } from "../../markdownUrl.ts"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderLink: MarkdownNodeRenderer<Link> = (ctx, node) => {
  const href = safeUrl(node.url)
  const children = ctx.renderChildren(node.children)

  if (href === undefined) {
    return h("span", null, children)
  }

  return h(
    "a",
    {
      href,
      title: node.title ?? undefined,
      class: "underline underline-offset-2",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    children,
  )
}
