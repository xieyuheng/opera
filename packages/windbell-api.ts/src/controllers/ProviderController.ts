import type * as S from "@windbell/semiosis.ts"
import { ok } from "@windbell/std.ts/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type ProviderControllerOptions = {
  providers: S.ProviderService
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

export const GetProviderModelInputSchema = z.object({
  providerName: z.string(),
  modelName: z.string().min(1),
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

export function makeProviderController(options: ProviderControllerOptions) {
  return {
    list: makeAction(z.object({}), () => options.providers.list()),

    get: makeAction(GetProviderInputSchema, (input) =>
      options.providers.get(input.providerName),
    ),

    getApiKeyStatus: makeAction(
      GetProviderApiKeyStatusInputSchema,
      async (input) => {
        const result = await options.providers.getApiKeyStatus(
          input.providerName,
        )
        if (result.kind === "ErrorResult") return result
        return ok({ configured: result.value })
      },
    ),

    putApiKey: makeAction(PutProviderApiKeyInputSchema, (input) =>
      options.providers.putApiKey(input),
    ),

    deleteApiKey: makeAction(DeleteProviderApiKeyInputSchema, (input) =>
      options.providers.deleteApiKey(input.providerName),
    ),

    listModels: makeAction(ListProviderModelsInputSchema, (input) =>
      options.providers.listModels(input),
    ),

    getModel: makeAction(GetProviderModelInputSchema, (input) =>
      options.providers.getModel(input),
    ),

    pinModel: makeAction(PinProviderModelInputSchema, (input) =>
      options.providers.pinModel(input),
    ),

    unpinModel: makeAction(UnpinProviderModelInputSchema, (input) =>
      options.providers.unpinModel(input),
    ),

    setDefaultModel: makeAction(SetProviderDefaultModelInputSchema, (input) =>
      options.providers.setDefaultModel(input),
    ),
  }
}
