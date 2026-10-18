import { z } from "zod"
import type { ProviderConfig } from "./ProviderConfig.ts"

const providerConfigSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().min(1),
  defaultModel: z.string().min(1).nullable(),
})

export function parseProviderConfig(value: unknown): ProviderConfig {
  const result = providerConfigSchema.safeParse(value)
  if (!result.success) {
    throw new Error(
      `[parseProviderConfig] invalid provider config: ${result.error.message}`,
    )
  }

  return result.data
}
