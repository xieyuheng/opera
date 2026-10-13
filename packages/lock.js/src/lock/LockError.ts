import type { JsonObject } from "@windbell/std.js/json"

export type LockError = {
  type: string
  who: string
  message: string
  info?: JsonObject
}
