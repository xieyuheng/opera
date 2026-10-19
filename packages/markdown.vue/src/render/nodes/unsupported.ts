import { h } from "vue"

import type { MarkdownNode } from "../../markdownTypes.ts"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderUnsupported: MarkdownNodeRenderer = (ctx, node) => {
  return h(
    "span",
    { class: "rounded bg-sign-error/10 px-1 font-mono text-sign-error" },
    `unsupported: ${node.type}`,
  )
}
