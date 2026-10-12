import { makeSemiosisClient } from "@windbell/semiosis-api.js/client"
import type * as S from "@windbell/semiosis.js/node"
import { reactive } from "vue"

const semiosis = makeSemiosisClient({
  baseUrl: "/api/semiosis",
})

export type ProviderState = {
  providerName: string
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  error: string | undefined
  warning: string | undefined
  providerConfig: S.ProviderConfig | undefined
  apiKeyConfigured: boolean
  isDefaultProvider: boolean
  busyModelNames: Record<string, boolean>
  models: Array<S.ProviderModelEntry>
}

export function makeProviderState(providerName: string): ProviderState {
  return reactive<ProviderState>({
    providerName,
    hasLoaded: false,
    isLoading: true,
    isPending: false,
    requestId: 0,
    error: undefined,
    warning: undefined,
    providerConfig: undefined,
    apiKeyConfigured: false,
    isDefaultProvider: false,
    busyModelNames: {},
    models: [],
  })
}

const providerStates = new Map<string, ProviderState>()

export function getProviderState(providerName: string): ProviderState {
  let state = providerStates.get(providerName)

  if (state === undefined) {
    state = makeProviderState(providerName)
    providerStates.set(providerName, state)
  }

  return state
}

export async function loadProviderState(state: ProviderState): Promise<void> {
  const requestId = ++state.requestId

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  state.error = undefined
  state.warning = undefined

  try {
    const [providerConfigs, settings, apiKeyStatus, localModels] =
      await Promise.all([
        semiosis.providers.list(),
        semiosis.settings.get(),
        semiosis.providers.getApiKeyStatus(state.providerName),
        semiosis.providers.listModels({ providerName: state.providerName }),
      ])

    if (requestId !== state.requestId) return

    const providerConfig = providerConfigs.find(
      (providerConfig) => providerConfig.name === state.providerName,
    )

    if (providerConfig === undefined) {
      throw new Error(`provider not found: ${state.providerName}`)
    }

    let models = localModels
    let warning: string | undefined = undefined

    if (apiKeyStatus.configured) {
      try {
        models = await semiosis.providers.listModels({
          providerName: state.providerName,
          all: true,
        })

        if (requestId !== state.requestId) return
      } catch (error) {
        warning = error instanceof Error ? error.message : String(error)
      }
    } else {
      warning = "api key is not configured; showing local models only"
    }

    if (requestId !== state.requestId) return

    state.providerConfig = providerConfig
    state.apiKeyConfigured = apiKeyStatus.configured
    state.isDefaultProvider = settings.defaultProvider === state.providerName
    state.models = models
    state.warning = warning
    state.hasLoaded = true
  } catch (error) {
    if (requestId !== state.requestId) return

    state.error = error instanceof Error ? error.message : String(error)
  } finally {
    if (requestId === state.requestId) {
      state.isLoading = false
      state.isPending = false
    }
  }
}

export async function pinProviderModel(
  state: ProviderState,
  modelName: string,
): Promise<void> {
  if (state.busyModelNames[modelName] === true) return

  state.busyModelNames[modelName] = true

  try {
    await semiosis.providers.pinModel({
      providerName: state.providerName,
      modelName,
    })
    await refreshProviderModels(state)
  } finally {
    delete state.busyModelNames[modelName]
  }
}

export async function unpinProviderModel(
  state: ProviderState,
  modelName: string,
): Promise<void> {
  if (state.busyModelNames[modelName] === true) return

  state.busyModelNames[modelName] = true

  try {
    await semiosis.providers.unpinModel({
      providerName: state.providerName,
      modelName,
    })
    await refreshProviderModels(state)
  } finally {
    delete state.busyModelNames[modelName]
  }
}

export async function setDefaultProviderModel(
  state: ProviderState,
  modelName: string,
): Promise<void> {
  if (state.busyModelNames[modelName] === true) return

  state.busyModelNames[modelName] = true

  try {
    await semiosis.providers.setDefaultModel({
      providerName: state.providerName,
      modelName,
    })

    for (const entry of state.models) {
      entry.isDefault = entry.name === modelName
    }
  } finally {
    delete state.busyModelNames[modelName]
  }
}

async function refreshProviderModels(state: ProviderState): Promise<void> {
  const localModels = await semiosis.providers.listModels({
    providerName: state.providerName,
  })

  if (!state.apiKeyConfigured) {
    state.models = localModels
    return
  }

  try {
    state.models = await semiosis.providers.listModels({
      providerName: state.providerName,
      all: true,
    })
  } catch (error) {
    state.models = localModels
    state.warning = error instanceof Error ? error.message : String(error)
  }
}

export async function selectDefaultProvider(
  state: ProviderState,
): Promise<void> {
  const settings = await semiosis.settings.get()
  await semiosis.settings.put({
    ...settings,
    defaultProvider: state.providerName,
  })

  state.isDefaultProvider = true
}

export async function putProviderApiKey(
  state: ProviderState,
  key: string,
): Promise<void> {
  await semiosis.providers.putApiKey({
    providerName: state.providerName,
    key,
  })

  state.apiKeyConfigured = true
}

export async function deleteProviderApiKey(
  state: ProviderState,
): Promise<void> {
  await semiosis.providers.deleteApiKey(state.providerName)
  state.apiKeyConfigured = false
}
