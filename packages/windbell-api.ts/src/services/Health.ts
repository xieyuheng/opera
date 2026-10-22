import { ok, type Result } from "@xieyuheng/std.ts/result"
import type * as W from "@xieyuheng/windbell.ts"

export type WindbellHealth = {
  ok: boolean
  service: string
}

export function GetHealth() {
  return async (): Promise<Result<WindbellHealth, W.ServiceError>> => {
    return ok({
      ok: true,
      service: "windbell-api",
    })
  }
}
