import type * as DeepSeek from "../providers/deepseek/index.ts"
import type * as OpenRouter from "../providers/openrouter/index.ts"

export type ModelInfo = DeepSeek.ModelInfo | OpenRouter.ModelInfo

export type ModelEntryOf<
  ProviderName extends string,
  Config,
  Info = unknown,
> = {
  providerName: ProviderName
  name: string
  pinned: boolean
  isDefault: boolean
  config: Config | null
  info: Info | null
}

export type DeepSeekModelEntry = ModelEntryOf<
  "deepseek",
  DeepSeek.ModelConfig,
  DeepSeek.ModelInfo
>

export type OpenRouterModelEntry = ModelEntryOf<
  "openrouter",
  OpenRouter.ModelConfig,
  OpenRouter.ModelInfo
>

export type ModelEntry = DeepSeekModelEntry | OpenRouterModelEntry
