import { ok, type Result } from "@windbell/std.js/result"
import type { ServiceError } from "../errors/ServiceError.ts"

export type WindbellHealth = {
  ok: boolean
  service: string
}

export function GetHealth() {
  return async (): Promise<Result<WindbellHealth, ServiceError>> => {
    return ok({
      ok: true,
      service: "windbell-api",
    })
  }
}
