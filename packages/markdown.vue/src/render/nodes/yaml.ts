import type { Yaml } from "mdast"
import { h } from "vue"
import * as YAML from "yaml"

import type { MarkdownNodeRenderer } from "../types.ts"

interface FrontmatterData {
  title: string | undefined
  authors: string[]
  date: string | undefined
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)

  return undefined
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

function readFrontmatter(node: Yaml): FrontmatterData | undefined {
  let value: unknown

  try {
    value = YAML.parse(node.value)
  } catch {
    return undefined
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }

  const record = value as Record<string, unknown>
  const title = readString(record.title)
  const authors = readStringArray(record.authors ?? record.author)
  const date = readDate(record.date) ?? readYear(record.year)

  if (title === undefined && authors.length === 0 && date === undefined) {
    return undefined
  }

  return { title, authors, date }
}

export const renderYaml: MarkdownNodeRenderer<Yaml> = (ctx, node) => {
  const frontmatter = readFrontmatter(node)

  if (frontmatter === undefined) {
    return h("pre", { class: "whitespace-pre-wrap font-mono" }, node.value)
  }

  return h("header", { class: "flex flex-col gap-1" }, [
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
  ])
}
