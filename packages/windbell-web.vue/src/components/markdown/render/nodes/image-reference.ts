import { h } from "vue"
import type { ImageReference } from "mdast"
import { safeUrl } from "../../markdownUrl.ts"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderImageReference: MarkdownNodeRenderer<ImageReference> = (
  ctx,
  node,
) => {
  const definition = ctx.state.definitions.get(node.identifier)
  const src = safeUrl(definition?.url, { image: true })

  if (src === undefined) {
    return h("span", null, node.alt ?? node.label ?? "")
  }

  return h("img", {
    class: "my-2 max-w-full rounded",
    src,
    alt: node.alt ?? definition?.label ?? "",
    title: definition?.title ?? undefined,
    loading: "lazy",
  })
}
