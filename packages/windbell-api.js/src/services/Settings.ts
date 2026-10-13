import type * as S from "@windbell/semiosis.js"
import { ok, type Result } from "@windbell/std.js/result"
import type { ServiceError } from "../errors/ServiceError.ts"

export type SettingsServiceOptions = {
  settings: S.SettingsService
}

export function GetSettings(options: SettingsServiceOptions) {
  return async (): Promise<Result<S.Settings, ServiceError>> => {
    return ok(await options.settings.get())
  }
}

export function PutSettings(options: SettingsServiceOptions) {
  return async (input: {
    settings: S.Settings
  }): Promise<Result<null, ServiceError>> => {
    await options.settings.put(input.settings)
    return ok(null)
  }
}
