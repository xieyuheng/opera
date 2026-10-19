import {
  createBundledHighlighter,
  type ThemedTokenWithVariants,
} from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

const languageLoaders = {
  bash: () => import("shiki/langs/bash.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsonc: () => import("shiki/langs/jsonc.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  vue: () => import("shiki/langs/vue.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
} as const

const themeLoaders = {
  "github-light-high-contrast": () =>
    import("shiki/themes/github-light-high-contrast.mjs"),
  "github-dark-high-contrast": () =>
    import("shiki/themes/github-dark-high-contrast.mjs"),
} as const

type MarkdownLanguage = keyof typeof languageLoaders

export type HighlightedCode = ThemedTokenWithVariants[][]

const languageAliases: Record<string, MarkdownLanguage> = {
  bash: "bash",
  c: "c",
  "c++": "cpp",
  cpp: "cpp",
  css: "css",
  diff: "diff",
  go: "go",
  html: "html",
  java: "java",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsonc: "jsonc",
  jsx: "jsx",
  markdown: "markdown",
  md: "markdown",
  py: "python",
  python: "python",
  rs: "rust",
  rust: "rust",
  sh: "bash",
  shell: "bash",
  shellscript: "bash",
  sql: "sql",
  ts: "typescript",
  tsx: "tsx",
  typescript: "typescript",
  vue: "vue",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
}

const createHighlighter = createBundledHighlighter({
  langs: languageLoaders,
  themes: themeLoaders,
  engine: () => createJavaScriptRegexEngine(),
})

const highlighterPromise = createHighlighter({
  langs: [],
  themes: ["github-light-high-contrast", "github-dark-high-contrast"],
})

const loadedLanguages = new Map<MarkdownLanguage, Promise<void>>()

function resolveLanguage(
  lang: string | null | undefined,
): MarkdownLanguage | undefined {
  if (lang === null || lang === undefined) return undefined

  return languageAliases[lang.trim().toLowerCase()]
}

async function loadLanguage(
  highlighter: Awaited<typeof highlighterPromise>,
  language: MarkdownLanguage,
): Promise<void> {
  const loaded = loadedLanguages.get(language)

  if (loaded !== undefined) {
    await loaded
    return
  }

  const loading = highlighter.loadLanguage(language)
  loadedLanguages.set(language, loading)

  try {
    await loading
  } catch (error) {
    loadedLanguages.delete(language)
    throw error
  }
}

export async function highlightCode(
  code: string,
  lang: string | null | undefined,
): Promise<HighlightedCode | undefined> {
  const language = resolveLanguage(lang)

  if (language === undefined || code === "") {
    return undefined
  }

  try {
    const highlighter = await highlighterPromise
    await loadLanguage(highlighter, language)

    const tokens = highlighter.codeToTokensWithThemes(code, {
      lang: language,
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark-high-contrast",
      },
    })

    return tokens
  } catch {
    return undefined
  }
}
