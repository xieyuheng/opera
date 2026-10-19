import type { InlineCode } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderInlineCode: MarkdownNodeRenderer<InlineCode> = (
  ctx,
  node,
) => {
  return h(
    "code",
    {
      class: "rounded border border-ink/30 px-1.5 bg-ink/15 font-mono",
    },
    node.value,
  )
}
