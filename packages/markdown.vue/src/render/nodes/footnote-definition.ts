import type { FootnoteDefinition } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

export const renderFootnoteDefinition: MarkdownNodeRenderer<
  FootnoteDefinition
> = (ctx, node) => {
  const number = ctx.state.footnoteNumbers.get(node.identifier)

  return h(
    "section",
    { id: `markdown-footnote-${node.identifier}`, class: "my-3 text-ink" },
    h("div", { class: "flex gap-2" }, [
      h("span", { class: "shrink-0" }, `${number ?? "?"}.`),
      h("div", { class: "min-w-0 flex-1" }, ctx.renderChildren(node.children)),
    ]),
  )
}
