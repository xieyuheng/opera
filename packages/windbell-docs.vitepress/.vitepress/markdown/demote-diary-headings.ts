import type MarkdownIt from "markdown-it"

export function demoteDiaryHeadings(md: MarkdownIt): void {
  md.core.ruler.push("windbell:demote-diary-headings", (state) => {
    if (typeof state.env.frontmatter?.title !== "string") return
    if (!String(state.env.relativePath).includes("/diary/")) return

    const firstHeading = state.tokens.find(
      (token) => token.type === "heading_open",
    )

    if (firstHeading?.tag !== "h1") return

    for (const token of state.tokens) {
      if (token.type !== "heading_open" && token.type !== "heading_close") {
        continue
      }

      const level = Number(token.tag.slice(1))
      if (level < 6) token.tag = `h${level + 1}`
    }
  })
}
