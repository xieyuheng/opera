import type { Root } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { frontmatterFromMarkdown } from "mdast-util-frontmatter"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { frontmatter } from "micromark-extension-frontmatter"
import { gfm } from "micromark-extension-gfm"

const extensions = [gfm(), frontmatter(["yaml"])]
const mdastExtensions = [gfmFromMarkdown(), frontmatterFromMarkdown(["yaml"])]

export function parseMarkdown(source: string): Root {
  return fromMarkdown(source, {
    extensions,
    mdastExtensions,
  })
}
