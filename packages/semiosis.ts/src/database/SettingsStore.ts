import type { Path } from "@windbell/std.ts/path"
import { isError, ok, type Result } from "@windbell/std.ts/result"
import type { Settings } from "../settings/Settings.ts"
import type { DatabaseError } from "./DatabaseError.ts"
import type { FileStore } from "./FileStore.ts"

export type SettingsStoreOptions = {
  files: FileStore
  path: Path
  root: string
}

export type SettingsStore = {
  get(): Promise<Result<Settings | undefined, DatabaseError>>
  put(settings: Settings): Promise<Result<void, DatabaseError>>
}

export function makeSettingsStore(
  options: SettingsStoreOptions,
): SettingsStore {
  const filePath = options.path.join(options.root, "settings.json")

  return {
    async get() {
      const valueResult = await options.files.readJsonFile(filePath)
      if (isError(valueResult)) return valueResult
      if (valueResult.value === undefined) return ok(undefined)
      if (
        valueResult.value === null ||
        typeof valueResult.value !== "object" ||
        valueResult.value instanceof Array
      ) {
        return ok(undefined)
      }

      const record = valueResult.value as Record<string, unknown>
      return ok({
        defaultProvider:
          typeof record.defaultProvider === "string"
            ? record.defaultProvider
            : null,
        themeId: typeof record.themeId === "string" ? record.themeId : null,
      })
    },

    async put(settings) {
      return await options.files.writeJsonFile(filePath, settings)
    },
  }
}
