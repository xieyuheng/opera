import type { Definition, FootnoteDefinition, Heading, Root } from "mdast"

import {
  findFrontmatterNode,
  parseFrontmatter,
  type MarkdownFrontmatter,
} from "./frontmatter.ts"
import type { MarkdownNode } from "./markdownTypes.ts"

export interface MarkdownState {
  definitions: ReadonlyMap<string, Definition>
  footnoteDefinitions: ReadonlyMap<string, FootnoteDefinition>
  footnoteNumbers: ReadonlyMap<string, number>
  headingIds: ReadonlyMap<Heading, string>
  frontmatter: MarkdownFrontmatter | undefined
}

interface MarkdownStateBuilder {
  definitions: Map<string, Definition>
  footnoteDefinitions: Map<string, FootnoteDefinition>
  footnoteNumbers: Map<string, number>
  headingIds: Map<Heading, string>
  usedHeadingIds: Set<string>
}

function collectState(node: MarkdownNode, state: MarkdownStateBuilder): void {
  switch (node.type) {
    case "definition":
      state.definitions.set(node.identifier, node)
      break
    case "footnoteDefinition":
      state.footnoteDefinitions.set(node.identifier, node)
      break
    case "footnoteReference":
      if (!state.footnoteNumbers.has(node.identifier)) {
        state.footnoteNumbers.set(
          node.identifier,
          state.footnoteNumbers.size + 1,
        )
      }
      break
    case "heading":
      state.headingIds.set(node, allocateHeadingId(state, node))
      break
  }

  if ("children" in node) {
    for (const child of node.children) {
      collectState(child as MarkdownNode, state)
    }
  }
}

export function createMarkdownState(root: Root): MarkdownState {
  const state: MarkdownStateBuilder = {
    definitions: new Map(),
    footnoteDefinitions: new Map(),
    footnoteNumbers: new Map(),
    headingIds: new Map(),
    usedHeadingIds: new Set(),
  }

  collectState(root, state)

  return {
    ...state,
    frontmatter: parseFrontmatter(findFrontmatterNode(root)),
  }
}

function allocateHeadingId(
  state: MarkdownStateBuilder,
  heading: Heading,
): string {
  const base = slugifyHeadingText(readHeadingText(heading)) || "section"
  let id = base
  let suffix = 1

  while (state.usedHeadingIds.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }

  state.usedHeadingIds.add(id)
  return id
}

function readHeadingText(heading: Heading): string {
  return heading.children.map(readInlineText).join("")
}

function readInlineText(node: Heading["children"][number]): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
      return node.value
    case "image":
    case "imageReference":
      return node.alt ?? ""
    case "break":
      return " "
    case "footnoteReference":
      return node.label ?? ""
    case "html":
      return node.value
    default:
      return "children" in node
        ? node.children.map(readInlineText).join("")
        : ""
  }
}

function slugifyHeadingText(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
}
