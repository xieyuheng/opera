import { readdirSync, readFileSync } from "node:fs"
import { basename, join } from "node:path"
import type { DefaultTheme } from "vitepress"

function stripQuotes(text: string): string {
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1)
  }

  return text
}

function titleOf(file: string): string {
  const source = readFileSync(file, "utf8")
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const title = frontmatter?.[1].match(/^title:\s*(.+?)\s*$/m)?.[1]

  if (title) return stripQuotes(title)

  const heading = source.match(/^#\s+(.+?)\s*$/m)

  return heading?.[1] ?? basename(file, ".md")
}

export function markdownSidebar(
  directory: string,
  base: string,
): DefaultTheme.SidebarItem[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((a, b) => {
      if (a.name === "index.md") return -1
      if (b.name === "index.md") return 1

      return a.name.localeCompare(b.name)
    })
    .map((entry) => {
      const name = basename(entry.name, ".md")

      return {
        text: titleOf(join(directory, entry.name)),
        link: entry.name === "index.md" ? base : `${base}${name}`,
      }
    })
}
