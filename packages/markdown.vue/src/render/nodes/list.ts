import type { List, ListItem } from "mdast"
import { h } from "vue"

import type { MarkdownNodeRenderer } from "../types.ts"

function markerFor(node: List, index: number): string {
  if (!node.ordered) return "* "

  const start = node.start ?? 1
  return `${start + index}. `
}

export function renderListItem(
  ctx: Parameters<MarkdownNodeRenderer<ListItem>>[0],
  node: ListItem,
  marker = "* ",
) {
  const task = node.checked === true || node.checked === false
  const children = ctx.renderChildren(node.children)
  const markerElement = h(
    "span",
    { class: "markdown-list-marker", "aria-hidden": "true" },
    marker,
  )

  if (task) {
    return h(
      "li",
      {
        class: "markdown-list-item flex items-start gap-2",
        style: { "--marker-size": `${marker.length}ch` },
      },
      [
        markerElement,
        h("input", {
          class: "mt-1 accent-ink",
          type: "checkbox",
          disabled: true,
          checked: node.checked === true,
        }),
        h("div", { class: "min-w-0 flex-1" }, children),
      ],
    )
  }

  return h(
    "li",
    {
      class: "markdown-list-item",
      style: { "--marker-size": `${marker.length}ch` },
    },
    [markerElement, ...children],
  )
}

export const renderList: MarkdownNodeRenderer<List> = (ctx, node) => {
  const tag = node.ordered ? "ol" : "ul"
  const start = node.ordered ? (node.start ?? undefined) : undefined

  return h(
    tag,
    {
      start,
      class: "markdown-list list-none space-y-1 pl-0",
    },
    node.children.map((item, index) =>
      renderListItem(ctx, item, markerFor(node, index)),
    ),
  )
}
