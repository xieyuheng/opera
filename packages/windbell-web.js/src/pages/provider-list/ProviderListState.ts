import { semiosis } from "../../app/semiosis"
import { reactive } from "vue"

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
    const [providerConfigs, settings] = await Promise.all([
      semiosis.providers.list(),
      semiosis.settings.get(),
    ])

    if (requestId !== state.requestId) return

    const providers = await Promise.all(
      providerConfigs.map(async (providerConfig) => {
        const [apiKeyStatus, models] = await Promise.all([
          semiosis.providers.getApiKeyStatus(providerConfig.name),
          semiosis.providers.listModels({ providerName: providerConfig.name }),
        ])

        return {
          name: providerConfig.name,
          baseUrl: providerConfig.baseUrl,
          defaultModel: providerConfig.defaultModel,
          apiKeyConfigured: apiKeyStatus,
          isDefaultProvider: settings.defaultProvider === providerConfig.name,
          models: models.map((model) => ({
            name: model.name,
            pinned: model.pinned,
            isDefault: providerConfig.defaultModel === model.name,
          })),
        }
      }),
    )

    if (requestId !== state.requestId) return

    state.providers = providers
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
  const settings = await semiosis.settings.get()
  await semiosis.settings.put({
    ...settings,
    defaultProvider: providerName,
  })

  for (const provider of state.providers) {
    provider.isDefaultProvider = provider.name === providerName
  }
}

export async function putProviderApiKey(
  state: ProviderListState,
  providerName: string,
  key: string,
): Promise<void> {
  await semiosis.providers.putApiKey({ providerName, key })

  const provider = state.providers.find((item) => item.name === providerName)
  if (provider !== undefined) {
    provider.apiKeyConfigured = true
  }
}

export async function deleteProviderApiKey(
  state: ProviderListState,
  providerName: string,
): Promise<void> {
  await semiosis.providers.deleteApiKey(providerName)

  const provider = state.providers.find((item) => item.name === providerName)
  if (provider !== undefined) {
    provider.apiKeyConfigured = false
  }
}
