import type { JsonObject } from "@windbell/std.js/json"

export type FileSystemError = {
  type: string
  who: string
  message: string
  info?: JsonObject
}
