export const providerNames = ["deepseek", "openrouter"] as const

export type ProviderName = (typeof providerNames)[number]
