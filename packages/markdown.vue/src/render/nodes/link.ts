import type { Link } from "mdast"
import { h } from "vue"

import { safeUrl } from "../../markdownUrl.ts"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderLink: MarkdownNodeRenderer<Link> = (ctx, node) => {
  const rawHref = safeUrl(node.url)
  const href =
    rawHref === undefined
      ? undefined
      : (ctx.environment.resolveUrl?.(rawHref, { kind: "link" }) ?? rawHref)
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
      target: ctx.environment.linkTarget
        ? ctx.environment.linkTarget(href)
        : "_blank",
      rel: "noopener noreferrer",
      onClick: ctx.environment.handleLinkClick
        ? (event: MouseEvent) => {
            ctx.environment.handleLinkClick?.(event, href)
          }
        : undefined,
    },
    children,
  )
}
