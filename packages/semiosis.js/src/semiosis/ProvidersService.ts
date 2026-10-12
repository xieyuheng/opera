import type { ProviderConfig } from "../provider/index.ts"
import { readProviderConfig } from "../provider/index.ts"
import type { ProviderModelEntry } from "../models/ProviderModelEntry.ts"
import { listProviderModelEntries } from "../models/listProviderModelEntries.ts"
import { pinModel } from "../models/pinModel.ts"
import { setDefaultModel } from "../models/setDefaultModel.ts"
import { unpinModel } from "../models/unpinModel.ts"
import { providerNames } from "../providers/providerNames.ts"
import { deleteApiKey, hasApiKey, writeApiKey } from "../database/apiKey.ts"
import type { Database } from "../database/Database.ts"

export type ProvidersService = {
  list(): Promise<Array<ProviderConfig>>
  get(providerName: string): Promise<ProviderConfig>
  getApiKeyStatus(providerName: string): Promise<boolean>
  listModels(options: {
    providerName: string
    all?: boolean
  }): Promise<Array<ProviderModelEntry>>
  pinModel(options: { providerName: string; modelName: string }): Promise<void>
  unpinModel(options: {
    providerName: string
    modelName: string
  }): Promise<void>
  setDefaultModel(options: {
    providerName: string
    modelName: string
  }): Promise<void>
  putApiKey(options: { providerName: string; key: string }): Promise<void>
  deleteApiKey(providerName: string): Promise<void>
}

export type ProvidersServiceOptions = {
  database: Database
}

export function makeProvidersService(
  options: ProvidersServiceOptions,
): ProvidersService {
  const database = options.database

  return {
    async list() {
      const configs: Array<ProviderConfig> = []

      for (const providerName of providerNames) {
        configs.push(await readProviderConfig(database, providerName))
      }

      return configs
    },

    async get(providerName) {
      return await readProviderConfig(database, providerName)
    },

    async getApiKeyStatus(providerName) {
      return await hasApiKey(database, providerName)
    },

    async listModels(options) {
      return await listProviderModelEntries(database, options.providerName, {
        all: options.all,
      })
    },

    async pinModel(options) {
      await pinModel(database, options.providerName, options.modelName)
    },

    async unpinModel(options) {
      await unpinModel(database, options.providerName, options.modelName)
    },

    async setDefaultModel(options) {
      await setDefaultModel(database, options.providerName, options.modelName)
    },

    async putApiKey(options) {
      await writeApiKey(database, options.providerName, options.key)
    },

    async deleteApiKey(providerName) {
      await deleteApiKey(database, providerName)
    },
  }
}
