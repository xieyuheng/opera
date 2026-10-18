import type { JsonObject } from "@windbell/std.ts/json"

export type ShellError = {
  type: string
  who: string
  message: string
  info?: JsonObject
}
