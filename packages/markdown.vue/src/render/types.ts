import type { VNodeChild } from "vue"

import type { MarkdownState } from "../markdownState.ts"
import type { MarkdownNode } from "../markdownTypes.ts"

export type MarkdownUrlKind = "link" | "image"

export type MarkdownEnvironment = {
  /**
   * Resolve a Markdown URL before it is rendered.
   *
   * Return a replacement URL, or undefined to keep the original URL. This is
   * useful for museum pages where relative document links must resolve against
   * the source document URL instead of the browser route.
   */
  resolveUrl?: (
    url: string,
    options: { kind: MarkdownUrlKind },
  ) => string | undefined

  /**
   * Return the target attribute for a rendered link. Returning undefined
   * leaves the link in the current document.
   */
  linkTarget?: (url: string) => string | undefined

  /**
   * Intercept a link click. Return true after handling it to prevent the
   * browser's default navigation.
   */
  handleLinkClick?: (event: MouseEvent, url: string) => boolean | void
}

export type MarkdownRenderContext = {
  state: MarkdownState
  environment: MarkdownEnvironment
  renderers: Partial<Record<MarkdownNode["type"], MarkdownNodeRenderer>>
  renderNode: (node: MarkdownNode) => VNodeChild
  renderChildren: (nodes: readonly MarkdownNode[]) => VNodeChild[]
}

export type MarkdownNodeRenderer<T extends MarkdownNode = MarkdownNode> = (
  ctx: MarkdownRenderContext,
  node: T,
) => VNodeChild
