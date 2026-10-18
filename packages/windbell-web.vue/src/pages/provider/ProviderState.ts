import { windbell } from "../../app/windbell"
import type * as S from "@windbell/semiosis.ts/core"
import { reactive } from "vue"
import { cancelPendingStateLoad } from "../../utils/state/loadableState.ts"

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
  models: Array<S.ModelEntry>
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
    const data = await windbell.pages.loadProviderData({
      providerName: state.providerName,
    })

    if (requestId !== state.requestId) return

    state.providerConfig = data.providerConfig
    state.apiKeyConfigured = data.apiKeyConfigured
    state.isDefaultProvider = data.isDefaultProvider
    state.models = data.models
    state.warning = data.warning
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
    await windbell.providers.pinModel({
      providerName: state.providerName,
      modelName,
    })
    await refreshProviderModels(state)
    cancelPendingStateLoad(state)
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
    await windbell.providers.unpinModel({
      providerName: state.providerName,
      modelName,
    })
    await refreshProviderModels(state)
    cancelPendingStateLoad(state)
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
    await windbell.providers.setDefaultModel({
      providerName: state.providerName,
      modelName,
    })

    cancelPendingStateLoad(state)
    for (const entry of state.models) {
      entry.isDefault = entry.name === modelName
    }
  } finally {
    delete state.busyModelNames[modelName]
  }
}

async function refreshProviderModels(state: ProviderState): Promise<void> {
  const localModels = await windbell.providers.listModels({
    providerName: state.providerName,
  })

  if (!state.apiKeyConfigured) {
    state.models = localModels
    return
  }

  try {
    state.models = await windbell.providers.listModels({
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
  const settings = await windbell.settings.get()
  await windbell.settings.put({
    ...settings,
    defaultProvider: state.providerName,
  })

  cancelPendingStateLoad(state)
  state.isDefaultProvider = true
}

export async function putProviderApiKey(
  state: ProviderState,
  key: string,
): Promise<void> {
  await windbell.providers.putApiKey({
    providerName: state.providerName,
    key,
  })

  cancelPendingStateLoad(state)
  state.apiKeyConfigured = true
}

export async function deleteProviderApiKey(
  state: ProviderState,
): Promise<void> {
  await windbell.providers.deleteApiKey(state.providerName)
  cancelPendingStateLoad(state)
  state.apiKeyConfigured = false
}
