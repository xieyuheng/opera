import type { Database } from "../../../database/index.ts"
import { readApiKey } from "../../../database/apiKey.ts"
import { readProviderConfig } from "../../../provider/index.ts"
import type { ClientConfig } from "./ClientConfig.ts"

export async function readClientConfig(
  database: Database,
): Promise<ClientConfig> {
  const providerConfig = await readProviderConfig(database, "openrouter")
  const key = await readApiKey(database, "openrouter")

  return {
    baseUrl: providerConfig.baseUrl,
    key,
  }
}
