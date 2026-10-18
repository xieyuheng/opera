import type { VNodeChild } from "vue"
import type { MarkdownState } from "../markdownState.ts"
import type { MarkdownNode } from "../markdownTypes.ts"

export type MarkdownRenderContext = {
  state: MarkdownState
  renderNode: (node: MarkdownNode) => VNodeChild
  renderChildren: (nodes: readonly MarkdownNode[]) => VNodeChild[]
}

export type MarkdownNodeRenderer<T extends MarkdownNode = MarkdownNode> = (
  ctx: MarkdownRenderContext,
  node: T,
) => VNodeChild
