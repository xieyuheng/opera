import { err, isError, ok, type Result } from "@windbell/std.ts/result"

import { deleteApiKey, hasApiKey, writeApiKey } from "../database/apiKey.ts"
import type { Database } from "../database/Database.ts"
import { listModelEntries } from "../models/listModelEntries.ts"
import type { ModelEntry } from "../models/ModelEntry.ts"
import { pinModel } from "../models/pinModel.ts"
import { setDefaultModel } from "../models/setDefaultModel.ts"
import { unpinModel } from "../models/unpinModel.ts"
import type { ProviderConfig } from "../provider/index.ts"
import { readProviderConfig } from "../provider/index.ts"
import { providerNames } from "../providers/providerNames.ts"
import {
  makeServiceError,
  makeServiceErrorFromDatabaseError,
  type ServiceError,
} from "./ServiceError.ts"

export type ProviderService = {
  list(): Promise<Result<Array<ProviderConfig>, ServiceError>>
  get(providerName: string): Promise<Result<ProviderConfig, ServiceError>>
  getApiKeyStatus(providerName: string): Promise<Result<boolean, ServiceError>>
  getModel(options: {
    providerName: string
    modelName: string
  }): Promise<Result<ModelEntry, ServiceError>>
  listModels(options: {
    providerName: string
    all?: boolean
  }): Promise<Result<Array<ModelEntry>, ServiceError>>
  pinModel(options: {
    providerName: string
    modelName: string
  }): Promise<Result<void, ServiceError>>
  unpinModel(options: {
    providerName: string
    modelName: string
  }): Promise<Result<void, ServiceError>>
  setDefaultModel(options: {
    providerName: string
    modelName: string
  }): Promise<Result<void, ServiceError>>
  putApiKey(options: {
    providerName: string
    key: string
  }): Promise<Result<void, ServiceError>>
  deleteApiKey(providerName: string): Promise<Result<void, ServiceError>>
}

export type ProviderServiceOptions = {
  database: Database
}

export function makeProviderService(
  options: ProviderServiceOptions,
): ProviderService {
  const database = options.database
  const modelCache = new Map<string, ModelEntry>()

  return {
    async list() {
      try {
        const configs: Array<ProviderConfig> = []

        for (const providerName of providerNames) {
          configs.push(await readProviderConfig(database, providerName))
        }

        return ok(configs)
      } catch (error) {
        return err(
          makeServiceError({
            type: "provider-config-invalid",
            message: error instanceof Error ? error.message : String(error),
          }),
        )
      }
    },

    async get(providerName) {
      try {
        return ok(await readProviderConfig(database, providerName))
      } catch (error) {
        return err(
          makeServiceError({
            type: "provider-not-found",
            message: error instanceof Error ? error.message : String(error),
            info: { providerName },
          }),
        )
      }
    },

    async getApiKeyStatus(providerName) {
      const result = await hasApiKey(database, providerName)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async getModel(modelOptions) {
      if (!providerNames.some((name) => name === modelOptions.providerName)) {
        return err(
          makeServiceError({
            type: "provider-not-found",
            message: `provider not found: ${modelOptions.providerName}`,
            info: { providerName: modelOptions.providerName },
          }),
        )
      }

      const keyResult = await hasApiKey(database, modelOptions.providerName)
      if (isError(keyResult)) {
        return err(makeServiceErrorFromDatabaseError(keyResult.error))
      }
      if (!keyResult.value) {
        return err(
          makeServiceError({
            type: "api-key-not-configured",
            message: `api key is not configured: ${modelOptions.providerName}`,
            info: { providerName: modelOptions.providerName },
          }),
        )
      }

      const cacheKey = `${modelOptions.providerName}\0${modelOptions.modelName}`
      const cached = modelCache.get(cacheKey)
      if (cached !== undefined) return ok(cached)

      try {
        const entries = await listModelEntries(
          database,
          modelOptions.providerName,
          { all: true },
        )
        const entry = entries.find(
          (entry) => entry.name === modelOptions.modelName,
        )

        if (entry === undefined) {
          return err(
            makeServiceError({
              type: "model-not-found",
              message: `model not found: ${modelOptions.modelName}`,
              info: {
                providerName: modelOptions.providerName,
                modelName: modelOptions.modelName,
              },
            }),
          )
        }

        modelCache.set(cacheKey, entry)
        return ok(entry)
      } catch (error) {
        return err(
          makeServiceError({
            type: "model-error",
            message: error instanceof Error ? error.message : String(error),
            info: {
              providerName: modelOptions.providerName,
              modelName: modelOptions.modelName,
            },
          }),
        )
      }
    },

    async listModels(listOptions) {
      try {
        return ok(
          await listModelEntries(database, listOptions.providerName, {
            all: listOptions.all,
          }),
        )
      } catch (error) {
        return err(
          makeServiceError({
            type: "model-error",
            message: error instanceof Error ? error.message : String(error),
            info: { providerName: listOptions.providerName },
          }),
        )
      }
    },

    async pinModel(pinOptions) {
      try {
        await pinModel(database, pinOptions.providerName, pinOptions.modelName)
        return ok(undefined)
      } catch (error) {
        return err(
          makeServiceError({
            type: "model-error",
            message: error instanceof Error ? error.message : String(error),
          }),
        )
      }
    },

    async unpinModel(unpinOptions) {
      try {
        await unpinModel(
          database,
          unpinOptions.providerName,
          unpinOptions.modelName,
        )
        return ok(undefined)
      } catch (error) {
        return err(
          makeServiceError({
            type: "model-error",
            message: error instanceof Error ? error.message : String(error),
          }),
        )
      }
    },

    async setDefaultModel(defaultOptions) {
      try {
        await setDefaultModel(
          database,
          defaultOptions.providerName,
          defaultOptions.modelName,
        )
        return ok(undefined)
      } catch (error) {
        return err(
          makeServiceError({
            type: "model-error",
            message: error instanceof Error ? error.message : String(error),
          }),
        )
      }
    },

    async putApiKey(apiKeyOptions) {
      const result = await writeApiKey(
        database,
        apiKeyOptions.providerName,
        apiKeyOptions.key,
      )
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },

    async deleteApiKey(providerName) {
      const result = await deleteApiKey(database, providerName)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },
  }
}
