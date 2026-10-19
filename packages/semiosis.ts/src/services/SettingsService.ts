import { err, isError, ok, type Result } from "@windbell/std.ts/result"

import type { Database } from "../database/Database.ts"
import type { Settings } from "../settings/Settings.ts"
import {
  makeServiceErrorFromDatabaseError,
  type ServiceError,
} from "./ServiceError.ts"

export type SettingsService = {
  get(): Promise<Result<Settings, ServiceError>>
  put(settings: Settings): Promise<Result<void, ServiceError>>
}

export type SettingsServiceOptions = {
  database: Database
}

export function makeSettingsService(
  options: SettingsServiceOptions,
): SettingsService {
  const database = options.database

  return {
    async get() {
      const result = await database.settings.get()
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }

      return ok(
        result.value ?? {
          defaultProvider: null,
          themeId: null,
        },
      )
    },

    async put(value) {
      const result = await database.settings.put(value)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },
  }
}
