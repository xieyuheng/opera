import { reactive } from "vue"

import { windbell } from "../../app/windbell"
import { cancelPendingStateLoad } from "../../utils/state/loadableState.ts"

export type ProviderModelLine = {
  name: string
  pinned: boolean
  isDefault: boolean
}

export type ProviderSummary = {
  name: string
  baseUrl: string
  defaultModel: string | null
  apiKeyConfigured: boolean
  isDefaultProvider: boolean
  models: Array<ProviderModelLine>
}

export type ProviderListState = {
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  error: string | undefined
  providers: Array<ProviderSummary>
}

export function makeProviderListState(): ProviderListState {
  return reactive<ProviderListState>({
    hasLoaded: false,
    isLoading: true,
    isPending: false,
    requestId: 0,
    error: undefined,
    providers: [],
  })
}

const providerListState = makeProviderListState()

export function getProviderListState(): ProviderListState {
  return providerListState
}

export async function loadProviderListState(
  state: ProviderListState,
): Promise<void> {
  const requestId = ++state.requestId

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  state.error = undefined

  try {
    const data = await windbell.pages.loadProviderListData()

    if (requestId !== state.requestId) return

    state.providers = data.providers
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

export async function selectDefaultProvider(
  state: ProviderListState,
  providerName: string,
): Promise<void> {
  const settings = await windbell.settings.get()
  await windbell.settings.put({
    ...settings,
    defaultProvider: providerName,
  })

  cancelPendingStateLoad(state)
  for (const provider of state.providers) {
    provider.isDefaultProvider = provider.name === providerName
  }
}

export async function putProviderApiKey(
  state: ProviderListState,
  providerName: string,
  key: string,
): Promise<void> {
  await windbell.providers.putApiKey({ providerName, key })

  cancelPendingStateLoad(state)
  const provider = state.providers.find((item) => item.name === providerName)
  if (provider !== undefined) {
    provider.apiKeyConfigured = true
  }
}

export async function deleteProviderApiKey(
  state: ProviderListState,
  providerName: string,
): Promise<void> {
  await windbell.providers.deleteApiKey(providerName)

  cancelPendingStateLoad(state)
  const provider = state.providers.find((item) => item.name === providerName)
  if (provider !== undefined) {
    provider.apiKeyConfigured = false
  }
}
