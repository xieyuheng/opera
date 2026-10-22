const languageByExtension: Record<string, string> = {
  // shell
  bash: "bash",
  fish: "bash",
  sh: "bash",
  zsh: "bash",

  // PowerShell
  ps1: "powershell",
  psm1: "powershell",
  psd1: "powershell",

  // C family
  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  hpp: "cpp",

  // web
  css: "css",
  htm: "html",
  html: "html",
  js: "javascript",
  cjs: "javascript",
  mjs: "javascript",
  jsx: "jsx",
  ts: "typescript",
  cts: "typescript",
  mts: "typescript",
  tsx: "tsx",
  vue: "vue",

  // JSON
  json: "json",
  jsonc: "jsonc",
  jsonl: "jsonl",
  ndjson: "jsonl",

  // config
  conf: "ini",
  env: "dotenv",
  ini: "ini",
  properties: "properties",
  svg: "xml",
  toml: "toml",
  xaml: "xml",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",

  // build tools
  cmake: "cmake",
  dockerfile: "dockerfile",
  mk: "makefile",

  // diff
  diff: "diff",
  patch: "diff",

  // languages
  clj: "clojure",
  cljc: "clojure",
  cljs: "clojure",
  edn: "clojure",
  go: "go",
  lua: "lua",
  php: "php",
  py: "python",
  rake: "ruby",
  rb: "ruby",
  rs: "rust",
  sql: "sql",
  md: "markdown",
  markdown: "markdown",

  // assembly
  asm: "asm",
  inc: "asm",
  nasm: "asm",
  s: "asm",
  yasm: "asm",

  // from x-lisp
  meta: "meta-lisp",
  basic: "basic-lisp",
}

const languageByCompoundExtension: Record<string, string> = {
  // from x-lisp
  "xvm.asm": "xvm-lisp",
  "x86.asm": "x86-lisp",
}

const languageByFileName: Record<string, string> = {
  "cmakelists.txt": "cmake",
  dockerfile: "dockerfile",
  gemfile: "ruby",
  gnumakefile: "makefile",
  makefile: "makefile",
  rakefile: "ruby",
}

function resolveFileNameLanguage(name: string): string | undefined {
  const lowerName = name.toLowerCase()

  for (const [extension, language] of Object.entries(
    languageByCompoundExtension,
  )) {
    if (lowerName.endsWith(`.${extension}`)) return language
  }

  if (lowerName === ".env" || lowerName.startsWith(".env.")) {
    return "dotenv"
  }

  if (lowerName.startsWith("dockerfile.")) {
    return "dockerfile"
  }

  return languageByFileName[lowerName]
}

export function resolveFileLanguage(path: string): string | undefined {
  const name = path.split(/[\\/]/).pop() ?? path
  const nameLanguage = resolveFileNameLanguage(name)
  if (nameLanguage !== undefined) return nameLanguage

  const index = name.lastIndexOf(".")
  if (index <= 0) return undefined

  return languageByExtension[name.slice(index + 1).toLowerCase()]
}
