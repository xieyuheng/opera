export type DiaryMeta = {
  date?: string
  author?: string
}

function formatDate(value: unknown): string | undefined {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return undefined
}

function dateFromPath(relativePath: string): string | undefined {
  return relativePath.match(/\d{4}-\d{2}-\d{2}/)?.[0]
}

function formatAuthor(value: unknown): string | undefined {
  if (typeof value === "string") return value

  if (Array.isArray(value)) {
    const authors = value.filter((item) => typeof item === "string")

    return authors.length > 0 ? authors.join(", ") : undefined
  }

  return undefined
}

export function diaryMeta(
  frontmatter: Record<string, unknown>,
  relativePath: string,
): DiaryMeta {
  return {
    date: formatDate(frontmatter.date) ?? dateFromPath(relativePath),
    author: formatAuthor(frontmatter.author ?? frontmatter.authors),
  }
}
