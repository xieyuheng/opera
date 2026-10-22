import type { JsonObject } from "@xieyuheng/std.ts/json"

export type LockError = {
  type: string
  who: string
  message: string
  info?: JsonObject
}
