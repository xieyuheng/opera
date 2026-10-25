import type { Yaml } from "mdast"
import { h } from "vue"

import {
  readFrontmatterString,
  type MarkdownFrontmatter,
} from "../../frontmatter.ts"
import type { MarkdownNodeRenderer } from "../types.ts"

interface FrontmatterData {
  title: string | undefined
  authors: string[]
  date: string | undefined
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => readStringArray(item))
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "")
  }

  if (typeof value === "number") {
    return [String(value)]
  }

  return []
}

function readDate(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (value instanceof Date) return value.toISOString().slice(0, 10)

  return undefined
}

function readYear(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (value instanceof Date) return String(value.getFullYear())

  return undefined
}

function readFrontmatter(
  data: MarkdownFrontmatter | undefined,
): FrontmatterData | undefined {
  if (data === undefined) return undefined

  return {
    title: readFrontmatterString(data, "title"),
    authors: readStringArray(data.authors ?? data.author),
    date: readDate(data.date) ?? readYear(data.year),
  }
}

export const renderYaml: MarkdownNodeRenderer<Yaml> = (ctx, node) => {
  const frontmatter = readFrontmatter(ctx.state.frontmatter)

  if (frontmatter === undefined) {
    return h("pre", { class: "whitespace-pre-wrap font-mono mb-8" }, node.value)
  }

  const children = [
    frontmatter.title === undefined
      ? null
      : h(
          "div",
          { class: "text-2xl font-semibold text-ink" },
          frontmatter.title,
        ),
    frontmatter.authors.length === 0
      ? null
      : h("div", null, frontmatter.authors.join(", ")),
    frontmatter.date === undefined ? null : h("div", null, frontmatter.date),
  ]

  if (children.every((child) => child === null)) return null

  return h("header", { class: "flex flex-col gap-1 mb-8" }, children)
}
