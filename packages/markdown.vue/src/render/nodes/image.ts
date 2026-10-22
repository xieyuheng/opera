import type { Image } from "mdast"
import { h } from "vue"

import { safeUrl } from "../../markdownUrl.ts"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderImage: MarkdownNodeRenderer<Image> = (ctx, node) => {
  const rawSrc = safeUrl(node.url, { image: true })
  const src =
    rawSrc === undefined
      ? undefined
      : (ctx.environment.resolveUrl?.(rawSrc, { kind: "image" }) ?? rawSrc)

  if (src === undefined) {
    return h("span", null, node.alt ?? "")
  }

  return h("img", {
    class: "my-2 max-w-full rounded",
    src,
    alt: node.alt ?? "",
    title: node.title ?? undefined,
    loading: "lazy",
  })
}
