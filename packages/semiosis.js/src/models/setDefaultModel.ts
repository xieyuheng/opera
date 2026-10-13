import type { Database } from "../database/index.ts"
import { readProviderConfig } from "../provider/index.ts"
import { providerNames } from "../providers/providerNames.ts"
import { unwrap } from "@windbell/std.js/result"

export async function setDefaultModel(
  database: Database,
  providerName: string,
  name: string,
): Promise<void> {
  if (!(providerNames as readonly string[]).includes(providerName)) {
    throw new Error(`unsupported provider: ${providerName}`)
  }

  const providerConfig = await readProviderConfig(database, providerName)

  unwrap(
    await database.providers.put(providerName, {
      ...providerConfig,
      defaultModel: name,
    }),
  )
}
