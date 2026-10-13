import type { Database } from "../database/Database.ts"
import type { Settings } from "../settings/Settings.ts"

export type SettingsService = {
  get(): Promise<Settings>
  put(settings: Settings): Promise<void>
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
      return (
        (await database.settings.get()) ?? {
          defaultProvider: null,
          themeId: null,
        }
      )
    },

    async put(value) {
      await database.settings.put(value)
    },
  }
}
