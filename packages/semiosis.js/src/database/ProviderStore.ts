import type { Path } from "@windbell/std.js/path"
import type { ProviderConfig } from "../provider/index.ts"
import { parseProviderConfig } from "../provider/index.ts"
import type { FileStore } from "./FileStore.ts"
import { assertId, isValidId } from "./id.ts"

export type ProviderStoreOptions = {
  files: FileStore
  path: Path
  root: string
}

export type ProviderStore = {
  get(providerName: string): Promise<ProviderConfig | undefined>
  put(providerName: string, value: ProviderConfig): Promise<void>
  list(): Promise<Array<string>>
  remove(providerName: string): Promise<void>
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
      assertId(providerName)

      const value = await options.files.readJsonFile(providerPath(providerName))
      if (value === undefined) return undefined

      return parseProviderConfig(value)
    },

    async put(providerName, value) {
      assertId(providerName)

      if (value.name !== providerName) {
        throw new Error(
          `[ProviderStore] provider name mismatch: expected ${providerName}, got ${value.name}`,
        )
      }

      await options.files.writeJsonFile(providerPath(providerName), value)
    },

    async list() {
      const directoryNames = await options.files.listDirectories(root)
      const providerNames: Array<string> = []

      for (const providerName of directoryNames) {
        if (!isValidId(providerName)) continue
        if (!(await options.files.exists(providerPath(providerName)))) continue

        providerNames.push(providerName)
      }

      providerNames.sort()
      return providerNames
    },

    async remove(providerName) {
      assertId(providerName)
      await options.files.remove(providerDir(providerName))
    },
  }

  return store
}
