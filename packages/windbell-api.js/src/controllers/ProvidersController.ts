import type * as S from "@windbell/semiosis.js"
import { err, ok } from "@windbell/std.js/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type ProvidersControllerOptions = {
  providers: S.ProvidersService
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
    list: makeAction(z.object({}), async () => {
      return ok(await options.providers.list())
    }),

    get: makeAction(GetProviderInputSchema, async (input) => {
      try {
        return ok(await options.providers.get(input.providerName))
      } catch (error) {
        return err({
          type: "provider-not-found",
          status: 404,
          message: error instanceof Error ? error.message : String(error),
          info: { providerName: input.providerName },
        })
      }
    }),

    getApiKeyStatus: makeAction(
      GetProviderApiKeyStatusInputSchema,
      async (input) => {
        return ok({
          configured: await options.providers.getApiKeyStatus(
            input.providerName,
          ),
        })
      },
    ),

    putApiKey: makeAction(PutProviderApiKeyInputSchema, async (input) => {
      await options.providers.putApiKey(input)
      return ok(null)
    }),

    deleteApiKey: makeAction(DeleteProviderApiKeyInputSchema, async (input) => {
      await options.providers.deleteApiKey(input.providerName)
      return ok(null)
    }),

    listModels: makeAction(ListProviderModelsInputSchema, async (input) => {
      return ok(await options.providers.listModels(input))
    }),

    pinModel: makeAction(PinProviderModelInputSchema, async (input) => {
      await options.providers.pinModel(input)
      return ok(null)
    }),

    unpinModel: makeAction(UnpinProviderModelInputSchema, async (input) => {
      await options.providers.unpinModel(input)
      return ok(null)
    }),

    setDefaultModel: makeAction(
      SetProviderDefaultModelInputSchema,
      async (input) => {
        await options.providers.setDefaultModel(input)
        return ok(null)
      },
    ),
  }
}
