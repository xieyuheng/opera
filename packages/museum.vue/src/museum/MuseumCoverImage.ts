import type { MarkdownFrontmatter } from "@xieyuheng/markdown.vue"

export type MuseumCoverImage = {
  src: string
  alt: string | undefined
  maxWidth: string | undefined
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const text = value.trim()
    return text === "" ? undefined : text
  }

  if (typeof value === "number") return String(value)

  return undefined
}

function readMaxWidth(value: unknown): string | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? `${value}px` : undefined
  }

  return readString(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function readMuseumCoverImage(
  frontmatter: MarkdownFrontmatter | undefined,
): MuseumCoverImage | undefined {
  if (frontmatter === undefined) return undefined

  const value = frontmatter["cover-image"]
  if (!isRecord(value)) return undefined

  const src = readString(value.src)
  if (src === undefined) return undefined

  return {
    src,
    alt: readString(value.alt),
    maxWidth: readMaxWidth(value["max-width"]),
  }
}
