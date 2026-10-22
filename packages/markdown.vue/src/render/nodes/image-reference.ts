import type { ImageReference } from "mdast"
import { h } from "vue"

import { safeUrl } from "../../markdownUrl.ts"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderImageReference: MarkdownNodeRenderer<ImageReference> = (
  ctx,
  node,
) => {
  const definition = ctx.state.definitions.get(node.identifier)
  const rawSrc = safeUrl(definition?.url, { image: true })
  const src =
    rawSrc === undefined
      ? undefined
      : (ctx.environment.resolveUrl?.(rawSrc, { kind: "image" }) ?? rawSrc)

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
