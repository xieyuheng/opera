import { h } from "vue"
import type { ThematicBreak } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderThematicBreak: MarkdownNodeRenderer<ThematicBreak> = () => {
  return h("hr", { class: "my-6 border-ink" })
}
