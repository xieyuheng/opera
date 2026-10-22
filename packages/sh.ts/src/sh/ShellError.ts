import type { JsonObject } from "@xieyuheng/std.ts/json"

export type ShellError = {
  type: string
  who: string
  message: string
  info?: JsonObject
}
