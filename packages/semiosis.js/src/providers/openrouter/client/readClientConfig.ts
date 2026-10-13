import type { Database } from "../../../database/index.ts"
import { readApiKey } from "../../../database/apiKey.ts"
import { readProviderConfig } from "../../../provider/index.ts"
import type { ClientConfig } from "./ClientConfig.ts"
import { unwrap } from "@windbell/std.js/result"

export async function readClientConfig(
  database: Database,
): Promise<ClientConfig> {
  const providerConfig = await readProviderConfig(database, "openrouter")
  const key = unwrap(await readApiKey(database, "openrouter"))

  return {
    baseUrl: providerConfig.baseUrl,
    key,
  }
}
