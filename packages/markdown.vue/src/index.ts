import Markdown from "./Markdown.vue"

export { Markdown }
export default Markdown

export {
  HighlightedCodeView,
  highlightCode,
  type HighlightedCode,
} from "./highlight/index.ts"
export {
  findFrontmatterNode,
  parseFrontmatter,
  readFrontmatterString,
} from "./frontmatter.ts"
export type { MarkdownFrontmatter } from "./frontmatter.ts"
export { createMarkdownState } from "./markdownState.ts"
export { parseMarkdown } from "./parseMarkdown.ts"
export {
  createMarkdownStyle,
  defaultMarkdownStyle,
  readFrontmatterStyle,
} from "./style.ts"
export {
  createMarkdownRenderContext,
  renderMarkdownNode,
} from "./render/dispatch.ts"

export type { MarkdownNode } from "./markdownTypes.ts"
export type { MarkdownState } from "./markdownState.ts"
export type {
  MarkdownEnvironment,
  MarkdownNodeRenderer,
  MarkdownRenderContext,
  MarkdownUrlKind,
} from "./render/types.ts"
