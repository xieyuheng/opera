import type { CSSProperties } from "vue"

import type { MarkdownFrontmatter } from "./frontmatter.ts"

export const defaultMarkdownStyle: Readonly<CSSProperties> = Object.freeze({
  whiteSpace: "pre-line",
})

function camelizeStyleProperty(property: string): string {
  if (property.startsWith("--")) return property

  return property.replace(/-([a-z])/gi, (_, character: string) =>
    character.toUpperCase(),
  )
}

export function readFrontmatterStyle(
  frontmatter: MarkdownFrontmatter | undefined,
): CSSProperties {
  const value = frontmatter?.style

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  const style: Record<string, string> = {}

  for (const [property, item] of Object.entries(value)) {
    if (
      property === "__proto__" ||
      property === "constructor" ||
      property === "prototype"
    ) {
      continue
    }

    const name = camelizeStyleProperty(property)

    if (typeof item === "string") {
      style[name] = item
    } else if (typeof item === "number") {
      style[name] = String(item)
    }
  }

  return style as CSSProperties
}

export function createMarkdownStyle(
  frontmatter: MarkdownFrontmatter | undefined,
): CSSProperties {
  return {
    ...defaultMarkdownStyle,
    ...readFrontmatterStyle(frontmatter),
  }
}
