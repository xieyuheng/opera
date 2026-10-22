import {
  createBundledHighlighter,
  type ThemedTokenWithVariants,
} from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

const languageLoaders = {
  asm: () => import("shiki/langs/asm.mjs"),
  bash: () => import("shiki/langs/bash.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  clojure: () => import("shiki/langs/clojure.mjs"),
  cmake: () => import("shiki/langs/cmake.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  dockerfile: () => import("shiki/langs/dockerfile.mjs"),
  dotenv: () => import("shiki/langs/dotenv.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsonc: () => import("shiki/langs/jsonc.mjs"),
  jsonl: () => import("shiki/langs/jsonl.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  lua: () => import("shiki/langs/lua.mjs"),
  makefile: () => import("shiki/langs/makefile.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  powershell: () => import("shiki/langs/powershell.mjs"),
  properties: () => import("shiki/langs/properties.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  ruby: () => import("shiki/langs/ruby.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  vue: () => import("shiki/langs/vue.mjs"),
  xml: () => import("shiki/langs/xml.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  // from x-lisp
  "meta-lisp": () => import("@xieyuheng/x-lisp-shiki.ts/meta-lisp"),
  "basic-lisp": () => import("@xieyuheng/x-lisp-shiki.ts/basic-lisp"),
  "xvm-lisp": () => import("@xieyuheng/x-lisp-shiki.ts/xvm-lisp"),
  "x86-lisp": () => import("@xieyuheng/x-lisp-shiki.ts/x86-lisp"),
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
  asm: "asm",
  assembly: "asm",
  bash: "bash",
  c: "c",
  "c++": "cpp",
  clj: "clojure",
  cljc: "clojure",
  cljs: "clojure",
  clojure: "clojure",
  cmake: "cmake",
  cpp: "cpp",
  css: "css",
  diff: "diff",
  docker: "dockerfile",
  dockerfile: "dockerfile",
  dotenv: "dotenv",
  env: "dotenv",
  go: "go",
  html: "html",
  ini: "ini",
  java: "java",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsonc: "jsonc",
  jsonl: "jsonl",
  jsonlines: "jsonl",
  jsx: "jsx",
  lua: "lua",
  make: "makefile",
  makefile: "makefile",
  ndjson: "jsonl",
  patch: "diff",
  php: "php",
  powershell: "powershell",
  properties: "properties",
  ps1: "powershell",
  pwsh: "powershell",
  rb: "ruby",
  ruby: "ruby",
  svg: "xml",
  toml: "toml",
  xaml: "xml",
  xml: "xml",
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
  // from x-lisp
  "meta-lisp": "meta-lisp",
  "basic-lisp": "basic-lisp",
  "xvm-lisp": "xvm-lisp",
  "x86-lisp": "x86-lisp",
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
