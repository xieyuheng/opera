import { windbellFs as fs } from "../../../app/fs.ts"
import type { FileSystemEntry } from "@windbell/fs.ts/fs"
import type { Component } from "vue"
import MarkdownView from "./MarkdownView.vue"
import TextView from "./TextView.vue"

const textExtensions = new Set([
  "bash",
  "c",
  "cc",
  "conf",
  "cpp",
  "cs",
  "css",
  "csv",
  "cts",
  "cjs",
  "fish",
  "go",
  "graphql",
  "gql",
  "h",
  "hpp",
  "htm",
  "html",
  "ini",
  "java",
  "js",
  "json",
  "jsonc",
  "jsx",
  "kt",
  "less",
  "log",
  "mjs",
  "mts",
  "php",
  "py",
  "rb",
  "rs",
  "scss",
  "sh",
  "sql",
  "text",
  "toml",
  "ts",
  "tsv",
  "tsx",
  "txt",
  "vue",
  "xml",
  "yaml",
  "yml",
  "zsh",
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
  if (textExtensions.has(extension)) return TextView

  const result = await fs.classifyFile(entry.path)
  if (result.kind === "OkResult" && result.value === "text") return TextView

  return undefined
}
