import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"
import type {
  DeleteProviderApiKey,
  GetProvider,
  GetProviderApiKeyStatus,
  ListProviderModels,
  ListProviders,
  PinProviderModel,
  PutProviderApiKey,
  SetProviderDefaultModel,
  UnpinProviderModel,
} from "../services/Providers.ts"

export type ProvidersControllerOptions = {
  listProviders: ReturnType<typeof ListProviders>
  getProvider: ReturnType<typeof GetProvider>
  getProviderApiKeyStatus: ReturnType<typeof GetProviderApiKeyStatus>
  putProviderApiKey: ReturnType<typeof PutProviderApiKey>
  deleteProviderApiKey: ReturnType<typeof DeleteProviderApiKey>
  listProviderModels: ReturnType<typeof ListProviderModels>
  pinProviderModel: ReturnType<typeof PinProviderModel>
  unpinProviderModel: ReturnType<typeof UnpinProviderModel>
  setProviderDefaultModel: ReturnType<typeof SetProviderDefaultModel>
}

export const GetProviderInputSchema = z.object({
  providerName: z.string(),
})

export const GetProviderApiKeyStatusInputSchema = z.object({
  providerName: z.string(),
})

export const PutProviderApiKeyInputSchema = z.object({
  providerName: z.string(),
  key: z.string(),
})

export const DeleteProviderApiKeyInputSchema = z.object({
  providerName: z.string(),
})

export const ListProviderModelsInputSchema = z.object({
  providerName: z.string(),
  all: z.boolean(),
})

export const PinProviderModelInputSchema = z.object({
  providerName: z.string(),
  modelName: z.string(),
})

export const UnpinProviderModelInputSchema = z.object({
  providerName: z.string(),
  modelName: z.string(),
})

export const SetProviderDefaultModelInputSchema = z.object({
  providerName: z.string(),
  modelName: z.string(),
})

export function makeProvidersController(options: ProvidersControllerOptions) {
  return {
    list: makeAction(z.object({}), () => options.listProviders()),

    get: makeAction(GetProviderInputSchema, (input) =>
      options.getProvider(input),
    ),

    getApiKeyStatus: makeAction(GetProviderApiKeyStatusInputSchema, (input) =>
      options.getProviderApiKeyStatus(input),
    ),

    putApiKey: makeAction(PutProviderApiKeyInputSchema, (input) =>
      options.putProviderApiKey(input),
    ),

    deleteApiKey: makeAction(DeleteProviderApiKeyInputSchema, (input) =>
      options.deleteProviderApiKey(input),
    ),

    listModels: makeAction(ListProviderModelsInputSchema, (input) =>
      options.listProviderModels(input),
    ),

    pinModel: makeAction(PinProviderModelInputSchema, (input) =>
      options.pinProviderModel(input),
    ),

    unpinModel: makeAction(UnpinProviderModelInputSchema, (input) =>
      options.unpinProviderModel(input),
    ),

    setDefaultModel: makeAction(SetProviderDefaultModelInputSchema, (input) =>
      options.setProviderDefaultModel(input),
    ),
  }
}
