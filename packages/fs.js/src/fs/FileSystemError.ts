import type { JsonObject } from "@windbell/std.js/json"

export type FileSystemError = {
  type: string
  who: string
  message: string
  info: JsonObject
}

export function makeFileSystemError(
  type: string,
  who: string,
  message: string,
  info: JsonObject = {},
): FileSystemError {
  return { type, who, message, info }
}
