import type { JsonObject } from "@windbell/std.js/json"

export type ShellError = {
  type: string
  who: string
  message: string
  info?: JsonObject
}
