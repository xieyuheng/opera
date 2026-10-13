import type * as S from "@windbell/semiosis.js"
import { ok, type Result } from "@windbell/std.js/result"

export type WindbellHealth = {
  ok: boolean
  service: string
}

export function GetHealth() {
  return async (): Promise<Result<WindbellHealth, S.ServiceError>> => {
    return ok({
      ok: true,
      service: "windbell-api",
    })
  }
}
