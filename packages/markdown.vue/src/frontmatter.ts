import type { Root, Yaml } from "mdast"
import * as YAML from "yaml"

export type MarkdownFrontmatter = Readonly<Record<string, unknown>>

export function findFrontmatterNode(root: Root): Yaml | undefined {
  return root.children.find((node): node is Yaml => node.type === "yaml")
}

export function parseFrontmatter(
  node: Yaml | undefined,
): MarkdownFrontmatter | undefined {
  if (node === undefined) return undefined

  let value: unknown

  try {
    value = YAML.parse(node.value)
  } catch {
    return undefined
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }

  return value as MarkdownFrontmatter
}

export function readFrontmatterString(
  frontmatter: MarkdownFrontmatter | undefined,
  key: string,
): string | undefined {
  const value = frontmatter?.[key]

  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)

  return undefined
}
