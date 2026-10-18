import { h } from "vue"
import type { LinkReference } from "mdast"
import { safeUrl } from "../../markdownUrl.ts"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderLinkReference: MarkdownNodeRenderer<LinkReference> = (
  ctx,
  node,
) => {
  const definition = ctx.state.definitions.get(node.identifier)
  const href = safeUrl(definition?.url)
  const children = ctx.renderChildren(node.children)

  if (href === undefined) {
    return h("span", null, children)
  }

  return h(
    "a",
    {
      href,
      title: definition?.title ?? undefined,
      class: "underline underline-offset-2",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    children,
  )
}
