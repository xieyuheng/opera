import type { JsonObject } from "@windbell/std.ts/json"

export type LockError = {
  type: string
  who: string
  message: string
  info?: JsonObject
}
