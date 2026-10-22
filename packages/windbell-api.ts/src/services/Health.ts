import type * as S from "@xieyuheng/semiosis.ts"
import { ok, type Result } from "@xieyuheng/std.ts/result"

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
