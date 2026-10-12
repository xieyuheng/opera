import type { Database } from "../../../database/index.ts"
import { readApiKey } from "../../../database/apiKey.ts"
import { readProviderConfig } from "../../../provider/index.ts"
import type { ClientConfig } from "./ClientConfig.ts"

export async function readClientConfig(
  database: Database,
): Promise<ClientConfig> {
  const providerConfig = await readProviderConfig(database, "deepseek")
  const key = await readApiKey(database, "deepseek")

  return {
    baseUrl: providerConfig.baseUrl,
    key,
  }
}
