import type { FileSystemEntry } from "@xieyuheng/fs.ts/fs"

export type RangerDirectoryContent = {
  type: "directory"
  entries: FileSystemEntry[]
}

export type RangerFileContent = {
  type: "file"
  path: string
  bytes: Uint8Array
}

export type RangerEmptyContent = {
  type: "none"
}

export type RangerContent =
  | RangerDirectoryContent
  | RangerFileContent
  | RangerEmptyContent
