import { h, type VNodeChild } from "vue"

import type { HighlightedCode } from "./highlightCode.ts"

type HighlightedToken = HighlightedCode[number][number]

function tokenFontStyle(token: HighlightedToken, theme: "light" | "dark") {
  const styles = token.variants[theme]

  if (styles === undefined) return "inherit"

  return (styles.fontStyle ?? 0) & 1 ? "italic" : "normal"
}

function tokenFontWeight(token: HighlightedToken, theme: "light" | "dark") {
  const styles = token.variants[theme]

  if (styles === undefined) return "inherit"

  return (styles.fontStyle ?? 0) & 2 ? "bold" : "normal"
}

function tokenTextDecoration(token: HighlightedToken, theme: "light" | "dark") {
  const styles = token.variants[theme]

  if (styles === undefined) return "inherit"

  return (styles.fontStyle ?? 0) & 4 ? "underline" : "none"
}

function tokenStyle(token: HighlightedToken): Record<string, string> {
  const light = token.variants.light
  const dark = token.variants.dark
  const fallbackColor = light?.color ?? "inherit"

  return {
    "--markdown-code-light-color": fallbackColor,
    "--markdown-code-dark-color": dark?.color ?? fallbackColor,
    "--markdown-code-light-font-style": tokenFontStyle(token, "light"),
    "--markdown-code-dark-font-style": tokenFontStyle(token, "dark"),
    "--markdown-code-light-font-weight": tokenFontWeight(token, "light"),
    "--markdown-code-dark-font-weight": tokenFontWeight(token, "dark"),
    "--markdown-code-light-text-decoration": tokenTextDecoration(
      token,
      "light",
    ),
    "--markdown-code-dark-text-decoration": tokenTextDecoration(token, "dark"),
  }
}

export function renderTokens(tokens: HighlightedCode): VNodeChild[] {
  const children: VNodeChild[] = []

  tokens.forEach((line, lineIndex) => {
    for (const token of line) {
      children.push(
        h(
          "span",
          {
            class: "markdown-code-token",
            style: tokenStyle(token),
          },
          token.content,
        ),
      )
    }

    if (lineIndex < tokens.length - 1) {
      children.push("\n")
    }
  })

  return children
}
