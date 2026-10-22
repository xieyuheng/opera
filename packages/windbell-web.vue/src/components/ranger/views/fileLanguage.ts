const languageByExtension: Record<string, string> = {
  bash: "bash",
  sh: "bash",
  zsh: "bash",
  fish: "bash",

  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  hpp: "cpp",

  css: "css",
  diff: "diff",
  go: "go",
  htm: "html",
  html: "html",
  java: "java",

  js: "javascript",
  cjs: "javascript",
  mjs: "javascript",
  jsx: "jsx",

  json: "json",
  jsonc: "jsonc",

  md: "markdown",
  markdown: "markdown",
  py: "python",
  rs: "rust",
  sql: "sql",

  ts: "typescript",
  cts: "typescript",
  mts: "typescript",
  tsx: "tsx",

  vue: "vue",
  yaml: "yaml",
  yml: "yaml",

  // from x-lisp
  meta: "meta-lisp",
  basic: "basic-lisp",
  xvm: "xvm-lisp",
  x86: "x86-lisp",
}

export function resolveFileLanguage(path: string): string | undefined {
  const name = path.slice(path.lastIndexOf("/") + 1)
  const index = name.lastIndexOf(".")
  if (index <= 0) return undefined

  return languageByExtension[name.slice(index + 1).toLowerCase()]
}
