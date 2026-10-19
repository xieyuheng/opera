import type { ThematicBreak } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderThematicBreak: MarkdownNodeRenderer<ThematicBreak> = () => {
  return h("hr", { class: "my-6 border-ink/50" })
}
