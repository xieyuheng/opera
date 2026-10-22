import { unwrap } from "@xieyuheng/std.ts/result"

import type { Database } from "../database/index.ts"
import { defaultProviderConfigs } from "./defaultProviderConfigs.ts"
import type { ProviderConfig } from "./ProviderConfig.ts"

export async function readProviderConfig(
  database: Database,
  providerName: string,
): Promise<ProviderConfig> {
  const defaultConfig = defaultProviderConfigs[providerName]
  if (defaultConfig === undefined) {
    throw new Error(`unknown provider: ${providerName}`)
  }

  const storedConfig = unwrap(await database.providers.get(providerName))
  if (storedConfig === undefined) return defaultConfig

  if (storedConfig.name !== providerName) {
    throw new Error(
      `provider name mismatch: expected ${providerName}, got ${storedConfig.name}`,
    )
  }

  return storedConfig
}
