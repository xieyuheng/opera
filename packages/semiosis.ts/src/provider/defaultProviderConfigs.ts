import type { ProviderConfig } from "./ProviderConfig.ts"

export const defaultProviderConfigs: Record<string, ProviderConfig> = {
  deepseek: {
    name: "deepseek",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-flash",
  },
  openrouter: {
    name: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openrouter/free",
  },
}
