import type * as S from "@windbell/semiosis.js"
import { err, ok, type Result } from "@windbell/std.js/result"
import type { ServiceError } from "../errors/ServiceError.ts"

export type ProvidersServiceOptions = {
  providers: S.ProvidersService
}

export function ListProviders(options: ProvidersServiceOptions) {
  return async (): Promise<Result<Array<S.ProviderConfig>, ServiceError>> => {
    return ok(await options.providers.list())
  }
}

export function GetProvider(options: ProvidersServiceOptions) {
  return async (input: {
    providerName: string
  }): Promise<Result<S.ProviderConfig, ServiceError>> => {
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
  }
}

export function GetProviderApiKeyStatus(options: ProvidersServiceOptions) {
  return async (input: {
    providerName: string
  }): Promise<Result<{ configured: boolean }, ServiceError>> => {
    return ok({
      configured: await options.providers.getApiKeyStatus(input.providerName),
    })
  }
}

export function PutProviderApiKey(options: ProvidersServiceOptions) {
  return async (input: {
    providerName: string
    key: string
  }): Promise<Result<null, ServiceError>> => {
    await options.providers.putApiKey(input)
    return ok(null)
  }
}

export function DeleteProviderApiKey(options: ProvidersServiceOptions) {
  return async (input: {
    providerName: string
  }): Promise<Result<null, ServiceError>> => {
    await options.providers.deleteApiKey(input.providerName)
    return ok(null)
  }
}

export function ListProviderModels(options: ProvidersServiceOptions) {
  return async (input: {
    providerName: string
    all: boolean
  }): Promise<Result<Array<S.ProviderModelEntry>, ServiceError>> => {
    return ok(await options.providers.listModels(input))
  }
}

export function PinProviderModel(options: ProvidersServiceOptions) {
  return async (input: {
    providerName: string
    modelName: string
  }): Promise<Result<null, ServiceError>> => {
    await options.providers.pinModel(input)
    return ok(null)
  }
}

export function UnpinProviderModel(options: ProvidersServiceOptions) {
  return async (input: {
    providerName: string
    modelName: string
  }): Promise<Result<null, ServiceError>> => {
    await options.providers.unpinModel(input)
    return ok(null)
  }
}

export function SetProviderDefaultModel(options: ProvidersServiceOptions) {
  return async (input: {
    providerName: string
    modelName: string
  }): Promise<Result<null, ServiceError>> => {
    await options.providers.setDefaultModel(input)
    return ok(null)
  }
}
