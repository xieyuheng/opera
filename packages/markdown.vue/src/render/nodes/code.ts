import type { Code } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"
import CodeBlock from "./CodeBlock.vue"

export const renderCode: MarkdownNodeRenderer<Code> = (ctx, node) => {
  return h(CodeBlock, {
    code: node.value,
    lang: node.lang,
    meta: node.meta,
  })
}
