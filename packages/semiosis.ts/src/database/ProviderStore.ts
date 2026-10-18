import type { Path } from "@windbell/std.ts/path"
import { err, isError, ok, type Result } from "@windbell/std.ts/result"
import type { ProviderConfig } from "../provider/index.ts"
import { parseProviderConfig } from "../provider/index.ts"
import { makeDatabaseError, type DatabaseError } from "./DatabaseError.ts"
import type { FileStore } from "./FileStore.ts"
import { isValidId, validateId } from "./id.ts"

export type ProviderStoreOptions = {
  files: FileStore
  path: Path
  root: string
}

export type ProviderStore = {
  get(
    providerName: string,
  ): Promise<Result<ProviderConfig | undefined, DatabaseError>>
  put(
    providerName: string,
    value: ProviderConfig,
  ): Promise<Result<void, DatabaseError>>
  list(): Promise<Result<Array<string>, DatabaseError>>
  remove(providerName: string): Promise<Result<void, DatabaseError>>
}

export function makeProviderStore(
  options: ProviderStoreOptions,
): ProviderStore {
  const root = options.path.normalize(options.root)

  const providerDir = (providerName: string): string => {
    return options.path.join(root, providerName)
  }

  const providerPath = (providerName: string): string => {
    return options.path.join(providerDir(providerName), "index.json")
  }

  const store: ProviderStore = {
    async get(providerName) {
      const idResult = validateId(providerName)
      if (isError(idResult)) return idResult

      const valueResult = await options.files.readJsonFile(
        providerPath(providerName),
      )
      if (isError(valueResult)) return valueResult
      if (valueResult.value === undefined) return ok(undefined)

      return ok(parseProviderConfig(valueResult.value))
    },

    async put(providerName, value) {
      const idResult = validateId(providerName)
      if (isError(idResult)) return idResult

      if (value.name !== providerName) {
        return err(
          makeDatabaseError({
            type: "provider-name-mismatch",
            message: `provider name mismatch: expected ${providerName}, got ${value.name}`,
            info: { providerName, actual: value.name },
          }),
        )
      }

      return await options.files.writeJsonFile(
        providerPath(providerName),
        value,
      )
    },

    async list() {
      const directoryNamesResult = await options.files.listDirectories(root)
      if (isError(directoryNamesResult)) return directoryNamesResult

      const providerNames: Array<string> = []

      for (const providerName of directoryNamesResult.value) {
        if (!isValidId(providerName)) continue

        const existsResult = await options.files.exists(
          providerPath(providerName),
        )
        if (isError(existsResult)) return existsResult
        if (!existsResult.value) continue

        providerNames.push(providerName)
      }

      providerNames.sort()
      return ok(providerNames)
    },

    async remove(providerName) {
      const idResult = validateId(providerName)
      if (isError(idResult)) return idResult

      return await options.files.remove(providerDir(providerName))
    },
  }

  return store
}
