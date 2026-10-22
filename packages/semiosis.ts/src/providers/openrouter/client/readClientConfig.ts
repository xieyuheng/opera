import { unwrap } from "@xieyuheng/std.ts/result"

import { readApiKey } from "../../../database/apiKey.ts"
import type { Database } from "../../../database/index.ts"
import { readProviderConfig } from "../../../provider/index.ts"
import type { ClientConfig } from "./ClientConfig.ts"

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
