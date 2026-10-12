import type { Path } from "@windbell/std.js/path"
import type { Settings } from "../settings/Settings.ts"
import type { FileStore } from "./FileStore.ts"

export type SettingsStoreOptions = {
  files: FileStore
  path: Path
  root: string
}

export type SettingsStore = {
  get(): Promise<Settings | undefined>
  put(settings: Settings): Promise<void>
}

export function makeSettingsStore(
  options: SettingsStoreOptions,
): SettingsStore {
  const filePath = options.path.join(options.root, "settings.json")

  return {
    async get() {
      const value = await options.files.readJsonFile(filePath)
      if (value === undefined) return undefined
      if (
        value === null ||
        typeof value !== "object" ||
        value instanceof Array
      ) {
        return undefined
      }

      const record = value as Record<string, unknown>
      return {
        defaultProvider:
          typeof record.defaultProvider === "string"
            ? record.defaultProvider
            : null,
        themeId: typeof record.themeId === "string" ? record.themeId : null,
      }
    },

    async put(settings) {
      await options.files.writeJsonFile(filePath, settings)
    },
  }
}
