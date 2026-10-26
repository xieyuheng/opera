import { isVNode, type VNodeChild } from "vue"

import type { MarkdownState } from "../markdownState.ts"
import type { MarkdownNode } from "../markdownTypes.ts"
import { renderUnsupported } from "./nodes/unsupported.ts"
import { renderers } from "./registry.ts"
import type {
  MarkdownEnvironment,
  MarkdownNodeRenderer,
  MarkdownRenderContext,
} from "./types.ts"

export type MarkdownRenderOptions = {
  environment?: MarkdownEnvironment
  renderers?: Partial<Record<MarkdownNode["type"], MarkdownNodeRenderer>>
  headingAnchors?: boolean
}

export function createMarkdownRenderContext(
  state: MarkdownState,
  options: MarkdownRenderOptions = {},
): MarkdownRenderContext {
  const ctx = {
    state,
    environment: options.environment ?? {},
    renderers: options.renderers ?? {},
    headingAnchors: options.headingAnchors ?? false,
  } as MarkdownRenderContext

  ctx.renderNode = (node) => renderMarkdownNode(ctx, node)
  ctx.renderChildren = (nodes) => renderMarkdownChildren(ctx, nodes)

  return ctx
}

export function renderMarkdownNode(
  ctx: MarkdownRenderContext,
  node: MarkdownNode,
): VNodeChild {
  const renderer = ctx.renderers[node.type] ?? renderers[node.type]

  if (renderer === undefined) {
    return renderUnsupported(ctx, node)
  }

  return renderer(ctx, node)
}

function renderMarkdownChildren(
  ctx: MarkdownRenderContext,
  nodes: readonly MarkdownNode[],
): VNodeChild[] {
  return nodes.map((node, index) => {
    const child = renderMarkdownNode(ctx, node)

    if (isVNode(child) && child.key == null) {
      child.key = node.position?.start.offset ?? index
    }

    return child
  })
}
