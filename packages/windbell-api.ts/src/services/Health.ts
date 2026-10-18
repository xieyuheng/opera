import type * as S from "@windbell/semiosis.ts"
import { ok, type Result } from "@windbell/std.ts/result"

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
