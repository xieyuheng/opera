import { h } from "vue"
import type { Html } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderHtml: MarkdownNodeRenderer<Html> = (ctx, node) => {
  return h(
    "span",
    { class: "whitespace-pre-wrap font-mono text-ink" },
    node.value,
  )
}
