import type { Text } from "mdast"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderText: MarkdownNodeRenderer<Text> = (ctx, node) => {
  return node.value
}
