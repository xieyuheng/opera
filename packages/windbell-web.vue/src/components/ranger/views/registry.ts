import type { FileSystemEntry } from "@xieyuheng/fs.ts/fs"
import type { Component } from "vue"

import { windbellFs as fs } from "../../../app/fs.ts"
import { resolveFileLanguage } from "./fileLanguage.ts"
import MarkdownView from "./MarkdownView.vue"
import TextView from "./TextView.vue"

const textExtensions = new Set([
  // shell
  "bash",
  "fish",
  "sh",
  "zsh",

  // PowerShell
  "ps1",
  "psm1",
  "psd1",

  // C family
  "c",
  "h",
  "cc",
  "cpp",
  "hpp",
  "cs",

  // JVM
  "java",
  "kt",

  // web
  "css",
  "htm",
  "html",
  "js",
  "cjs",
  "mjs",
  "jsx",
  "ts",
  "cts",
  "mts",
  "tsx",
  "vue",
  "less",
  "scss",

  // JSON
  "json",
  "jsonc",
  "jsonl",
  "ndjson",

  // config
  "conf",
  "env",
  "ini",
  "properties",
  "svg",
  "toml",
  "xaml",
  "xml",
  "yaml",
  "yml",

  // build tools
  "cmake",
  "dockerfile",
  "mk",

  // diff
  "diff",
  "patch",

  // languages
  "clj",
  "cljc",
  "cljs",
  "edn",
  "go",
  "graphql",
  "gql",
  "lua",
  "php",
  "py",
  "rake",
  "rb",
  "rs",
  "sql",

  // assembly
  "asm",
  "inc",
  "nasm",
  "s",
  "yasm",

  // plain text and data
  "csv",
  "log",
  "text",
  "tsv",
  "txt",

  // lisp
  "asdf",
  "cl",
  "lisp",
  "rkt",
  "scm",
  "ss",

  // from x-lisp
  "meta",
  "basic",
])

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".")
  if (index <= 0) return ""

  return name.slice(index + 1).toLowerCase()
}

export async function resolveFileView(
  entry: FileSystemEntry,
): Promise<Component | undefined> {
  if (entry.kind === "Directory") return undefined

  const extension = extensionOf(entry.name)
  if (extension === "md" || extension === "markdown") return MarkdownView
  if (resolveFileLanguage(entry.path) !== undefined) return TextView
  if (textExtensions.has(extension)) return TextView

  const result = await fs.classifyFile(entry.path)
  if (result.kind === "OkResult" && result.value === "text") return TextView

  return undefined
}
