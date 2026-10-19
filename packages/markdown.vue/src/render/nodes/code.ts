import type { Code } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderCode: MarkdownNodeRenderer<Code> = (ctx, node) => {
  return h(
    "pre",
    {
      class:
        "my-4 overflow-x-auto rounded-md border border-ink/20 bg-ink/10 px-3 py-2 thin-scrollbar",
    },
    h("code", { class: "font-mono" }, node.value),
  )
}
