import { h } from "vue"
import type { Table } from "mdast"
import type { MarkdownNodeRenderer } from "../types.ts"

export const renderTable: MarkdownNodeRenderer<Table> = (ctx, node) => {
  return h("div", { class: "my-4 overflow-x-auto thin-scrollbar" }, [
    h(
      "table",
      { class: "w-full border-collapse text-left" },
      ctx.renderChildren(node.children),
    ),
  ])
}
