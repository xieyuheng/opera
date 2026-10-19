import type { Break } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderBreak: MarkdownNodeRenderer<Break> = () => {
  return h("br")
}
